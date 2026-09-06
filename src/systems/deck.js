import { INITIAL_DECK, PREDEFINED_BOTTLE_SPOTS, BASE_INK_REGEN_RATE } from '../constants.js';

/**
 * Creates an ink bottle with pure random tier:
 * 1 HP = +1 Ink
 * 2 HP = +2 Ink
 * 3 HP = +3 Ink
 */
function createRandomBottle(id, x, y) {
  const tier = Math.floor(Math.random() * 3) + 1; // Pure random 1, 2, or 3
  return {
    id,
    x,
    y,
    hp: tier,
    maxHp: tier,
    inkReward: tier,
    active: true,
    spawnTimer: 0,
    destroyAnim: 0,
    lastHitTeam: null,
  };
}

export class DeckAndEconomyManager {
  // Hand size is 4 cards, total deck 6 cards
  constructor() {
    this.deckQueue = [];
    this.hand = [];
    
    // Ink parameters
    this.ink = 5.0;
    this.maxInk = 10.0;
    this.matchTimeRemaining = 180; // 3 minutes = 180 seconds

    // Bottles
    this.bottles = [];
    this.nextBottleSpawnTimer = 6.0; // Rapid respawn: every 6s (down from 20s)

    this.reset();
  }

  reset() {
    // Clone initial deck
    const deck = [...INITIAL_DECK];
    this.hand = deck.slice(0, 4);
    this.deckQueue = deck.slice(4); // remaining 2 cards

    this.ink = 5.0;
    this.matchTimeRemaining = 180;
    this.nextBottleSpawnTimer = 6.0;

    // Start with 3 fair bottles: outer Red flank, outer Blue flank, and strictly ONE at center midline
    this.bottles = [
      createRandomBottle('bottle_start_red', 2, 11),
      createRandomBottle('bottle_start_blue', 15, 21),
      createRandomBottle('bottle_start_mid', 9, 16),
    ];
  }

  getHand() {
    return this.hand;
  }

  getQueue() {
    return this.deckQueue;
  }

  getRateMultiplier() {
    if (this.matchTimeRemaining <= 60) {
      return 3; // 3x multiplier after 2nd minute (01:00 - 00:00)
    } else if (this.matchTimeRemaining <= 120) {
      return 2; // 2x multiplier after 1st minute (02:00 - 01:00)
    }
    return 1; // 1x multiplier base (first minute: 03:00 - 02:00)
  }

  getInkRegenRate() {
    return this.getRateMultiplier() * BASE_INK_REGEN_RATE;
  }

  update(dt) {
    // Timer progression
    if (this.matchTimeRemaining > 0) {
      this.matchTimeRemaining = Math.max(0, this.matchTimeRemaining - dt);
    }

    // Ink regeneration
    const rate = this.getInkRegenRate();
    this.ink = Math.min(this.maxInk, this.ink + rate * dt);

    // Bottles spawn timer (6s rapid respawn, down from 20s)
    this.nextBottleSpawnTimer -= dt;
    if (this.nextBottleSpawnTimer <= 0) {
      this.nextBottleSpawnTimer = 6.0;
      this.trySpawnBottle();
    }

    // Update bottle destroy animations and clean up completed ones
    for (const b of this.bottles) {
      if (!b.active && b.destroyAnim > 0) {
        b.destroyAnim = Math.max(0, b.destroyAnim - dt * 2.8);
      }
    }
    this.bottles = this.bottles.filter((b) => b.active || b.destroyAnim > 0);
  }

  trySpawnBottle() {
    const activeCount = this.bottles.filter((b) => b.active).length;
    if (activeCount >= 5) return; // Allow up to 5 active bottles on the board (up from 4)

    // Pick from unoccupied spots
    const availableSpots = PREDEFINED_BOTTLE_SPOTS.filter(
      (spot) => !this.bottles.some((b) => b.active && b.x === spot.x && b.y === spot.y)
    );

    if (availableSpots.length > 0) {
      const chosen = availableSpots[Math.floor(Math.random() * availableSpots.length)];
      this.bottles.push(createRandomBottle(`bottle_${Date.now()}_${Math.random()}`, chosen.x, chosen.y));
    }
  }

  canPlayCard(cardId) {
    const card = this.hand.find((c) => c.id === cardId);
    if (!card) return false;
    return this.ink >= card.cost;
  }

  // Play a card: deduct ink, append played card to back of deck queue, pop next card into hand
  playCard(cardId) {
    const cardIndex = this.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return null;

    const playedCard = this.hand[cardIndex];
    if (this.ink < playedCard.cost) return null;

    // Deduct cost
    this.ink -= playedCard.cost;

    // Cycle hand
    const nextCard = this.deckQueue.shift();
    this.hand.splice(cardIndex, 1);

    if (nextCard) {
      this.hand.push(nextCard);
    }
    this.deckQueue.push(playedCard);

    return playedCard;
  }

  grantInk(amount) {
    this.ink = Math.min(this.maxInk, this.ink + amount);
  }
}
