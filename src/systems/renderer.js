import { GRID_COLS, GRID_ROWS, DRAW_ON_GRID_LINES, BASE_ATTACK_RANGE, gridToScreen } from '../constants.js';
import { drawUnitVisual } from './unitDrawers.js';

export class NotebookRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.width = 0;
    this.height = 0;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  render(
    units,
    bottles,
    obstacles,
    projectiles,
    particles,
    blueCore,
    redCore,
    drawState,
    botDrawnPath,
    showGridLines = false,
    aoeSplashes = []
  ) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw notebook paper texture & ruled lines
    this.drawNotebookPaper(showGridLines);

    // 2. Draw neutral obstacles (ink blots)
    this.drawObstacles(obstacles);

    // 3. Draw ink bottles
    this.drawInkBottles(bottles);

    // 4. Draw player and opponent Cores
    this.drawCores(blueCore, redCore);

    // 5. Draw active Bot ink path
    if (botDrawnPath) {
      this.drawBotPath(botDrawnPath);
    }

    // 6. Draw player's current drawn ink trail
    if (drawState && (drawState.isDrawing || drawState.gridNodes.length > 0)) {
      this.drawPlayerPath(drawState);
    }

    // 7. Draw in-flight AoE targeting reticle on ground
    this.drawAoETargeting(projectiles);

    // 8. Draw active AoE splash damage circles on the ground
    if (aoeSplashes && aoeSplashes.length > 0) {
      this.drawAoESplashes(aoeSplashes);
    }

    // 9. Draw units and health bars
    this.drawUnits(units);

    // 10. Draw flying projectiles
    this.drawProjectiles(projectiles);

    // 11. Draw particles & smudge splatters
    this.drawParticles(particles);
  }

  drawNotebookPaper(showGrid) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 1. Math notebook paper background with warm off-white sketch tint
    ctx.fillStyle = '#faf7ee';
    ctx.fillRect(0, 0, w, h);

    // Subtle paper grain stipple
    ctx.fillStyle = 'rgba(0, 0, 0, 0.012)';
    for (let y = 0; y < h; y += 6) {
      ctx.fillRect(0, y, w, 1);
    }

    const cellW = w / GRID_COLS;
    const cellH = h / GRID_ROWS;

    // 2. Squared (graph) paper grid lines - soft math notebook blue/grey ink
    // When DRAW_ON_GRID_LINES is enabled, offset grid lines by half a cell so all drawn paths, nodes, and units sit directly ON the grid lines
    const offsetRatio = DRAW_ON_GRID_LINES ? 0.5 : 0;
    const maxCols = DRAW_ON_GRID_LINES ? GRID_COLS : GRID_COLS + 1;
    const maxRows = DRAW_ON_GRID_LINES ? GRID_ROWS : GRID_ROWS + 1;

    ctx.lineWidth = 0.75;
    for (let c = 0; c < maxCols; c++) {
      const x = (c + offsetRatio) * cellW;
      const isMajor = c % 6 === 0;
      ctx.strokeStyle = isMajor ? 'rgba(130, 160, 195, 0.55)' : 'rgba(150, 180, 210, 0.38)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let r = 0; r < maxRows; r++) {
      const y = (r + offsetRatio) * cellH;
      const isMajor = r % 8 === 0;
      ctx.strokeStyle = isMajor ? 'rgba(130, 160, 195, 0.55)' : 'rgba(150, 180, 210, 0.38)';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 3. Left vertical red margin line (notebook spine margin)
    const marginX = (2 + offsetRatio) * cellW;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(marginX, 0);
    ctx.lineTo(marginX, h);
    ctx.stroke();

    // 4. Center arena divider dashed line
    const midY = 16 * cellH;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Highlight active deployment bounds or debug grid if enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.4)';
      ctx.lineWidth = 1;
      for (let c = 0; c < maxCols; c++) {
        const x = (c + offsetRatio) * cellW;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let r = 0; r < maxRows; r++) {
        const y = (r + offsetRatio) * cellH;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }
  }

  drawObstacles(obstacles) {
    const ctx = this.ctx;
    const cellW = this.width / GRID_COLS;
    // 2x smaller than previous (compact ink blot)
    const rad = cellW * 0.98;

    for (const obs of obstacles) {
      if (!obs.active) continue;
      const pt = gridToScreen(obs.x, obs.y, this.width, this.height);

      ctx.save();
      ctx.translate(pt.x, pt.y);

      // Organic 10-point hand-drawn ink puddle / blot
      ctx.fillStyle = 'rgba(30, 30, 38, 0.92)';
      ctx.beginPath();
      const points = 10;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wobble = 0.84 + 0.2 * Math.sin(i * 3 + 1.2);
        const px = Math.cos(angle) * (rad * wobble);
        const py = Math.sin(angle) * (rad * wobble);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Surrounding organic ink droplets around the blot
      const droplets = [
        { dx: rad * 0.9, dy: rad * 0.35, r: rad * 0.12 },
        { dx: -rad * 0.85, dy: -rad * 0.4, r: rad * 0.11 },
        { dx: rad * 0.35, dy: -rad * 0.9, r: rad * 0.13 },
      ];
      ctx.fillStyle = 'rgba(30, 30, 38, 0.85)';
      droplets.forEach((d) => {
        ctx.beginPath();
        ctx.arc(d.dx, d.dy, d.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Hand-drawn crosshatch pencil texture
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-rad * 0.45, -rad * 0.3);
      ctx.lineTo(rad * 0.45, rad * 0.3);
      ctx.moveTo(-rad * 0.3, rad * 0.4);
      ctx.lineTo(rad * 0.35, -rad * 0.4);
      ctx.stroke();

      // Centered HP badge
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${obs.hp} HP`, 0, 0);

      ctx.restore();
    }
  }

  drawInkBottles(bottles) {
    const ctx = this.ctx;
    const cellW = this.width / GRID_COLS;
    const baseSize = cellW * 0.85 * 1.5;

    for (const bot of bottles) {
      if (!bot.active && bot.destroyAnim <= 0) continue;
      const pt = gridToScreen(bot.x, bot.y, this.width, this.height);

      const reward = bot.inkReward || bot.maxHp || 1;
      const maxHp = bot.maxHp || reward;
      const hp = Math.max(0, bot.hp);

      // Subtle scaling based on tier (1, 2, or 3)
      const tierScale = reward === 3 ? 1.12 : reward === 2 ? 1.0 : 0.88;
      const size = baseSize * tierScale;

      ctx.save();
      ctx.translate(pt.x, pt.y);

      if (!bot.active) {
        const animProgress = Math.max(0, Math.min(1, 1 - bot.destroyAnim));
        // Elastic bump scale animation: scales up sharply to ~1.45x then pops into dust
        const bump = Math.sin(animProgress * Math.PI);
        const scale = 1 + bump * 0.45;
        ctx.globalAlpha = Math.max(0, bot.destroyAnim);
        ctx.scale(scale, scale);

        // Rising floating indicator showing last-hit winner and reward.
        // Font size scales with reward tier (bigger pop for +3, smaller for +1).
        ctx.save();
        const rewardFontSize = 10 + reward * 3; // 13px / 16px / 19px for tier 1 / 2 / 3
        ctx.font = `bold ${rewardFontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;

        const label = bot.lastHitTeam === 'red' ? `ENEMY +${reward} INK!` : `+${reward} INK!`;
        const textY = -size * (0.7 + animProgress * 1.4);

        // White outline first for strong contrast against the notebook page background
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = bot.lastHitTeam === 'red' ? 'rgba(248, 113, 113, 0.9)' : 'rgba(56, 189, 248, 0.9)';
        ctx.shadowBlur = 8;
        ctx.strokeText(label, 0, textY);

        ctx.fillStyle = bot.lastHitTeam === 'red' ? '#dc2626' : '#0369a1';
        ctx.fillText(label, 0, textY);
        ctx.restore();
      }

      // Bottle base
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(-size * 0.4, -size * 0.3, size * 0.8, size * 0.8, 3);
      } else {
        ctx.rect(-size * 0.4, -size * 0.3, size * 0.8, size * 0.8);
      }
      ctx.fill();

      // Liquid shine inside bottle
      const liquidColor = reward === 3 ? '#38bdf8' : reward === 2 ? '#0284c7' : '#0369a1';
      ctx.fillStyle = liquidColor;
      ctx.fillRect(-size * 0.32, size * 0.12, size * 0.64, size * 0.32);

      // Bottle neck & cork
      ctx.fillStyle = reward === 3 ? '#d97706' : '#b45309'; // Richer cork for tier 3
      ctx.fillRect(-size * 0.2, -size * 0.55, size * 0.4, size * 0.25);

      // Tier 3 golden ring trim on neck
      if (reward === 3) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-size * 0.22, -size * 0.38, size * 0.44, size * 0.08);
      }

      // Label: +1 INK / +2 INK / +3 INK — scales up with tier, dark outline for contrast
      const bottleLabelFontSize = 7 + reward * 2; // 9px / 11px / 13px for tier 1 / 2 / 3
      ctx.font = `bold ${bottleLabelFontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeText(`+${reward} INK`, 0, -size * 0.05);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`+${reward} INK`, 0, -size * 0.05);

      // Stationary hovering HP label cleanly over occupied grid cell
      const hpColor = hp < maxHp ? '#f59e0b' : '#0284c7'; // Orange if damaged (call to last-hit!)
      ctx.fillStyle = hpColor;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const hpText = `${hp}/${maxHp}`;
      ctx.fillText(hpText, 0, -size * 0.72);

      // Mini HP bar for all bottle tiers (1, 2 & 3 HP) — for tier 1 it's simply
      // always full (or gone entirely once destroyed), matching its 1-hit nature.
      const barW = size * 0.8;
      const barH = 3;
      const barY = -size * 0.58;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.fillRect(-barW * 0.5, barY, barW, barH);

      const hpPct = Math.max(0, Math.min(1, hp / maxHp));
      ctx.fillStyle = hpColor;
      ctx.fillRect(-barW * 0.5, barY, barW * hpPct, barH);

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(-barW * 0.5, barY, barW, barH);

      ctx.restore();
    }
  }

  drawCores(blueCore, redCore) {
    // 1. Red Core (Top)
    const redPt = gridToScreen(redCore.x, redCore.y, this.width, this.height);
    this.drawSingleCore(redPt.x, redPt.y, redCore.hp, redCore.maxHp, 'red', redCore.attackFlash, redCore.hitShakeTimer || 0);

    // 2. Blue Core (Bottom)
    const bluePt = gridToScreen(blueCore.x, blueCore.y, this.width, this.height);
    this.drawSingleCore(bluePt.x, bluePt.y, blueCore.hp, blueCore.maxHp, 'blue', blueCore.attackFlash, blueCore.hitShakeTimer || 0);
  }

  drawSingleCore(cx, cy, hp, maxHp, team, attackFlash = 0, hitShakeTimer = 0) {
    const ctx = this.ctx;
    const cellW = this.width / GRID_COLS;
    const size = cellW * 2.5;
    const color = team === 'blue' ? '#1d4ed8' : '#b91c1c';

    const isCritical = hp <= 5 && hp > 0;
    const now = performance.now() / 1000;
    const pulse = isCritical ? (Math.sin(now * 9) + 1) / 2 : 0; // fast 0..1 pulse

    // Impact micro-shake when base takes damage
    let hitShakeX = 0;
    let hitShakeY = 0;
    if (hitShakeTimer > 0) {
      const shakeIntensity = (hitShakeTimer / 0.24) * 3.5;
      hitShakeX = (Math.random() - 0.5) * shakeIntensity * 2;
      hitShakeY = (Math.random() - 0.5) * shakeIntensity * 2;
    }

    ctx.save();

    // If critical, apply slight tremor jitter and heartbeat thump
    if (isCritical) {
      const scalePulse = 1 + (Math.sin(now * 9) > 0.4 ? 0.06 : -0.02);
      const jitterX = Math.sin(now * 45) * 1.5 * (pulse > 0.2 ? 1 : 0);
      const jitterY = Math.cos(now * 40) * 1.5 * (pulse > 0.2 ? 1 : 0);
      ctx.translate(cx + jitterX + hitShakeX, cy + jitterY + hitShakeY);
      ctx.scale(scalePulse, scalePulse);

      // 1. Expanding animated danger shockwave rings
      const wave1 = (now * 1.6) % 1;
      const wave2 = (now * 1.6 + 0.5) % 1;

      ctx.lineWidth = 2.0;
      ctx.strokeStyle = `rgba(239, 68, 68, ${(1 - wave1) * 0.75})`;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.55 + wave1 * size * 1.1, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(239, 68, 68, ${(1 - wave2) * 0.75})`;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.55 + wave2 * size * 1.1, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Alarming radial danger beacon aura
      const glow = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, size * 1.5);
      glow.addColorStop(0, `rgba(239, 68, 68, ${0.3 + pulse * 0.45})`);
      glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.translate(cx + hitShakeX, cy + hitShakeY);
    }

    // Defense Perimeter Ring (subtle dashed circular boundary)
    const defRadiusPx = BASE_ATTACK_RANGE * cellW;
    ctx.strokeStyle = isCritical
      ? `rgba(239, 68, 68, ${0.4 + pulse * 0.4})`
      : team === 'blue'
      ? 'rgba(37, 99, 235, 0.22)'
      : 'rgba(220, 38, 38, 0.22)';
    ctx.lineWidth = isCritical ? 1.8 : 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, defRadiusPx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Base Square - clean symmetrical square (with alert flash if critical or recently hit)
    const isHitFlashing = hitShakeTimer > 0;
    ctx.strokeStyle = isHitFlashing
      ? '#ef4444'
      : isCritical
      ? pulse > 0.4
        ? '#ef4444'
        : '#b91c1c'
      : color;
    ctx.lineWidth = isHitFlashing ? 3.6 : isCritical ? 3.0 : 2.2;
    ctx.fillStyle = isHitFlashing
      ? 'rgba(254, 202, 202, 0.98)'
      : isCritical
      ? pulse > 0.4
        ? 'rgba(254, 202, 202, 0.98)'
        : 'rgba(254, 226, 226, 0.92)'
      : team === 'blue'
      ? 'rgba(219, 234, 254, 0.92)'
      : 'rgba(254, 226, 226, 0.92)';

    ctx.beginPath();
    ctx.rect(-size * 0.5, -size * 0.5, size, size);
    ctx.fill();
    ctx.stroke();

    // Distress doodle cracks across base surface when critical
    if (isCritical) {
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      // Crack 1
      ctx.moveTo(-size * 0.38, -size * 0.42);
      ctx.lineTo(-size * 0.16, -size * 0.18);
      ctx.lineTo(-size * 0.24, 0.08);
      ctx.lineTo(-size * 0.08, size * 0.38);
      // Crack 2
      ctx.moveTo(size * 0.36, -size * 0.25);
      ctx.lineTo(size * 0.16, 0.04);
      ctx.lineTo(size * 0.26, size * 0.32);
      ctx.stroke();
    }

    // HP Bar of bases: centered in the middle of the base, on top of the square
    const barW = size * 0.78;
    const barH = 9;
    const barY = 3;

    // Background track
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.fillRect(-barW * 0.5, barY - barH * 0.5, barW, barH);

    // HP fill (flashes bright red when critical)
    const hpPct = Math.max(0, hp / maxHp);
    ctx.fillStyle = isCritical
      ? pulse > 0.4
        ? '#ef4444'
        : '#b91c1c'
      : team === 'blue'
      ? '#2563eb'
      : '#dc2626';
    ctx.fillRect(-barW * 0.5, barY - barH * 0.5, barW * hpPct, barH);

    // Outline
    ctx.strokeStyle = isCritical ? '#ef4444' : '#0f172a';
    ctx.lineWidth = isCritical ? 1.6 : 1.1;
    ctx.strokeRect(-barW * 0.5, barY - barH * 0.5, barW, barH);

    // Numeric HP readout in the middle of the base, positioned above the bar (just HP points)
    ctx.fillStyle = isCritical ? (pulse > 0.4 ? '#dc2626' : '#991b1b') : color;
    ctx.font = isCritical ? 'bold 13px monospace' : 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${hp}/${maxHp}`, 0, -8);

    ctx.restore();
  }

  drawPlayerPath(drawState) {
    const ctx = this.ctx;
    const { isDrawing, points, gridNodes, fadeAlpha = 1.0 } = drawState;

    if ((!points || points.length < 2) && (!gridNodes || gridNodes.length < 1)) return;
    if (fadeAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = Math.min(1.0, fadeAlpha);

    // Snapped dashed line connecting grid nodes (identical to opponent aesthetic)
    if (gridNodes && gridNodes.length > 1) {
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);

      ctx.beginPath();
      gridNodes.forEach((node, idx) => {
        const pt = gridToScreen(node.x, node.y, this.width, this.height);
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // [TEST MODE] Raw finger trace line hidden for test
    // if (isDrawing && points && points.length > 1) { ... }

    // Draw little ink dots at snapped nodes with cleaner spacing
    if (gridNodes) {
      gridNodes.forEach((node, idx) => {
        const pt = gridToScreen(node.x, node.y, this.width, this.height);
        const isStart = idx === 0;
        const isEnd = idx === gridNodes.length - 1;

        if (isStart) {
          // Green Start Spawning Anchor
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (isEnd && gridNodes.length > 1) {
          // Target Direction Indicator
          ctx.fillStyle = '#1d4ed8';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Waypoint dot along path (spaced at least 3 units apart)
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    ctx.restore();
  }

  drawBotPath(botPath) {
    const ctx = this.ctx;
    const { coords, fadeTimer } = botPath;
    if (coords.length < 2) return;

    ctx.save();
    ctx.globalAlpha = Math.min(1.0, fadeTimer);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);

    ctx.beginPath();
    coords.forEach((node, idx) => {
      const pt = gridToScreen(node.x, node.y, this.width, this.height);
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    coords.forEach((node, idx) => {
      const pt = gridToScreen(node.x, node.y, this.width, this.height);
      ctx.fillStyle = idx === 0 ? '#b91c1c' : '#ef4444';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  drawUnits(units) {
    for (const unit of units) {
      this.drawSingleUnit(unit);
    }
  }

  drawSingleUnit(unit) {
    const ctx = this.ctx;
    const pt = gridToScreen(unit.x, unit.y, this.width, this.height);
    const color = unit.team === 'blue' ? '#1d4ed8' : '#b91c1c';
    const cellW = this.width / GRID_COLS;
    const size = cellW * (unit.isScribblerSub ? 0.45 : 0.78);

    ctx.save();
    ctx.translate(pt.x, pt.y);

    if (unit.state === 'dying') {
      ctx.globalAlpha = unit.deathTimer;
      ctx.scale(unit.deathTimer, unit.deathTimer);
    }

    // Kinetic hit shake when receiving damage
    if (unit.hitShakeTimer > 0) {
      const shakeProgress = unit.hitShakeTimer / 0.18;
      const shakeOffset = Math.sin(shakeProgress * Math.PI * 10) * 3.2 * shakeProgress;
      ctx.translate(shakeOffset, 0);
    }

    // Attack hit animation: forward lunge, kinetic impact shake, and punchy squash & stretch
    let attackLunge = 0;
    let attackShake = 0;
    let attackProgress = 0;
    if (unit.attackAnimTimer > 0) {
      attackProgress = unit.attackAnimTimer / 0.24; // 1 down to 0
      // Sine wave lunge: surges forward and snaps back
      const lungeFactor = Math.sin((1 - attackProgress) * Math.PI);
      attackLunge = lungeFactor * size * 0.42;

      // Sharp impact shake at the moment of strike
      if (attackProgress < 0.7 && attackProgress > 0.1) {
        attackShake = Math.sin(attackProgress * Math.PI * 12) * size * 0.12 * attackProgress;
      }
    }

    // Draw unit visual using shared unit visual drawer with facing rotation
    ctx.save();
    const unitAngle = unit.angle !== undefined
      ? unit.angle
      : (unit.team === 'blue' ? -Math.PI / 2 : Math.PI / 2);
    // Artwork natively points UP (-Y in 2D canvas, angle = -PI/2).
    // Rotating by (unitAngle + Math.PI / 2) aligns the native UP artwork with the movement/target angle.
    ctx.rotate(unitAngle + Math.PI / 2);

    // Apply attack lunge & impact vibration along the local facing axis
    if (attackLunge > 0 || attackShake !== 0) {
      ctx.translate(attackShake, -attackLunge);
      const stretch = 1 + (attackLunge / (size * 0.42)) * 0.16;
      const squash = 1 - (attackLunge / (size * 0.42)) * 0.10;
      ctx.scale(squash, stretch);
    }

    const fillColor = unit.team === 'blue' ? 'rgba(191, 219, 254, 0.92)' : 'rgba(254, 202, 202, 0.92)';
    drawUnitVisual(ctx, unit.type, size, color, fillColor, {
      isSingleSub: unit.isScribblerSub,
      attackProgress,
    });
    ctx.restore();

    // Overhead Health Bar hovering cleanly over the occupied cell
    if (unit.state !== 'dying') {
      const isWall = unit.type === 'wall';
      const isBulker = unit.type === 'bulker';
      const isSpeeder = unit.type === 'speeder';
      const barW = isWall ? Math.max(22, size * 1.5) : (isBulker ? Math.max(26, size * 1.85) : (isSpeeder ? Math.max(14, size * 1.0) : Math.max(16, size * 1.3)));
      const barH = 3.5;
      const barY = isBulker ? -size * 1.35 - 6 : (isWall ? -size * 1.15 - 6 : (isSpeeder ? -size * 0.9 - 6 : -size - 6));

      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(-barW * 0.5, barY, barW, barH);

      const hpRatio = Math.max(0, unit.hp / unit.maxHp);
      ctx.fillStyle = unit.team === 'blue' ? '#2563eb' : '#dc2626';
      ctx.fillRect(-barW * 0.5, barY, barW * hpRatio, barH);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 0.75;
      ctx.strokeRect(-barW * 0.5, barY, barW, barH);
    }

    ctx.restore();
  }

  drawAoETargeting(projectiles) {
    const ctx = this.ctx;
    const cellW = this.width / GRID_COLS;
    const cellH = this.height / GRID_ROWS;
    const cellScale = (cellW + cellH) / 2;

    for (const p of projectiles) {
      if (p.type !== 'splat') continue;
      const targetPt = gridToScreen(p.targetX, p.targetY, this.width, this.height);
      const aoeRad = p.aoeRadius || 2.0;
      const radiusPx = aoeRad * cellScale;

      ctx.save();
      ctx.translate(targetPt.x, targetPt.y);

      const teamColor = p.team === 'blue' ? '37, 99, 235' : '220, 38, 38';
      const alpha = 0.35 + p.progress * 0.45; // fades in as projectile approaches

      // 1. Translucent ground target wash showing circular area of effect
      ctx.fillStyle = `rgba(${teamColor}, ${0.09 * alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, radiusPx, 0, Math.PI * 2);
      ctx.fill();

      // 2. Dashed boundary circle showing exact AoE range
      ctx.strokeStyle = `rgba(${teamColor}, ${0.75 * alpha})`;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, radiusPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Contracting impact ring showing time until detonation
      const contractProgress = Math.min(1.0, p.progress);
      const contractRadius = radiusPx * (1.7 - contractProgress * 0.7);
      ctx.strokeStyle = `rgba(${teamColor}, ${0.6 * (1 - contractProgress)})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(0, 0, contractRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Center crosshair indicator
      ctx.strokeStyle = `rgba(${teamColor}, ${0.8 * alpha})`;
      ctx.lineWidth = 1.4;
      const chSize = 6;
      ctx.beginPath();
      ctx.moveTo(-chSize, 0);
      ctx.lineTo(chSize, 0);
      ctx.moveTo(0, -chSize);
      ctx.lineTo(0, chSize);
      ctx.stroke();

      // 5. Small clear label "AOE TARGET"
      ctx.fillStyle = `rgba(${teamColor}, ${0.85 * alpha})`;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('AOE TARGET', 0, -radiusPx - 2);

      ctx.restore();
    }
  }

  drawAoESplashes(aoeSplashes) {
    const ctx = this.ctx;
    const cellW = this.width / GRID_COLS;
    const cellH = this.height / GRID_ROWS;
    const cellScale = (cellW + cellH) / 2;

    for (const s of aoeSplashes) {
      const progress = 1 - (s.life / s.duration); // 0 to 1
      const alpha = Math.max(0, s.life / s.duration); // 1 to 0
      const pt = gridToScreen(s.x, s.y, this.width, this.height);
      const radiusPx = s.radius * cellScale;

      // Elastic quick expansion at the first 0.22s of detonation
      const expandFactor = progress < 0.22
        ? Math.sin((progress / 0.22) * (Math.PI * 0.5))
        : 1.0;
      const curRadius = radiusPx * expandFactor;

      ctx.save();
      ctx.translate(pt.x, pt.y);

      const isBlue = s.team === 'blue';
      const baseRgb = isBlue ? '37, 99, 235' : '220, 38, 38';
      const darkColor = isBlue ? '#1d4ed8' : '#b91c1c';
      const lightColor = isBlue ? '#93c5fd' : '#fca5a5';

      // 1. Translucent ink wash filling the exact circular AoE area
      ctx.fillStyle = `rgba(${baseRgb}, ${alpha * 0.25})`;
      ctx.beginPath();
      ctx.arc(0, 0, curRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Radial ink burst core
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, curRadius);
      grad.addColorStop(0, `rgba(${baseRgb}, ${alpha * 0.55})`);
      grad.addColorStop(0.65, `rgba(${baseRgb}, ${alpha * 0.28})`);
      grad.addColorStop(1, `rgba(${baseRgb}, ${alpha * 0.08})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, curRadius, 0, Math.PI * 2);
      ctx.fill();

      // 3. Primary Crisp AoE Perimeter Circle
      ctx.strokeStyle = darkColor;
      ctx.globalAlpha = Math.min(1.0, alpha * 1.2);
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(0, 0, curRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Fine interior accent ring (dashed math graph paper doodle style)
      ctx.strokeStyle = lightColor;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, curRadius * 0.92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 5. Expanding secondary shockwave ripple circle
      const rippleRadius = radiusPx * (0.85 + progress * 0.38);
      const rippleAlpha = Math.max(0, (1 - progress) * 0.65);
      ctx.strokeStyle = `rgba(${baseRgb}, ${rippleAlpha})`;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, rippleRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 6. Cardinal alignment ticks along circular perimeter
      const tickLen = 5.5;
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      // Top tick
      ctx.moveTo(0, -curRadius - tickLen);
      ctx.lineTo(0, -curRadius + tickLen);
      // Bottom tick
      ctx.moveTo(0, curRadius - tickLen);
      ctx.lineTo(0, curRadius + tickLen);
      // Left tick
      ctx.moveTo(-curRadius - tickLen, 0);
      ctx.lineTo(-curRadius + tickLen, 0);
      // Right tick
      ctx.moveTo(curRadius - tickLen, 0);
      ctx.lineTo(curRadius + tickLen, 0);
      ctx.stroke();

      // 7. Hand-drawn ink splash droplets along circular perimeter
      ctx.fillStyle = darkColor;
      if (s.droplets) {
        for (const drop of s.droplets) {
          const dDist = curRadius * drop.distRatio;
          const dx = Math.cos(drop.angle) * dDist;
          const dy = Math.sin(drop.angle) * dDist;
          ctx.beginPath();
          ctx.arc(dx, dy, drop.size * Math.min(1.0, alpha * 1.3), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 8. Floating "💥 AOE SPLASH!" banner that bounces up and fades
      const badgeY = -curRadius - 10 - progress * 14;
      ctx.save();
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const badgeText = '💥 AOE SPLASH';
      const textMetrics = ctx.measureText(badgeText);
      const padX = 6;
      const bgW = textMetrics.width + padX * 2;
      const bgH = 14;

      ctx.fillStyle = darkColor;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(-bgW * 0.5, badgeY - bgH * 0.5, bgW, bgH, 4);
      } else {
        ctx.rect(-bgW * 0.5, badgeY - bgH * 0.5, bgW, bgH);
      }
      ctx.fill();

      // Pill text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(badgeText, 0, badgeY);
      ctx.restore();

      ctx.restore();
    }
  }

  drawProjectiles(projectiles) {
    const ctx = this.ctx;
    const cellW = this.width / GRID_COLS;

    for (const p of projectiles) {
      const curX = p.startX + (p.targetX - p.startX) * p.progress;
      const curY = p.startY + (p.targetY - p.startY) * p.progress;
      const pt = gridToScreen(curX, curY, this.width, this.height);

      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.fillStyle = p.team === 'blue' ? '#1d4ed8' : '#b91c1c';

      if (p.type === 'base_bolt') {
        const angle = Math.atan2(p.targetY - p.startY, p.targetX - p.startX);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-5, -3);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-5, 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else if (p.type === 'bullet') {
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Splat blob lob (parabolic mortar arc with ground shadow)
        const arcHeight = Math.sin(p.progress * Math.PI) * (cellW * 2.2);

        // Ground shadow beneath lobbed projectile
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
        const shadowScale = Math.max(0.4, 1 - (arcHeight / (cellW * 2.2)) * 0.5);
        ctx.beginPath();
        ctx.ellipse(0, 0, 4.8 * shadowScale, 2.8 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Elevated flying ink blob
        ctx.save();
        ctx.translate(0, -arcHeight);

        const wobble = 1 + Math.sin(p.progress * Math.PI * 7) * 0.14;
        ctx.beginPath();
        ctx.ellipse(0, 0, 5.2 * wobble, 5.2 / wobble, 0, 0, Math.PI * 2);
        ctx.fill();

        // White doodle highlight glint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(-1.4, -1.6, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Trailing mini droplet behind lob
        ctx.fillStyle = p.team === 'blue' ? '#3b82f6' : '#ef4444';
        ctx.beginPath();
        ctx.arc(0, arcHeight * 0.28, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();
    }
  }

  drawParticles(particles) {
    const ctx = this.ctx;
    for (const p of particles) {
      const pt = gridToScreen(p.x, p.y, this.width, this.height);
      const dotColor =
        p.team === 'blue' ? '#2563eb' : p.team === 'red' ? '#dc2626' : p.team === 'ink' ? '#0284c7' : '#475569';

      // Fading motion trail behind homing ink droplets (bottle -> capturing base)
      if (p.trail && p.prevX !== undefined) {
        const prevPt = gridToScreen(p.prevX, p.prevY, this.width, this.height);
        ctx.save();
        ctx.globalAlpha = p.life * 0.5;
        ctx.strokeStyle = dotColor;
        ctx.lineWidth = p.radius * 1.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(prevPt.x, prevPt.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
