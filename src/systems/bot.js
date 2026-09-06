import { CARDS_DATA, GRID_COLS, BASE_INK_REGEN_RATE } from '../constants.js';

export class BotOpponentAI {
  constructor() {
    this.ink = 5.0;
    this.maxInk = 10.0;
    this.activeDrawnPath = null;
    this.plannedCardId = null;
    this.jitterTimer = null; // Reaction delay once ink threshold is satisfied
    this.openingDelay = 1.2; // Quick initial opening deployment

    // All allowed units for the bot (matches all cards available in the game)
    this.unitPool = ['speeder', 'bulker', 'ranger', 'scribblers', 'splat', 'wall'];
    this.spawnQueue = [];
    this.lastSpawnedUnit = null;

    this.reset();
  }

  reset() {
    this.ink = 5.0;
    this.activeDrawnPath = null;
    this.openingDelay = 1.2;
    this.lastSpawnedUnit = null;
    this.spawnQueue = [];
    this.refillAndShuffleQueue();
    this.dequeueNextCard();
    this.jitterTimer = null;
  }

  /**
   * Refills the queue with all allowed units and shuffles it using Fisher-Yates.
   * Guarantees that the first unit of the new batch does not match the last unit
   * spawned from the previous batch, preventing back-to-back duplicate spawns.
   */
  refillAndShuffleQueue() {
    const units = [...this.unitPool];
    for (let i = units.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [units[i], units[j]] = [units[j], units[i]];
    }

    // If first unit in new batch matches the last unit spawned, swap with another item
    if (this.lastSpawnedUnit && units[0] === this.lastSpawnedUnit && units.length > 1) {
      const swapIdx = 1 + Math.floor(Math.random() * (units.length - 1));
      [units[0], units[swapIdx]] = [units[swapIdx], units[0]];
    }

    this.spawnQueue = units;
  }

  /**
   * Dequeues the next planned card from the shuffled queue.
   * If the queue is empty, it refills, shuffles, and dequeues.
   */
  dequeueNextCard() {
    if (!this.spawnQueue || this.spawnQueue.length === 0) {
      this.refillAndShuffleQueue();
    }
    this.plannedCardId = this.spawnQueue.shift();
  }

  getActiveDrawnPath() {
    return this.activeDrawnPath;
  }

  update(dt, rateMultiplier, canDeploy, playerInk, onDeployUnit) {
    // Ink regeneration stays symmetrical with the player from the start of the match
    const rate = rateMultiplier * BASE_INK_REGEN_RATE;
    this.ink = Math.min(this.maxInk, this.ink + rate * dt);

    // Fade active drawn path trail
    if (this.activeDrawnPath) {
      this.activeDrawnPath.fadeTimer -= dt;
      if (this.activeDrawnPath.fadeTimer <= 0) {
        this.activeDrawnPath = null;
      }
    }

    // Withhold the bot's own deploy decision until the player deploys their first
    // unit, so the enemy never gets a head start — ink still accumulates in the meantime.
    if (!canDeploy) {
      return;
    }

    // Match opening delay
    if (this.openingDelay > 0) {
      this.openingDelay -= dt;
      return;
    }

    if (!this.plannedCardId) {
      this.dequeueNextCard();
    }

    const plannedCard = CARDS_DATA[this.plannedCardId] || CARDS_DATA.speeder;

    // Check if bot can afford its planned card
    const canAffordPlanned = this.ink >= plannedCard.cost;

    if (canAffordPlanned) {
      // If we don't have a jitter timer yet, start realistic human reaction/drawing delay
      if (this.jitterTimer === null) {
        // Human reaction jitter: 200ms to 400ms baseline, eased off further when the
        // player is banking a lot of unspent ink — a simple, cheap proxy for "playing
        // less efficiently" that lets difficulty implicitly track player skill without
        // any persistent skill-tracking state. Max total delay: 1s (0.4s baseline + 0.6s penalty).
        const inkBankRatio = Math.min(1, (playerInk || 0) / 10); // 10 = player's max ink pool
        const skillPenalty = inkBankRatio * 0.6; // up to +0.6s extra delay when hoarding ink
        this.jitterTimer = 0.2 + Math.random() * 0.2 + skillPenalty;
      } else {
        this.jitterTimer -= dt;
        if (this.jitterTimer <= 0) {
          this.jitterTimer = null;
          this.executeDeploy(onDeployUnit);
        }
      }
    } else {
      // Still accumulating ink for planned card
      this.jitterTimer = null;
    }
  }

  executeDeploy(onDeployUnit) {
    const deployCardId = this.plannedCardId;
    const card = CARDS_DATA[deployCardId];

    // Must be able to afford the planned card
    if (!card || this.ink < card.cost) {
      return;
    }

    // Deduct ink
    this.ink -= card.cost;
    this.lastSpawnedUnit = deployCardId;

    // Generate dynamic path
    const chosenPath = this.generateDynamicPath();

    // Set active drawn path for rendering
    this.activeDrawnPath = {
      coords: [...chosenPath],
      fadeTimer: 2.2,
    };

    // Deploy unit
    onDeployUnit(deployCardId, [...chosenPath]);

    // Dequeue next unit from the shuffled queue (refills and shuffles when empty)
    this.dequeueNextCard();
  }

  generateDynamicPath() {
    const laneRoll = Math.random();
    const targetBaseX = 8 + Math.floor(Math.random() * 3); // 8, 9, or 10 (Blue Core)
    const targetBaseY = 28;

    if (laneRoll < 0.38) {
      // Center Rush: direct aggressive push down center
      const startX = 8 + Math.floor(Math.random() * 3);
      return [
        { x: startX, y: 2 },
        { x: startX, y: 6 },
        { x: 9 + (Math.random() > 0.5 ? 1 : -1), y: 12 },
        { x: 9, y: 18 },
        { x: 9 + (Math.random() > 0.5 ? 1 : -1), y: 23 },
        { x: targetBaseX, y: targetBaseY },
      ];
    } else if (laneRoll < 0.69) {
      // Left Flank: curves through left margin / neutral ink node
      const startX = 6 + Math.floor(Math.random() * 3);
      const flankX = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4
      return [
        { x: startX, y: 2 },
        { x: 4, y: 6 },
        { x: flankX, y: 11 },
        { x: flankX, y: 17 },
        { x: 4, y: 22 },
        { x: 6, y: 26 },
        { x: targetBaseX, y: targetBaseY },
      ];
    } else {
      // Right Flank: curves through right margin / neutral ink node
      const startX = 10 + Math.floor(Math.random() * 3);
      const flankX = 13 + Math.floor(Math.random() * 3); // 13, 14, or 15
      return [
        { x: startX, y: 2 },
        { x: 14, y: 6 },
        { x: flankX, y: 11 },
        { x: flankX, y: 17 },
        { x: 14, y: 22 },
        { x: 12, y: 26 },
        { x: targetBaseX, y: targetBaseY },
      ];
    }
  }

  grantInk(amount) {
    this.ink = Math.min(this.maxInk, this.ink + amount);
  }
}

