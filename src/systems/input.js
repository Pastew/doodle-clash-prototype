import { GRID_COLS, GRID_ROWS, MAX_PATH_NODES, PLAYER_START_Y, gridToScreen, screenToGrid } from '../constants.js';
import { soundFX } from '../utils/audio.js';

export class DoodleInputManager {
  constructor(canvas, onPathCompleted, canStartDrawing = null, onDrawingBlocked = null) {
    this.canvas = canvas;
    this.isDrawing = false;
    this.rawPoints = [];
    this.gridNodes = [];
    this.activeTrail = null;
    this.onPathCompleted = onPathCompleted;
    this.canStartDrawing = canStartDrawing;
    this.onDrawingBlocked = onDrawingBlocked;
    this.lastScribbleTime = 0;

    this.attachEvents();
  }

  update(dt) {
    if (this.activeTrail) {
      this.activeTrail.fadeTimer -= dt;
      if (this.activeTrail.fadeTimer <= 0) {
        this.activeTrail = null;
      }
    }
  }

  setOnPathCompleted(cb) {
    this.onPathCompleted = cb;
  }

  attachEvents() {
    this.handleStart = (e) => {
      if (e.button !== 0) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.startAt(x, y);
    };

    this.handleMove = (e) => {
      if (!this.isDrawing) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.moveTo(x, y);
    };

    this.handleEnd = () => {
      if (!this.isDrawing) return;
      this.endAt();
    };

    this.handleTouchStart = (e) => {
      e.preventDefault();
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.startAt(x, y);
    };

    this.handleTouchMove = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.moveTo(x, y);
    };

    this.handleTouchEnd = (e) => {
      if (!this.isDrawing) return;
      if (e && e.cancelable) {
        e.preventDefault();
      }
      this.endAt();
    };

    // Mouse
    this.canvas.addEventListener('mousedown', this.handleStart);
    window.addEventListener('mousemove', this.handleMove);
    window.addEventListener('mouseup', this.handleEnd);

