import { CARDS_DATA, BASE_ATTACK_RANGE, BASE_ATTACK_INTERVAL, BASE_ATTACK_DAMAGE, UNIT_FACING_CONFIG, GRID_COLS, GRID_ROWS, gridDist } from '../constants.js';
import { soundFX } from '../utils/audio.js';
import { vibrateBaseHit } from '../utils/haptics.js';

export class CombatManager {
  constructor() {
    this.units = [];
    this.projectiles = [];
    this.particles = [];
    this.aoeSplashes = [];
    this.screenWidth = 0;
    this.screenHeight = 0;

    this.blueCore = { hp: 30, maxHp: 30, x: 9, y: 29, attackCooldown: 0.5, attackFlash: 0 };
    this.redCore = { hp: 30, maxHp: 30, x: 9, y: 2, attackCooldown: 0.5, attackFlash: 0 };

    this.obstacles = [];

    this.reset();
  }

  setScreenDimensions(width, height) {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  isInsideAoECircle(centerX, centerY, targetX, targetY, radius) {
    if (this.screenWidth > 0 && this.screenHeight > 0) {
      const cellW = this.screenWidth / GRID_COLS;
      const cellH = this.screenHeight / GRID_ROWS;
      const cellScale = (cellW + cellH) / 2;
      const dxPx = (targetX - centerX) * cellW;
      const dyPx = (targetY - centerY) * cellH;
      const distPx = Math.hypot(dxPx, dyPx);
      return distPx <= (radius * cellScale);
    }
    return gridDist({ x: centerX, y: centerY }, { x: targetX, y: targetY }) <= radius;
  }

  reset() {
    this.units = [];
    this.projectiles = [];
    this.particles = [];
    this.aoeSplashes = [];
    this.blueCore = { hp: 30, maxHp: 30, x: 9, y: 29, attackCooldown: 0.5, attackFlash: 0, hitShakeTimer: 0 };
    this.redCore = { hp: 30, maxHp: 30, x: 9, y: 2, attackCooldown: 0.5, attackFlash: 0, hitShakeTimer: 0 };

    // Dynamic paper ink blot obstacles (e.g. spawned in-game or via events)
    this.obstacles = [];
  }

  spawnObstacle(x, y, hp = 5) {
    const obs = {
      id: `blot_${Date.now()}_${Math.random()}`,
      x,
      y,
      hp,
      maxHp: hp,
      active: true,
    };
    this.obstacles.push(obs);
    return obs;
  }

  spawnUnit(type, team, path) {
    const card = CARDS_DATA[type];
    if (!card) return [];

    const startCoord = path.length > 0 ? path[0] : (team === 'blue' ? { x: 9, y: 30 } : { x: 9, y: 4 });
    const initialAngle = path.length > 1
      ? Math.atan2(path[1].y - path[0].y, path[1].x - path[0].x)
      : (team === 'blue' ? -Math.PI / 2 : Math.PI / 2);

    if (type === 'scribblers') {
      // Swarm of 4 tiny triangles
      const spawned = [];
      const offsets = [
        { dx: -0.28, dy: -0.28 },
        { dx: 0.28, dy: -0.28 },
        { dx: -0.28, dy: 0.28 },
        { dx: 0.28, dy: 0.28 },
      ];

      offsets.forEach((offset, idx) => {
        const u = {
          id: `unit_${team}_${type}_${Date.now()}_${idx}`,
          type,
          team,
          x: startCoord.x + offset.dx,
          y: startCoord.y + offset.dy,
          hp: card.hp,
          maxHp: card.hp,
          damage: card.damage,
          speed: card.speed,
          attackRange: card.attackRange,
          detectRange: card.detectRange,
          attackCooldown: 0,
          attackInterval: card.attackSpeed,
          path: [...path],
          currentPathIndex: 0,
          targetId: null,
          angle: initialAngle,
          state: 'moving',
          deathTimer: 0,
          attackAnimTimer: 0,
          hitShakeTimer: 0,
          isScribblerSub: true,
          formationOffset: offset,
        };
        spawned.push(u);
        this.units.push(u);
      });
      return spawned;
    }

    const unit = {
      id: `unit_${team}_${type}_${Date.now()}_${Math.random()}`,
      type,
      team,
      x: startCoord.x,
      y: startCoord.y,
      hp: card.hp,
      maxHp: card.hp,
      damage: card.damage,
      speed: card.speed,
      attackRange: card.attackRange,
      detectRange: card.detectRange,
      attackCooldown: 0,
      attackInterval: card.attackSpeed,
      path: [...path],
      currentPathIndex: 0,
      targetId: null,
      angle: initialAngle,
      state: 'moving',
      deathTimer: 0,
      attackAnimTimer: 0,
      hitShakeTimer: 0,
      aoeRadius: card.aoeRadius || (type === 'splat' ? 2.0 : undefined),
    };

    this.units.push(unit);
    return [unit];
  }

  update(dt, bottles, onInkAwarded) {
    // 1. Update base auto-attack defenses
    this.updateBaseDefenses(dt, bottles, onInkAwarded);

    // 2. Update existing projectiles
    this.updateProjectiles(dt, bottles, onInkAwarded);

    // 3. Update splat particles (eraser/ink crumples)
    this.updateParticles(dt);

    // 3.5. Update AoE splash circles
    this.updateAoESplashes(dt);

    // 4. Process units
    for (const unit of this.units) {
      if (unit.state === 'dying') {
        unit.deathTimer = Math.max(0, unit.deathTimer - dt * 4.0);
        continue;
      }

      if (unit.attackCooldown > 0) {
        unit.attackCooldown = Math.max(0, unit.attackCooldown - dt);
      }

      // Decrement juicy attack animation and hit shake timers
      if (unit.attackAnimTimer > 0) {
        unit.attackAnimTimer = Math.max(0, unit.attackAnimTimer - dt);
      }
      if (unit.hitShakeTimer > 0) {
        unit.hitShakeTimer = Math.max(0, unit.hitShakeTimer - dt);
      }

      // Detect / combat logic for all units (including wall)
      this.updateCombatUnit(unit, dt, bottles, onInkAwarded);
    }

    // Filter out fully erased units
    this.units = this.units.filter((u) => !(u.state === 'dying' && u.deathTimer <= 0));
  }

  // Scribbler subs keep steering toward their own offset point (not the literal
  // target/waypoint coordinate) so the swarm stays visually spread out instead of
  // converging onto a single pixel. No-op for every other unit type.
  applyFormationOffset(unit, x, y) {
    if (unit.isScribblerSub && unit.formationOffset) {
      return { x: x + unit.formationOffset.dx, y: y + unit.formationOffset.dy };
    }
    return { x, y };
  }

  updateCombatUnit(unit, dt, bottles, onInkAwarded) {
    const oppTeam = unit.team === 'blue' ? 'red' : 'blue';
    const oppCore = unit.team === 'blue' ? this.redCore : this.blueCore;

    // Search for closest target: enemy units, active obstacles, bottles in path, or enemy Core
    let bestTarget = null;
    let minDistance = 9999;

    // A) Enemy units
    for (const other of this.units) {
      if (other.team === oppTeam && other.state !== 'dying') {
        const d = gridDist(unit, other);
        if (d < minDistance) {
          minDistance = d;
          bestTarget = { x: other.x, y: other.y, id: other.id, type: 'unit', dist: d };
        }
      }
    }

    // B) Obstacles
    for (const obs of this.obstacles) {
      if (obs.active) {
        const d = gridDist(unit, obs);
        if (d <= unit.detectRange && d < minDistance) {
          minDistance = d;
          bestTarget = { x: obs.x, y: obs.y, id: obs.id, type: 'obstacle', dist: d };
        }
      }
    }

    // C) Ink Bottles (Stationary targets that can be hit)
    for (const bot of bottles) {
      if (bot.active) {
        const d = gridDist(unit, bot);
        if (d <= unit.detectRange && d < minDistance) {
          minDistance = d;
          bestTarget = { x: bot.x, y: bot.y, id: bot.id, type: 'bottle', dist: d };
        }
      }
    }

    // D) Enemy Core
    if (oppCore.hp > 0) {
      const dCore = gridDist(unit, oppCore);
      if (dCore <= unit.detectRange && dCore < minDistance) {
        minDistance = dCore;
        bestTarget = { x: oppCore.x, y: oppCore.y, id: 'opp_core', type: 'core', dist: dCore };
      }
    }

    const isRanged = unit.type === 'ranger' || unit.type === 'splat';
    const effectiveAttackRange = bestTarget && bestTarget.type === 'obstacle'
      ? unit.attackRange + 0.35
      : unit.attackRange;

    // Check if target is within attack range
    if (bestTarget && bestTarget.dist <= effectiveAttackRange) {
      unit.state = 'attacking';
      unit.targetId = bestTarget.id;

      // Point 2: unit when attacking should always face direction of the target
      if (UNIT_FACING_CONFIG.FACE_TARGET_DIRECTION) {
        unit.angle = Math.atan2(bestTarget.y - unit.y, bestTarget.x - unit.x);
      }

      if (unit.attackCooldown <= 0) {
        this.performAttack(unit, bestTarget, bottles, onInkAwarded);
        unit.attackCooldown = unit.attackInterval;
      }
      return;
    }

    // Check if melee unit should chase target within detect range
    if (!isRanged && bestTarget && bestTarget.dist <= unit.detectRange) {
      unit.state = 'chasing';
      unit.targetId = bestTarget.id;
      const chaseAim = this.applyFormationOffset(unit, bestTarget.x, bestTarget.y);
      const angle = Math.atan2(chaseAim.y - unit.y, chaseAim.x - unit.x);

      // Point 1: unit when moving should always face direction of the movement
      if (UNIT_FACING_CONFIG.FACE_MOVEMENT_DIRECTION) {
        unit.angle = angle;
      }

      const step = unit.speed * dt;
      unit.x += Math.cos(angle) * step;
      unit.y += Math.sin(angle) * step;
      return;
    }

    // Otherwise, follow the drawn path coordinates
    unit.targetId = null;
    if (unit.path.length > 0 && unit.currentPathIndex < unit.path.length) {
      const targetNode = unit.path[unit.currentPathIndex];
      const waypointAim = this.applyFormationOffset(unit, targetNode.x, targetNode.y);
      const dist = gridDist(unit, waypointAim);

      if (dist < 0.3) {
        unit.currentPathIndex++;
        if (unit.currentPathIndex < unit.path.length && UNIT_FACING_CONFIG.FACE_MOVEMENT_DIRECTION) {
          const nextNode = unit.path[unit.currentPathIndex];
          const nextAim = this.applyFormationOffset(unit, nextNode.x, nextNode.y);
          unit.angle = Math.atan2(nextAim.y - unit.y, nextAim.x - unit.x);
        }
      } else {
        unit.state = 'moving';
        const angle = Math.atan2(waypointAim.y - unit.y, waypointAim.x - unit.x);

        // Point 1: unit when moving should always face direction of the movement
        if (UNIT_FACING_CONFIG.FACE_MOVEMENT_DIRECTION) {
          unit.angle = angle;
        }

        const step = unit.speed * dt;
        unit.x += Math.cos(angle) * step;
        unit.y += Math.sin(angle) * step;
      }
    } else {
      // Completed path: march toward enemy core!
      const coreAim = this.applyFormationOffset(unit, oppCore.x, oppCore.y);
      const angle = Math.atan2(coreAim.y - unit.y, coreAim.x - unit.x);
      const distCore = gridDist(unit, oppCore);
      if (distCore > unit.attackRange) {
        unit.state = 'moving';

        // Point 1: unit when moving should always face direction of the movement
        if (UNIT_FACING_CONFIG.FACE_MOVEMENT_DIRECTION) {
          unit.angle = angle;
        }

        const step = unit.speed * dt;
        unit.x += Math.cos(angle) * step;
        unit.y += Math.sin(angle) * step;
      } else {
        unit.state = 'attacking';

        // Point 2: unit when attacking should always face direction of the target
        if (UNIT_FACING_CONFIG.FACE_TARGET_DIRECTION) {
          unit.angle = angle;
        }

        if (unit.attackCooldown <= 0) {
          this.performAttack(unit, { x: oppCore.x, y: oppCore.y, id: 'opp_core', type: 'core', dist: distCore }, bottles, onInkAwarded);
          unit.attackCooldown = unit.attackInterval;
        }
      }
    }
  }

  performAttack(attacker, target, bottles, onInkAwarded) {
    // Ensure attacker faces target direction during attack execution
    if (UNIT_FACING_CONFIG.FACE_TARGET_DIRECTION && target) {
      attacker.angle = Math.atan2(target.y - attacker.y, target.x - attacker.x);
    }

    // Trigger juicy attack lunge & strike animation on the attacker
    attacker.attackAnimTimer = 0.24;

    if (attacker.type === 'ranger') {
      // Spawn ranger bullet projectile
      this.projectiles.push({
        id: `proj_${Date.now()}_${Math.random()}`,
        startX: attacker.x,
        startY: attacker.y,
        targetX: target.x,
        targetY: target.y,
        progress: 0,
        team: attacker.team,
        type: 'bullet',
        damage: attacker.damage,
      });
      soundFX.playHit();
      return;
    }

    if (attacker.type === 'splat') {
      // Spawn splat lob projectile with AoE
      this.projectiles.push({
        id: `proj_${Date.now()}_${Math.random()}`,
        startX: attacker.x,
        startY: attacker.y,
        targetX: target.x,
        targetY: target.y,
        progress: 0,
        team: attacker.team,
        type: 'splat',
        damage: attacker.damage,
        aoeRadius: attacker.aoeRadius || 2.0,
      });
      soundFX.playSplat();
      return;
    }

    // Direct melee damage (Bulker, Speeder, Scribblers, Wall)
    this.applyDamageToTarget(attacker.team, target, attacker.damage, bottles, onInkAwarded);
    if (target.type !== 'core') {
      soundFX.playHit();
    }
    this.spawnInkBurst(target.x, target.y, attacker.team, 4);
  }

  applyDamageToTarget(attackerTeam, target, damage, bottles, onInkAwarded) {
    if (target.type === 'unit') {
      const u = this.units.find((item) => item.id === target.id);
      if (u && u.state !== 'dying') {
        u.hitShakeTimer = 0.18; // Trigger juicy impact micro-shake on damaged unit
        u.hp -= damage;
        if (u.hp <= 0) {
          u.state = 'dying';
          u.deathTimer = 1.0;
          this.spawnSmudgeEraser(u.x, u.y, u.team);
        }
      }
    } else if (target.type === 'obstacle') {
      const obs = this.obstacles.find((item) => item.id === target.id);
      if (obs && obs.active) {
        obs.hp -= damage;
        if (obs.hp <= 0) {
          obs.active = false;
          this.spawnInkBurst(obs.x, obs.y, 'neutral', 12);
        }
      }
    } else if (target.type === 'bottle') {
      const bot = bottles.find((item) => item.id === target.id);
      if (bot && bot.active) {
        bot.hp -= damage;
        if (bot.hp <= 0) {
          bot.active = false;
          bot.destroyAnim = 1.0;
          bot.lastHitTeam = attackerTeam; // Last hit = winner of the ink!
          const reward = bot.inkReward || bot.maxHp || 1;
          soundFX.playBottle(reward);
          this.spawnInkBurst(bot.x, bot.y, 'ink', 12 + reward * 4);
          this.spawnInkCollectTrail(bot.x, bot.y, attackerTeam, reward);
          if (onInkAwarded) {
            onInkAwarded(attackerTeam, reward); // Award ink to whichever team landed the killing blow
          }
        }
      }
    } else if (target.type === 'core') {
      const isOurBase = attackerTeam === 'red'; // Red attacker damages our blue core
      const core = attackerTeam === 'blue' ? this.redCore : this.blueCore;
      const prevHp = core.hp;
      core.hp = Math.max(0, core.hp - damage);
      core.hitShakeTimer = 0.24;
      this.spawnInkBurst(core.x, core.y, attackerTeam, 8);

      // Play distinct audio for our base taking damage vs enemy base taking damage
      if (prevHp > 0) {
        if (isOurBase) {
          soundFX.playOurBaseDamage();
          vibrateBaseHit(core.hp, core.maxHp);
        } else {
          soundFX.playEnemyBaseDamage();
        }
      }
    }
  }

  updateBaseDefenses(dt, bottles, onInkAwarded) {
    this.updateSingleBaseDefense(this.blueCore, 'blue', 'red', dt, bottles, onInkAwarded);
    this.updateSingleBaseDefense(this.redCore, 'red', 'blue', dt, bottles, onInkAwarded);
  }

  updateSingleBaseDefense(core, team, enemyTeam, dt, bottles, onInkAwarded) {
    if (core.attackFlash > 0) {
      core.attackFlash = Math.max(0, core.attackFlash - dt);
    }
    if (core.hitShakeTimer > 0) {
      core.hitShakeTimer = Math.max(0, core.hitShakeTimer - dt);
    }

    if (core.hp <= 0) return;

    if (core.attackCooldown > 0) {
      core.attackCooldown = Math.max(0, core.attackCooldown - dt);
    }

    if (core.attackCooldown <= 0) {
      // Find nearest alive enemy unit within base attack range
      let nearestUnit = null;
      let minDist = BASE_ATTACK_RANGE;

      for (const u of this.units) {
        if (u.team === enemyTeam && u.state !== 'dying') {
          const d = gridDist(core, u);
          if (d <= minDist) {
            minDist = d;
            nearestUnit = u;
          }
        }
      }

      if (nearestUnit) {
        core.attackCooldown = BASE_ATTACK_INTERVAL;
        core.attackFlash = 0.25;

        // Turret launch position
        const launchY = team === 'blue' ? core.y - 0.7 : core.y + 0.7;

        this.projectiles.push({
          id: `base_bolt_${Date.now()}_${Math.random()}`,
          startX: core.x,
          startY: launchY,
          targetX: nearestUnit.x,
          targetY: nearestUnit.y,
          targetId: nearestUnit.id,
          progress: 0,
          team,
          type: 'base_bolt',
          damage: BASE_ATTACK_DAMAGE,
        });

        soundFX.playHit();
      }
    }
  }

  updateProjectiles(dt, bottles, onInkAwarded) {
    for (const p of this.projectiles) {
      // Dynamic tracking if targetId is active
      if (p.targetId) {
        const tracked = this.units.find((u) => u.id === p.targetId && u.state !== 'dying');
        if (tracked) {
          p.targetX = tracked.x;
          p.targetY = tracked.y;
        }
      }

      const speed = p.type === 'base_bolt' ? 26.0 : p.type === 'bullet' ? 24.0 : 14.0; // grid cells per sec (crisp, high-velocity fly speed)
      const totalDist = gridDist({ x: p.startX, y: p.startY }, { x: p.targetX, y: p.targetY });
      const step = (speed * dt) / Math.max(totalDist, 0.1);
      p.progress += step;

      if (p.progress >= 1.0) {
        // Detonate / hit
        if (p.type === 'splat' && p.aoeRadius) {
          this.detonateAoESplat(p, bottles, onInkAwarded);
        } else {
          // Single target impact: check targetId first, fallback to nearest target
          let target = null;
          if (p.targetId) {
            const u = this.units.find((item) => item.id === p.targetId && item.state !== 'dying');
            if (u) {
              target = { x: u.x, y: u.y, id: u.id, type: 'unit' };
            }
          }
          if (!target) {
            target = this.findNearestTargetAt(p.targetX, p.targetY, p.team, bottles);
          }

          if (target) {
            this.applyDamageToTarget(p.team, target, p.damage, bottles, onInkAwarded);
            if (p.type === 'base_bolt') {
              this.spawnInkBurst(target.x, target.y, p.team, 6);
            }
          }
        }
      }
    }

    this.projectiles = this.projectiles.filter((p) => p.progress < 1.0);
  }

  detonateAoESplat(p, bottles, onInkAwarded) {
    const oppTeam = p.team === 'blue' ? 'red' : 'blue';
    const radius = p.aoeRadius || 2.0;
    soundFX.playSplat();
    this.spawnInkBurst(p.targetX, p.targetY, p.team, 18);
    this.spawnAoESplash(p.targetX, p.targetY, radius, p.team, p.damage);

    // Damage all enemy units in splash radius (exact circle match)
    for (const u of this.units) {
      if (u.team === oppTeam && u.state !== 'dying') {
        if (this.isInsideAoECircle(p.targetX, p.targetY, u.x, u.y, radius)) {
          this.applyDamageToTarget(p.team, { x: u.x, y: u.y, id: u.id, type: 'unit' }, p.damage, bottles, onInkAwarded);
        }
      }
    }

    // Damage obstacles
    for (const obs of this.obstacles) {
      if (obs.active && this.isInsideAoECircle(p.targetX, p.targetY, obs.x, obs.y, radius)) {
        this.applyDamageToTarget(p.team, { x: obs.x, y: obs.y, id: obs.id, type: 'obstacle' }, p.damage, bottles, onInkAwarded);
      }
    }

    // Damage bottles
    for (const bot of bottles) {
      if (bot.active && this.isInsideAoECircle(p.targetX, p.targetY, bot.x, bot.y, radius)) {
        this.applyDamageToTarget(p.team, { x: bot.x, y: bot.y, id: bot.id, type: 'bottle' }, p.damage, bottles, onInkAwarded);
      }
    }

    // Damage core if in radius
    const oppCore = p.team === 'blue' ? this.redCore : this.blueCore;
    if (oppCore.hp > 0 && this.isInsideAoECircle(p.targetX, p.targetY, oppCore.x, oppCore.y, radius)) {
      this.applyDamageToTarget(p.team, { x: oppCore.x, y: oppCore.y, id: 'opp_core', type: 'core' }, p.damage, bottles, onInkAwarded);
    }
  }

  spawnAoESplash(gx, gy, radius, team, damage) {
    const dropletCount = 14;
    const droplets = [];
    for (let i = 0; i < dropletCount; i++) {
      const baseAngle = (i / dropletCount) * Math.PI * 2;
      const angle = baseAngle + (Math.random() - 0.5) * 0.28;
      const distRatio = 0.94 + Math.random() * 0.22;
      const size = 1.8 + Math.random() * 2.6;
      droplets.push({ angle, distRatio, size });
    }

    this.aoeSplashes.push({
      id: `aoe_${Date.now()}_${Math.random()}`,
      x: gx,
      y: gy,
      radius,
      team,
      damage,
      duration: 0.65,
      life: 0.65,
      droplets,
    });
  }

  updateAoESplashes(dt) {
    for (const s of this.aoeSplashes) {
      s.life = Math.max(0, s.life - dt);
    }
    this.aoeSplashes = this.aoeSplashes.filter((s) => s.life > 0);
  }

  findNearestTargetAt(x, y, attackerTeam, bottles) {
    const oppTeam = attackerTeam === 'blue' ? 'red' : 'blue';
    let nearest = null;
    let minDist = 2.0;

    for (const u of this.units) {
      if (u.team === oppTeam && u.state !== 'dying') {
        const d = gridDist({ x, y }, u);
        if (d < minDist) {
          minDist = d;
          nearest = { x: u.x, y: u.y, id: u.id, type: 'unit' };
        }
      }
    }

    for (const obs of this.obstacles) {
      if (obs.active) {
        const d = gridDist({ x, y }, obs);
        if (d < minDist) {
          minDist = d;
          nearest = { x: obs.x, y: obs.y, id: obs.id, type: 'obstacle' };
        }
      }
    }

    for (const bot of bottles) {
      if (bot.active) {
        const d = gridDist({ x, y }, bot);
        if (d < minDist) {
          minDist = d;
          nearest = { x: bot.x, y: bot.y, id: bot.id, type: 'bottle' };
        }
      }
    }

    const oppCore = attackerTeam === 'blue' ? this.redCore : this.blueCore;
    const dCore = gridDist({ x, y }, oppCore);
    if (dCore < minDist) {
      nearest = { x: oppCore.x, y: oppCore.y, id: 'core', type: 'core' };
    }

    return nearest;
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.prevX = p.x;
      p.prevY = p.y;

      if (p.seek) {
        // Homing ink droplet: steers straight toward the capturing player's base
        const dx = p.seek.x - p.x;
        const dy = p.seek.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.2) {
          const step = Math.min(dist, p.seekSpeed * dt);
          p.x += (dx / dist) * step;
          p.y += (dy / dist) * step;
          p.life = Math.max(0, p.life - dt * p.decayRate);
        } else {
          p.life = 0; // Arrived at the base — vanish
        }
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life = Math.max(0, p.life - dt * 4.5);
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  spawnInkBurst(gx, gy, team, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.8 + Math.random() * 4.5;
      this.particles.push({
        id: `part_${Date.now()}_${Math.random()}`,
        x: gx,
        y: gy,
        team,
        radius: 2 + Math.random() * 3,
        life: 1.0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }
  }

  // Ink droplets that trail from a captured bottle to the winning team's base,
  // leaving the bottle itself in place (its own pop/fade animation is unaffected).
  spawnInkCollectTrail(gx, gy, team, reward = 1) {
    const target = team === 'blue' ? this.blueCore : this.redCore;
    const dropletCount = 5 + reward * 3; // more droplets for bigger tiers

    for (let i = 0; i < dropletCount; i++) {
      const startDelayJitterX = (Math.random() - 0.5) * 0.7;
      const startDelayJitterY = (Math.random() - 0.5) * 0.7;
      const targetJitterX = (Math.random() - 0.5) * 1.4;
      const targetJitterY = (Math.random() - 0.5) * 1.4;

      this.particles.push({
        id: `inktrail_${Date.now()}_${i}_${Math.random()}`,
        x: gx + startDelayJitterX,
        y: gy + startDelayJitterY,
        team,
        radius: 1.6 + Math.random() * 1.8,
        life: 1.0,
        trail: true,
        seek: { x: target.x + targetJitterX, y: target.y + targetJitterY },
        seekSpeed: (9 + Math.random() * 5) * 1.5,
        decayRate: (0.5 + Math.random() * 0.2) * 1.5,
      });
    }
  }

  spawnSmudgeEraser(gx, gy, team) {
    // Crumpled pencil/ink smudge particles
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 3.8;
      this.particles.push({
        id: `smudge_${Date.now()}_${Math.random()}`,
        x: gx,
        y: gy,
        team,
        radius: 3 + Math.random() * 4,
        life: 1.0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }
  }
}
