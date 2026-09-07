import { CARDS_DATA, BASE_INK_REGEN_RATE } from './constants.js';
import { soundFX } from './utils/audio.js';
import { DoodleInputManager } from './systems/input.js';
import { DeckAndEconomyManager } from './systems/deck.js';
import { CombatManager } from './systems/combat.js';
import { BotOpponentAI } from './systems/bot.js';
import { NotebookRenderer } from './systems/renderer.js';
import { createUnitCardIconCanvas } from './systems/unitDrawers.js';

class DoodleClashApp {
  constructor() {
    // DOM Elements
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Header & Timer elements
    this.matchTimerText = document.getElementById('matchTimerText');
    this.multiplierBadge = document.getElementById('multiplierBadge');
    this.btnReset = document.getElementById('btnReset');
    this.btnSpeedUp = document.getElementById('btnSpeedUp');

    // Enemy Ink elements
    this.enemyInkBarFill = document.getElementById('enemyInkBarFill');
    this.enemyInkText = document.getElementById('enemyInkText');
    this.enemyInkRateText = document.getElementById('enemyInkRateText');

    // Player HUD & Ink elements
    this.handCardsContainer = document.getElementById('handCardsContainer');
    this.inkBarFill = document.getElementById('inkBarFill');
    this.inkText = document.getElementById('inkText');
    this.inkRateText = document.getElementById('inkRateText');

    // Modal elements
    this.gameOverModal = document.getElementById('gameOverModal');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalDesc = document.getElementById('modalDesc');
    this.modalStats = document.getElementById('modalStats');
    this.btnPlayAgain = document.getElementById('btnPlayAgain');

    // Info & Rules Screen Modal elements
    this.btnInfo = document.getElementById('btnInfo');
    this.infoModal = document.getElementById('infoModal');
    this.btnCloseInfo = document.getElementById('btnCloseInfo');
    this.btnDismissInfo = document.getElementById('btnDismissInfo');
    this.infoUnitsContainer = document.getElementById('infoUnitsContainer');
    this.isInfoOpen = false;

    // Core Game Systems
    this.deckManager = new DeckAndEconomyManager();
    this.combatManager = new CombatManager();
    this.botManager = new BotOpponentAI();
    this.renderer = new NotebookRenderer(this.ctx);
    this.inputManager = new DoodleInputManager(
      this.canvas,
      (path) => this.handlePlayerPathCompleted(path),
      () => this.canPlayerDraw(),
      () => this.triggerInkError(this.selectedCardId)
    );

    // State
    this.selectedCardId = 'bulker';
    this.winner = null;
    this.lastTime = performance.now();
    this.lastDeployTime = 0;
    this.maxCoreHp = 30;

    // Tip card state (above base, disappears after 5 cards deployed OR after 10s)
    this.drawHint = document.getElementById('drawHint');
    this.playerCardsDeployed = 0;
    this.matchElapsedTime = 0;
    this.tipHidden = false;
    this.lastRateMultiplier = 1;
    this.timeWarningShown = false;
    this.lastCountdownSecond = null;

    // Confetti particles for standalone offline victory
    this.confettiParticles = [];

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.populateInfoUnits();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.renderHandUI();
    this.updateHUD();

    // Start Game Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  setupEventListeners() {
    this.btnReset.addEventListener('click', () => {
      this.resetGame();
    });

    this.btnSpeedUp.addEventListener('click', () => {
      if (this.deckManager.matchTimeRemaining > 120) {
        this.deckManager.matchTimeRemaining = 120;
      } else if (this.deckManager.matchTimeRemaining > 60) {
        this.deckManager.matchTimeRemaining = 60;
      } else if (this.deckManager.matchTimeRemaining > 10) {
        this.deckManager.matchTimeRemaining = 10;
      }
    });

    this.btnPlayAgain.addEventListener('click', () => {
      this.resetGame();
      this.gameOverModal.classList.add('hidden');
    });

    // Info & Rules Modal listeners
    if (this.btnInfo) {
      this.btnInfo.addEventListener('click', () => this.openInfoModal());
    }
    if (this.btnCloseInfo) {
      this.btnCloseInfo.addEventListener('click', () => this.closeInfoModal());
    }
    if (this.btnDismissInfo) {
      this.btnDismissInfo.addEventListener('click', () => this.closeInfoModal());
    }
    if (this.infoModal) {
      this.infoModal.addEventListener('click', (e) => {
        if (e.target === this.infoModal) {
          this.closeInfoModal();
        }
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isInfoOpen) {
        this.closeInfoModal();
      }
    });
  }