    // Touch
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd);
    window.addEventListener('touchcancel', this.handleTouchEnd);
  }

  destroy() {
    this.canvas.removeEventListener('mousedown', this.handleStart);
    window.removeEventListener('mousemove', this.handleMove);
    window.removeEventListener('mouseup', this.handleEnd);

    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('touchcancel', this.handleTouchEnd);
  }

  startDrawingFromExternal(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = screenX - rect.left;
    const y = screenY - rect.top;
    this.startAt(x, y);
  }

  moveDrawingFromExternal(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = screenX - rect.left;
    const y = screenY - rect.top;
    this.moveTo(x, y);
  }

  endDrawingExternal() {
    this.endAt();
  }

  startAt(px, py) {
    if (this.canStartDrawing && !this.canStartDrawing()) {
      if (this.onDrawingBlocked) {
        this.onDrawingBlocked();
      }
      return;
    }

    this.isDrawing = true;
    this.activeTrail = null;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const snapped = screenToGrid(px, py, width, height);

    // Starting point position Y (green point) is always fixed at the bottom of our field (PLAYER_START_Y)
    const startX = Math.max(1, Math.min(GRID_COLS - 2, snapped.x));
    const startNode = { x: startX, y: PLAYER_START_Y };
    const startScreenPt = gridToScreen(startNode.x, startNode.y, width, height);

    // Initialize ONLY with the single green start node (no blue dots!)
    this.gridNodes = [startNode];
    this.rawPoints = [startScreenPt];

    soundFX.playScribble();
    this.lastScribbleTime = performance.now();
  }

  moveTo(px, py) {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Constrain X to canvas width
    const cx = Math.max(0, Math.min(width, px));
    const cy = py;

    const targetGrid = screenToGrid(cx, cy, width, height);

    // If swipe/finger is under or at the initial Y position (y >= PLAYER_START_Y)
    if (targetGrid.y >= PLAYER_START_Y) {
      if (this.gridNodes.length <= 1) {
        // Sliding horizontally under/along the baseline before swiping up:
        // Update the green start anchor position without adding blue dots
        const newX = Math.max(1, Math.min(GRID_COLS - 2, targetGrid.x));
        this.gridNodes = [{ x: newX, y: PLAYER_START_Y }];
        const startScreenPt = gridToScreen(newX, PLAYER_START_Y, width, height);
        this.rawPoints = [startScreenPt];
        return;
      } else {
        // Player already drew into the field and dragged back below baseline: clamp Y
        targetGrid.y = PLAYER_START_Y;
      }
    }

    // Now finger is above initial Y position (targetGrid.y < PLAYER_START_Y)
    const clampedCy = Math.max(0, Math.min(height, cy));
    this.rawPoints.push({ x: cx, y: clampedCy });

    // Procedural sound tick
    const now = performance.now();
    if (now - this.lastScribbleTime > 120) {
      soundFX.playScribble();
      this.lastScribbleTime = now;
    }

    const lastNode = this.gridNodes[this.gridNodes.length - 1];
    if (!lastNode) {
      this.gridNodes.push({
        x: Math.max(0, Math.min(GRID_COLS - 1, targetGrid.x)),
        y: Math.max(0, Math.min(PLAYER_START_Y, targetGrid.y)),
      });
      return;
    }

    const dx = targetGrid.x - lastNode.x;
    const dy = targetGrid.y - lastNode.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Place a new waypoint dot only if cursor is at least 2 grid distance away from the last placed dot
    const MIN_NODE_DISTANCE = 2.0;

    if (dist >= MIN_NODE_DISTANCE) {
      if (this.gridNodes.length < MAX_PATH_NODES) {
        this.gridNodes.push({
          x: Math.max(0, Math.min(GRID_COLS - 1, targetGrid.x)),
          y: Math.max(0, Math.min(PLAYER_START_Y, targetGrid.y)),
        });
      }
    }
  }

  endAt() {
    this.isDrawing = false;

    // Mobile/quick flick support: If player swiped into the arena but lifted finger before MIN_NODE_DISTANCE,
    // ensure the endpoint in the arena is captured as a valid waypoint.
    if (this.gridNodes.length === 1 && this.rawPoints.length > 1) {
      const lastPt = this.rawPoints[this.rawPoints.length - 1];
      const rect = this.canvas.getBoundingClientRect();
      const endGrid = screenToGrid(lastPt.x, lastPt.y, rect.width, rect.height);
      if (endGrid.y < PLAYER_START_Y) {
        this.gridNodes.push({
          x: Math.max(0, Math.min(GRID_COLS - 1, endGrid.x)),
          y: Math.max(0, Math.min(PLAYER_START_Y - 1, endGrid.y)),
        });
      }
    }

    // Player must draw a line with at least one dot placed (start anchor + >= 1 placed dot)
    if (this.gridNodes.length >= 2) {
      const completedPath = [...this.gridNodes];
      this.activeTrail = {
        gridNodes: completedPath,
        rawPoints: [...this.rawPoints],
        fadeTimer: 2.5,
      };
      this.gridNodes = [];
      this.rawPoints = [];
      if (this.onPathCompleted) {
        this.onPathCompleted(completedPath);
      }
    } else {
      // Less than one dot placed (e.g. single tap/click without drawing): cancel, do not spawn
      this.gridNodes = [];
      this.rawPoints = [];
    }
  }

  getDrawState() {
    if (this.isDrawing) {
      return {
        isDrawing: true,
        points: this.rawPoints,
        gridNodes: this.gridNodes,
        fadeAlpha: 1.0,
      };
    } else if (this.activeTrail) {
      return {
        isDrawing: false,
        points: this.activeTrail.rawPoints,
        gridNodes: this.activeTrail.gridNodes,
        fadeAlpha: Math.min(1.0, this.activeTrail.fadeTimer),
      };
    }
    return {
      isDrawing: false,
      points: [],
      gridNodes: [],
      fadeAlpha: 0,
    };
  }

  clear() {
    this.rawPoints = [];
    this.gridNodes = [];
    this.activeTrail = null;
    this.isDrawing = false;
  }
}