  populateInfoUnits() {
    if (!this.infoUnitsContainer) return;
    this.infoUnitsContainer.innerHTML = '';

    Object.values(CARDS_DATA).forEach((card) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'info-unit-card';

      // Left: Unit avatar icon canvas
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'info-unit-avatar';
      const iconCanvas = createUnitCardIconCanvas(card.id, 32, 'blue');
      avatarDiv.appendChild(iconCanvas);

      // Attack icon & type
      let atkIcon = '🗡️';
      let atkType = 'Melee';
      if (card.id === 'splat' || card.aoeRadius) {
        atkIcon = '💥';
        atkType = `${card.aoeRadius || 2.0} Area Splash`;
      } else if (card.id === 'ranger' || card.attackRange > 2.0) {
        atkIcon = '🏹';
        atkType = `${card.attackRange} Range`;
      }

      // Speed description
      let speedDesc = 'Normal';
      if (card.speed >= 4.0) speedDesc = 'Very Fast';
      else if (card.speed >= 2.0) speedDesc = 'Fast';
      else if (card.speed <= 0.8) speedDesc = 'Slow';

      // Right content
      const contentDiv = document.createElement('div');
      contentDiv.className = 'info-unit-content';

      // Header row: Name + Badges
      const headerDiv = document.createElement('div');
      headerDiv.className = 'info-unit-header';

      const nameEl = document.createElement('span');
      nameEl.className = 'info-unit-name';
      nameEl.textContent = card.name;

      const badgesDiv = document.createElement('div');
      badgesDiv.className = 'info-unit-badges';

      const costBadge = document.createElement('span');
      costBadge.className = 'info-cost-badge';
      costBadge.textContent = `💧 ${card.cost}`;

      const roleBadge = document.createElement('span');
      roleBadge.className = 'info-role-badge';
      roleBadge.textContent = card.role;

      badgesDiv.appendChild(costBadge);
      badgesDiv.appendChild(roleBadge);
      headerDiv.appendChild(nameEl);
      headerDiv.appendChild(badgesDiv);

      // Stats row
      const statsDiv = document.createElement('div');
      statsDiv.className = 'info-unit-stats';

      const hpPill = document.createElement('span');
      hpPill.className = 'info-stat-pill';
      hpPill.innerHTML = `❤️ ${card.id === 'scribblers' ? '1 <span style="font-size:8px;color:#64748b;">(x4)</span>' : card.hp} HP`;

      const dmgPill = document.createElement('span');
      dmgPill.className = 'info-stat-pill';
      dmgPill.innerHTML = `${atkIcon} ${card.id === 'scribblers' ? '1 <span style="font-size:8px;color:#64748b;">(x4)</span>' : card.damage} DMG`;

      const rangePill = document.createElement('span');
      rangePill.className = 'info-stat-pill';
      rangePill.textContent = `🎯 ${atkType}`;

      const speedPill = document.createElement('span');
      speedPill.className = 'info-stat-pill';
      speedPill.textContent = `⚡ ${speedDesc}`;

      statsDiv.appendChild(hpPill);
      statsDiv.appendChild(dmgPill);
      statsDiv.appendChild(rangePill);
      statsDiv.appendChild(speedPill);

      // Short description
      const descEl = document.createElement('div');
      descEl.className = 'info-unit-desc';
      descEl.textContent = card.description;

      contentDiv.appendChild(headerDiv);
      contentDiv.appendChild(statsDiv);
      contentDiv.appendChild(descEl);

      cardEl.appendChild(avatarDiv);
      cardEl.appendChild(contentDiv);

      this.infoUnitsContainer.appendChild(cardEl);
    });
  }

  openInfoModal() {
    if (!this.infoModal) return;
    this.isInfoOpen = true;
    this.infoModal.classList.remove('hidden');
    soundFX.playDeploy();
  }

  closeInfoModal() {
    if (!this.infoModal) return;
    this.isInfoOpen = false;
    this.infoModal.classList.add('hidden');
    this.lastTime = performance.now();
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
    this.renderer.resize(rect.width, rect.height);
    this.combatManager.setScreenDimensions(rect.width, rect.height);
  }

  resetGame() {
    this.deckManager.reset();
    this.combatManager.reset();
    this.botManager.reset();
    this.inputManager.clear();
    this.winner = null;
    this.selectedCardId = 'bulker';
    this.confettiParticles = [];
    this.playerCardsDeployed = 0;
    this.matchElapsedTime = 0;
    this.tipHidden = false;
    this.lastRateMultiplier = 1;
    this.timeWarningShown = false;
    this.lastCountdownSecond = null;
    if (this.drawHint) {
      this.drawHint.classList.remove('hidden-hint');
    }
    this.gameOverModal.classList.add('hidden');
    this.gameOverModal.classList.remove('theme-victory', 'theme-defeat', 'theme-draw');
    this.renderHandUI();
    this.updateHUD();
  }

  checkTipVisibility() {
    if (!this.tipHidden && (this.playerCardsDeployed >= 5 || this.matchElapsedTime >= 10)) {
      this.tipHidden = true;
      if (this.drawHint) {
        this.drawHint.classList.add('hidden-hint');
      }
    }
  }

  canPlayerDraw() {
    if (this.winner) return false;
    const hand = this.deckManager.getHand();
    const card = hand.find((c) => c.id === this.selectedCardId);
    if (!card) return false;
    return this.deckManager.ink >= card.cost;
  }

  triggerInkError(cardId = null) {
    const now = performance.now();
    if (this.lastErrorSoundTime && now - this.lastErrorSoundTime < 180) {
      return;
    }
    this.lastErrorSoundTime = now;

    soundFX.playError();

    // Flash/shake ink meter
    const inkMeter = document.getElementById('inkMeterContainer');
    if (inkMeter) {
      inkMeter.classList.remove('ink-error-shake');
      void inkMeter.offsetWidth; // trigger reflow
      inkMeter.classList.add('ink-error-shake');
      setTimeout(() => {
        inkMeter.classList.remove('ink-error-shake');
      }, 400);
    }

    // Flash/shake the targeted card button
    const targetId = cardId || this.selectedCardId;
    const handCards = this.handCardsContainer.querySelectorAll('.hand-card:not(.card-deploying-ghost)');
    handCards.forEach((btn) => {
      if (btn.dataset.cardId === targetId) {
        btn.classList.remove('card-error-shake');
        void btn.offsetWidth;
        btn.classList.add('card-error-shake');
        setTimeout(() => {
          btn.classList.remove('card-error-shake');
        }, 400);
      }
    });
  }

  triggerInkBump() {
    const inkMeter = document.getElementById('inkMeterContainer');
    if (inkMeter) {
      inkMeter.classList.remove('ink-bump-pop');
      void inkMeter.offsetWidth; // trigger reflow
      inkMeter.classList.add('ink-bump-pop');
      setTimeout(() => {
        inkMeter.classList.remove('ink-bump-pop');
      }, 400);
    }
  }

  triggerSpeedUpEffect(multiplier) {
    soundFX.playSpeedUp();

    // One-shot bump on the multiplier badge
    if (this.multiplierBadge) {
      this.multiplierBadge.classList.remove('badge-speed-bump');
      void this.multiplierBadge.offsetWidth; // trigger reflow
      this.multiplierBadge.classList.add('badge-speed-bump');
      setTimeout(() => {
        this.multiplierBadge.classList.remove('badge-speed-bump');
      }, 600);
    }

    // Full-screen gold flash
    const flash = document.getElementById('speedUpFlash');
    if (flash) {
      flash.classList.remove('speed-flash-active');
      void flash.offsetWidth;
      flash.classList.add('speed-flash-active');
      setTimeout(() => {
        flash.classList.remove('speed-flash-active');
      }, 600);
    }

    // "2X INK" / "3X INK" popup text
    const text = document.getElementById('speedUpText');
    if (text) {
      text.textContent = `${multiplier}X INK`;
      text.classList.remove('speed-text-active');
      void text.offsetWidth;
      text.classList.add('speed-text-active');
      clearTimeout(this._speedTextTimeout);
      this._speedTextTimeout = setTimeout(() => {
        text.classList.remove('speed-text-active');
      }, 1100);
    }
  }

  triggerMatchAlertEffect(label) {
    // Red urgency flash across the battlefield
    const flash = document.getElementById('matchAlertFlash');
    if (flash) {
      flash.classList.remove('match-alert-flash-active');
      void flash.offsetWidth;
      flash.classList.add('match-alert-flash-active');
      setTimeout(() => {
        flash.classList.remove('match-alert-flash-active');
      }, 600);
    }

    // Big centered popup text ("30 SECONDS LEFT!" or a countdown digit)
    const text = document.getElementById('matchAlertText');
    if (text) {
      text.textContent = label;
      text.classList.remove('match-alert-text-active');
      void text.offsetWidth;
      text.classList.add('match-alert-text-active');
      clearTimeout(this._matchAlertTextTimeout);
      this._matchAlertTextTimeout = setTimeout(() => {
        text.classList.remove('match-alert-text-active');
      }, 950);
    }
  }

  handlePlayerPathCompleted(path) {
    if (!this.selectedCardId) return;

    const hand = this.deckManager.getHand();
    const card = hand.find((c) => c.id === this.selectedCardId);
    if (!card || this.deckManager.ink < card.cost) {
      this.triggerInkError(this.selectedCardId);
      return;
    }

    // Capture pre-play card positions and DOM node for FLIP slide animation
    const playedCardId = this.selectedCardId;
    const oldCards = Array.from(
      this.handCardsContainer.querySelectorAll('.hand-card:not(.card-deploying-ghost)')
    );
    const oldPositions = new Map();
    let playedCardRect = null;
    let playedCardNode = null;

    oldCards.forEach((btn) => {
      const id = btn.dataset.cardId;
      if (id) {
        const rect = btn.getBoundingClientRect();
        oldPositions.set(id, rect);
        if (id === playedCardId) {
          playedCardRect = rect;
          playedCardNode = btn;
        }
      }
    });

    const playedCard = this.deckManager.playCard(playedCardId);
    if (playedCard) {
      this.lastDeployTime = performance.now();
      this.playerCardsDeployed++;
      this.checkTipVisibility();
      this.combatManager.spawnUnit(playedCard.id, 'blue', path);
      soundFX.playDeploy();

      // Default next selection to first affordable card or first in hand
      const nextHand = this.deckManager.getHand();
      if (!nextHand.some((c) => c.id === this.selectedCardId)) {
        this.selectedCardId = nextHand[0]?.id || null;
      }
      this.renderHandUI();
      this.animateHandCardCycle(oldPositions, playedCardRect, playedCardNode);
    }
  }

  animateHandCardCycle(oldPositions, playedCardRect, playedCardNode) {
    if (!this.handCardsContainer) return;
    const containerRect = this.handCardsContainer.getBoundingClientRect();

    // 1. Ghost of the deployed card: elevates slightly and dissolves into the arena
    if (playedCardRect && playedCardNode) {
      const ghost = playedCardNode.cloneNode(true);
      ghost.classList.add('card-deploying-ghost');
      ghost.style.position = 'absolute';
      ghost.style.left = `${playedCardRect.left - containerRect.left}px`;
      ghost.style.top = `${playedCardRect.top - containerRect.top}px`;
      ghost.style.width = `${playedCardRect.width}px`;
      ghost.style.height = `${playedCardRect.height}px`;
      ghost.style.pointerEvents = 'none';
      ghost.style.zIndex = '30';
      ghost.style.margin = '0';
      this.handCardsContainer.appendChild(ghost);

      requestAnimationFrame(() => {
        ghost.style.transition = 'transform 0.28s cubic-bezier(0.2, 0.8, 0.4, 1), opacity 0.24s ease-out';
        ghost.style.transform = 'translateY(-28px) scale(0.85)';
        ghost.style.opacity = '0';
        setTimeout(() => {
          if (ghost.parentElement) {
            ghost.remove();
          }
        }, 300);
      });
    }

    // 2. Animate newly rendered cards (sliding left from the right, and new card entering on far right)
    const newCards = Array.from(
      this.handCardsContainer.querySelectorAll('.hand-card:not(.card-deploying-ghost)')
    );

    newCards.forEach((btn) => {
      const cardId = btn.dataset.cardId;
      const isSelected = this.selectedCardId === cardId;
      const baseTransform = isSelected ? 'translateY(-4px)' : '';

      if (oldPositions.has(cardId)) {
        // Card that was in hand before: measure if it shifted left
        const oldRect = oldPositions.get(cardId);
        const newRect = btn.getBoundingClientRect();
        const deltaX = oldRect.left - newRect.left;

        if (Math.abs(deltaX) > 2) {
          // Invert: lock to previous physical screen position
          btn.style.transition = 'none';
          btn.style.transform = `translateX(${deltaX}px) ${baseTransform}`.trim();

          void btn.offsetWidth; // Force layout reflow

          // Play: slide smoothly to new slot on the left
          requestAnimationFrame(() => {
            btn.style.transition = 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)';
            btn.style.transform = baseTransform ? baseTransform : 'translateX(0)';
            setTimeout(() => {
              btn.style.transition = '';
              btn.style.transform = '';
            }, 350);
          });
        }
      } else {
        // Brand new card appearing on the far right side
        btn.style.transition = 'none';
        btn.style.transform = `translateX(50px) scale(0.92) ${baseTransform}`.trim();
        btn.style.opacity = '0';

        void btn.offsetWidth; // Force layout reflow

        // Play: slide in from the right edge into the rightmost slot
        requestAnimationFrame(() => {
          btn.style.transition = 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease-out';
          btn.style.transform = baseTransform ? `${baseTransform} scale(1)` : 'translateX(0) scale(1)';
          btn.style.opacity = '1';
          setTimeout(() => {
            btn.style.transition = '';
            btn.style.transform = '';
            btn.style.opacity = '';
          }, 360);
        });
      }
    });
  }

  triggerVictoryConfetti() {
    this.confettiParticles = [];
    const colors = ['#2563eb', '#38bdf8', '#fbbf24', '#ef4444', '#10b981', '#6366f1'];
    for (let i = 0; i < 80; i++) {
      this.confettiParticles.push({
        x: this.canvas.width / (2 * (window.devicePixelRatio || 1)),
        y: this.canvas.height / (2 * (window.devicePixelRatio || 1)),
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.8) * 14,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        life: 1.0,
      });
    }
  }

  checkEndConditions() {
    if (this.winner) return;

    if (this.combatManager.redCore.hp <= 0 && this.combatManager.blueCore.hp <= 0) {
      this.winner = 'tie';
      this.showGameOverModal('draw', 'Draw', 'Both bases fell');
    } else if (this.combatManager.redCore.hp <= 0) {
      this.winner = 'blue';
      soundFX.playVictory();
      this.triggerVictoryConfetti();
      this.showGameOverModal('victory', 'Victory', 'Enemy base destroyed');
    } else if (this.combatManager.blueCore.hp <= 0) {
      this.winner = 'red';
      soundFX.playDefeat();
      this.showGameOverModal('defeat', 'Defeat', 'Your base was destroyed');
    } else if (this.deckManager.matchTimeRemaining <= 0) {
      if (this.combatManager.redCore.hp < this.combatManager.blueCore.hp) {
        this.winner = 'blue';
        soundFX.playVictory();
        this.triggerVictoryConfetti();
        this.showGameOverModal('victory', 'Victory', 'Higher base HP');
      } else if (this.combatManager.blueCore.hp < this.combatManager.redCore.hp) {
        this.winner = 'red';
        soundFX.playDefeat();
        this.showGameOverModal('defeat', 'Defeat', 'Lower base HP');
      } else {
        this.winner = 'tie';
        this.showGameOverModal('draw', 'Draw', 'Equal base HP');
      }
    }
  }

  showGameOverModal(outcome, title, desc) {
    this.modalTitle.textContent = title;
    this.modalDesc.textContent = desc;
    this.modalStats.textContent = `Blue: ${this.combatManager.blueCore.hp} HP | Red: ${this.combatManager.redCore.hp} HP`;
    
    this.gameOverModal.classList.remove('theme-victory', 'theme-defeat', 'theme-draw', 'hidden');
    if (outcome === 'victory') {
      this.gameOverModal.classList.add('theme-victory');
    } else if (outcome === 'defeat') {
      this.gameOverModal.classList.add('theme-defeat');
    } else {
      this.gameOverModal.classList.add('theme-draw');
    }
  }

  selectCard(cardId) {
    this.selectedCardId = cardId;
    const handCards = this.handCardsContainer.querySelectorAll('.hand-card:not(.card-deploying-ghost)');
    handCards.forEach((btn) => {
      if (btn.dataset.cardId === cardId) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  renderHandUI() {
    const hand = this.deckManager.getHand();
    this.handCardsContainer.innerHTML = '';

    hand.forEach((card) => {
      const isAffordable = this.deckManager.ink >= card.cost;
      const isSelected = this.selectedCardId === card.id;

      const cardBtn = document.createElement('button');
      cardBtn.id = `card-btn-${card.id}`;
      cardBtn.dataset.cardId = card.id;
      cardBtn.className = `hand-card ${isAffordable ? 'affordable' : 'disabled'} ${
        isSelected ? 'selected' : ''
      }`.trim();

      // 1. Card Name (Full width, centered, always 100% visible)
      const nameDiv = document.createElement('div');
      nameDiv.className = 'card-name';
      nameDiv.textContent = card.name;

      // 2. Card Cost Badge (Nowrap inline-flex pill: icon and number strictly on 1 line)
      const costBadge = document.createElement('div');
      costBadge.className = `card-cost-badge ${isAffordable ? '' : 'disabled'}`;
      costBadge.innerHTML = `<span class="cost-drop">💧</span><span class="cost-val">${card.cost}</span>`;

      // 3. Card Icon / NPC Unit Canvas Portrait
      const iconDiv = document.createElement('div');
      iconDiv.className = 'card-icon';
      iconDiv.appendChild(createUnitCardIconCanvas(card.id, 28, 'blue'));

      // 4. Card Combat Stats Row (HP & Contextual ATK: 🗡️ melee, 🏹 ranged, 💥 splash)
      const statsDiv = document.createElement('div');
      statsDiv.className = 'card-stats-grid';

      const hpChip = document.createElement('span');
      hpChip.className = 'card-stat-chip';
      hpChip.textContent = `❤️ ${card.hp}`;
      hpChip.title = `HP: ${card.hp}`;

      // Attack icon: sword (melee), bow (ranged), boom (splash)
      let atkIcon = '🗡️';
      if (card.id === 'splat' || card.aoeRadius) {
        atkIcon = '💥';
      } else if (card.id === 'ranger' || card.attackRange > 2.0) {
        atkIcon = '🏹';
      }

      const dmgChip = document.createElement('span');
      dmgChip.className = 'card-stat-chip';
      dmgChip.textContent = `${atkIcon} ${card.damage}`;
      dmgChip.title = `Attack: ${card.damage}`;

      statsDiv.appendChild(hpChip);
      statsDiv.appendChild(dmgChip);

      cardBtn.appendChild(nameDiv);
      cardBtn.appendChild(costBadge);
      cardBtn.appendChild(iconDiv);
      cardBtn.appendChild(statsDiv);

      // Click handler: selects the card as active without recreating DOM
      cardBtn.addEventListener('click', () => {
        this.selectCard(card.id);
      });

      // Continuous drag-to-draw support on Touch devices (Mobile)
      cardBtn.addEventListener(
        'touchstart',
        (e) => {
          if (e.cancelable) {
            e.preventDefault();
          }
          this.selectCard(card.id);

          if (this.deckManager.ink < card.cost) {
            this.triggerInkError(card.id);
            return;
          }

          if (e.touches && e.touches.length > 0) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const startX = Math.max(rect.left + 15, Math.min(rect.right - 15, touch.clientX));
            const startY = rect.bottom; // Start on the baseline (y = PLAYER_START_Y)
            this.inputManager.startDrawingFromExternal(startX, startY);
          }
        },
        { passive: false }
      );

      // Continuous drag-to-draw support on Desktop Mouse
      cardBtn.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        this.selectCard(card.id);

        if (this.deckManager.ink < card.cost) {
          this.triggerInkError(card.id);
          return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const startX = Math.max(rect.left + 15, Math.min(rect.right - 15, e.clientX));
        const startY = rect.bottom; // Start on the baseline (y = PLAYER_START_Y)
        this.inputManager.startDrawingFromExternal(startX, startY);
      });

      this.handCardsContainer.appendChild(cardBtn);
    });
  }

  updateHUD() {
    const mult = this.deckManager.getRateMultiplier();

    // 1. Enemy Ink Bar (mirrors player's ink meter)
    const redInkVal = this.botManager.ink;
    const redInkPct = (redInkVal / this.botManager.maxInk) * 100;
    if (this.enemyInkBarFill) this.enemyInkBarFill.style.width = `${redInkPct}%`;
    if (this.enemyInkText) this.enemyInkText.textContent = `ENEMY: ${redInkVal.toFixed(1)} / 10 INK`;
    if (this.enemyInkRateText) this.enemyInkRateText.textContent = `+${(mult * BASE_INK_REGEN_RATE).toFixed(1)}/s`;

    // 3. Timer & Multiplier
    const remaining = Math.ceil(this.deckManager.matchTimeRemaining);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    this.matchTimerText.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (mult > 1) {
      this.multiplierBadge.textContent = `${mult}x INK`;
      this.multiplierBadge.classList.add('badge-multiplier-active');
      this.multiplierBadge.classList.remove('badge-multiplier-normal');
    } else {
      this.multiplierBadge.textContent = '1x';
      this.multiplierBadge.classList.add('badge-multiplier-normal');
      this.multiplierBadge.classList.remove('badge-multiplier-active');
    }

    // 3. Main Player Ink Bar Fill & Text
    const blueInkVal = this.deckManager.ink;
    const blueInkPct = (blueInkVal / this.deckManager.maxInk) * 100;
    this.inkBarFill.style.width = `${blueInkPct}%`;
    this.inkText.textContent = `${blueInkVal.toFixed(1)} / 10 INK`;
    this.inkRateText.textContent = `+${(mult * BASE_INK_REGEN_RATE).toFixed(1)}/s`;

    // 5. Update disabled states on card buttons without full re-render
    const handCards = this.handCardsContainer.querySelectorAll('.hand-card:not(.card-deploying-ghost)');
    const hand = this.deckManager.getHand();
    handCards.forEach((btn, idx) => {
      const card = hand[idx];
      if (!card) return;
      const isAffordable = blueInkVal >= card.cost;
      const isSelected = this.selectedCardId === card.id;

      btn.className = `hand-card ${isAffordable ? 'affordable' : 'disabled'} ${
        isSelected ? 'selected' : ''
      }`.trim();

      const costBadge = btn.querySelector('.card-cost-badge');
      if (costBadge) {
        costBadge.className = `card-cost-badge ${isAffordable ? '' : 'disabled'}`;
      }
    });
  }

  updateConfetti(dt) {
    if (this.confettiParticles.length === 0) return;
    const ctx = this.ctx;
    for (const p of this.confettiParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.rotation += p.vRot;
      p.life = Math.max(0, p.life - dt * 0.4);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    this.confettiParticles = this.confettiParticles.filter((p) => p.life > 0);
  }

  loop(timestamp) {
    if (this.isInfoOpen) {
      this.lastTime = timestamp;
      requestAnimationFrame((t) => this.loop(t));
      return;
    }

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    if (!this.winner) {
      // 1. Tip card auto-hide timer
      if (!this.tipHidden) {
        this.matchElapsedTime += dt;
        this.checkTipVisibility();
      }

      // 2. Deck and ink economy
      this.deckManager.update(dt);
      this.inputManager.update(dt);

      // Speed-up phase transition (1min / 2min marks)
      const currentRateMultiplier = this.deckManager.getRateMultiplier();
      if (currentRateMultiplier > this.lastRateMultiplier) {
        this.triggerSpeedUpEffect(currentRateMultiplier);
      }
      this.lastRateMultiplier = currentRateMultiplier;

      // 30-second match-end warning (fires once)
      const timeRemaining = this.deckManager.matchTimeRemaining;
      if (!this.timeWarningShown && timeRemaining <= 30 && timeRemaining > 0) {
        this.timeWarningShown = true;
        soundFX.playTimeWarning();
        this.triggerMatchAlertEffect('30 SECONDS LEFT!');
      }

      // Final 5-4-3-2-1 countdown ticks
      const countdownSecond = Math.ceil(timeRemaining);
      if (timeRemaining > 0 && countdownSecond <= 5 && countdownSecond !== this.lastCountdownSecond) {
        this.lastCountdownSecond = countdownSecond;
        soundFX.playCountdownTick(countdownSecond);
        this.triggerMatchAlertEffect(`${countdownSecond}`);
      }

      // 3. Bot Opponent tick — ink regenerates symmetrically with the player from the
      // start, but the bot withholds deploying its first unit until the player deploys theirs.
      this.botManager.update(dt, this.deckManager.getRateMultiplier(), this.playerCardsDeployed > 0, this.deckManager.ink, (type, path) => {
        this.combatManager.spawnUnit(type, 'red', path);
        soundFX.playDeploy();
      });

      // 4. Combat simulation tick
      this.combatManager.update(dt, this.deckManager.bottles, (awardTeam, amount) => {
        if (awardTeam === 'blue') {
          this.deckManager.grantInk(amount);
          this.triggerInkBump();
        } else {
          this.botManager.grantInk(amount);
        }
      });

      // 5. Check win/loss
      this.checkEndConditions();
    }

    // 5. Render canvas frame
    const drawState = this.inputManager.getDrawState();
    const botPath = this.botManager.getActiveDrawnPath();

    this.renderer.render(
      this.combatManager.units,
      this.deckManager.bottles,
      this.combatManager.obstacles,
      this.combatManager.projectiles,
      this.combatManager.particles,
      this.combatManager.blueCore,
      this.combatManager.redCore,
      drawState,
      botPath,
      false,
      this.combatManager.aoeSplashes
    );

    // 6. Confetti particles on victory
    this.updateConfetti(dt);

    // 7. Update HUD
    this.updateHUD();

    requestAnimationFrame((t) => this.loop(t));
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new DoodleClashApp();
});
