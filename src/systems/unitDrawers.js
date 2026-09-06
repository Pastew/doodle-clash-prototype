/**
 * unitDrawers.js
 * Unified drawing functions for units and card icons.
 * Ensures zero code duplication between battlefield combat units and UI card icons.
 * Modify unit visuals here to automatically update both in-game units and card portraits.
 */

/**
 * Bulker Classic: Square torso with small club (retained for instant rollback if requested)
 */
export function drawBulkerClassic(ctx, size, color, fillColor) {
  const bSize = size * 1.25;
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;

  ctx.fillRect(-bSize * 0.5, -bSize * 0.5, bSize, bSize);
  ctx.strokeRect(-bSize * 0.5, -bSize * 0.5, bSize, bSize);

  ctx.fillStyle = color;
  ctx.fillRect(-bSize * 0.15, -bSize * 0.65, bSize * 0.3, bSize * 0.4);
  ctx.beginPath();
  ctx.arc(0, -bSize * 0.65, bSize * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Bulker: Heavy brawler square chassis with internal studded war club (matches user sketch).
 * Sturdy square body with a hand-drawn diagonal spiked bat inside, featuring attack swing animation.
 */
export function drawBulker(ctx, size, color, fillColor, options = {}) {
  // 1.5x bigger graphic for heavy juggernaut presence (scaled from 1.25 to 1.88)
  const bSize = size * 1.88;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 1. Sturdy square torso / chassis
  ctx.fillRect(-bSize * 0.5, -bSize * 0.5, bSize, bSize);
  ctx.strokeRect(-bSize * 0.5, -bSize * 0.5, bSize, bSize);

  // 2. Studded War Club diagonally inside the square (matches user sketch)
  ctx.save();

  // Juicy attack swing: when attacking, the club winds up and swings through
  let swingAngle = 0;
  if (options.attackProgress && options.attackProgress > 0) {
    swingAngle = Math.sin((1 - options.attackProgress) * Math.PI) * 0.42;
  }

  // Tilt club diagonally (handle at bottom-left, domed spiked head at top-right)
  ctx.rotate(Math.PI / 4.1 + swingAngle);

  // Club sizing fitted cleanly inside the square with balanced negative space
  const clubLength = bSize * 1.02;
  const handleBottom = clubLength * 0.40;
  const handleTop = clubLength * 0.14;
  const handleHalfW = clubLength * 0.055;
  const barrelBottomHalfW = clubLength * 0.11;
  const barrelTopY = -clubLength * 0.33;
  const barrelTopHalfW = clubLength * 0.165;

  // Club fill: clean white interior so the weapon pops prominently against the colored square
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.0;

  // 2a. Straight handle grip
  ctx.beginPath();
  ctx.rect(-handleHalfW, handleTop, handleHalfW * 2, handleBottom - handleTop);
  ctx.fill();
  ctx.stroke();

  // 2b. Rounded pommel knob at base
  ctx.beginPath();
  ctx.ellipse(0, handleBottom + clubLength * 0.025, clubLength * 0.11, clubLength * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 2c. Main club barrel with smooth rounded dome head
  ctx.beginPath();
  ctx.moveTo(barrelBottomHalfW, handleTop);
  ctx.lineTo(barrelTopHalfW, barrelTopY);
  ctx.arc(0, barrelTopY, barrelTopHalfW, 0, Math.PI, true);
  ctx.lineTo(-barrelBottomHalfW, handleTop);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2d. 4 Studded rounded spikes (2 left, 2 right, staggered matching user sketch)
  const studR = clubLength * 0.065;

  // Left side studs
  const leftStudsY = [-clubLength * 0.22, -clubLength * 0.05];
  for (const sy of leftStudsY) {
    const t = (sy - handleTop) / (barrelTopY - handleTop);
    const edgeX = -barrelBottomHalfW - t * (barrelTopHalfW - barrelBottomHalfW);
    ctx.beginPath();
    ctx.arc(edgeX, sy, studR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Right side studs
  const rightStudsY = [-clubLength * 0.29, -clubLength * 0.12];
  for (const sy of rightStudsY) {
    const t = (sy - handleTop) / (barrelTopY - handleTop);
    const edgeX = barrelBottomHalfW + t * (barrelTopHalfW - barrelBottomHalfW);
    ctx.beginPath();
    ctx.arc(edgeX, sy, studR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore();
}

/**
 * Speeder: Fast darting diamond-dart assassin (compact, sharp, ultra-fast)
 */
export function drawSpeeder(ctx, size, color, fillColor) {
  // Smaller graphic: 0.70x scale factor for lightweight speeder identity
  const sSize = size * 0.70;

  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Aerodynamic Diamond Dart (Rhombus) chassis
  ctx.beginPath();
  ctx.moveTo(0, -sSize * 1.25);  // sharp forward prow
  ctx.lineTo(sSize * 0.65, 0);   // right wing point
  ctx.lineTo(0, sSize * 0.85);   // rear tail
  ctx.lineTo(-sSize * 0.65, 0);  // left wing point
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Longitudinal razor speed spine
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -sSize * 1.25);
  ctx.lineTo(0, sSize * 0.85);
  ctx.stroke();

  // Lateral swept aerodynamic wing creases
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-sSize * 0.65, 0);
  ctx.lineTo(0, -sSize * 0.2);
  ctx.lineTo(sSize * 0.65, 0);
  ctx.stroke();

  ctx.restore();
}

/**
 * Ranger: Longshot sniper box with extended barrel
 */
export function drawRanger(ctx, size, color, fillColor) {
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;

  // Turret body
  ctx.fillRect(-size * 0.5, -size * 0.5, size, size);
  ctx.strokeRect(-size * 0.5, -size * 0.5, size, size);

  // Extended sniper barrel line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -size * 1.45);
  ctx.stroke();

  // Muzzle sight dot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -size * 1.45, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Splat Blob: Symmetrical gelatinous ink blob with 4-way splash droplet satellites
 */
export function drawSplat(ctx, size, color, fillColor) {
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;

  const radius = size * 0.72;

  // Symmetrical circular ink blob core
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Symmetrical splash droplet satellites (4-way radial symmetry)
  ctx.fillStyle = color;
  const dropDist = radius * 0.88;
  const dropR = size * 0.16;
  const dropAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];

  ctx.beginPath();
  for (const a of dropAngles) {
    const dx = Math.cos(a) * dropDist;
    const dy = Math.sin(a) * dropDist;
    ctx.moveTo(dx + dropR, dy);
    ctx.arc(dx, dy, dropR, 0, Math.PI * 2);
  }
  ctx.fill();

  // Symmetrical interior ink swirl / core ring
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Ink Wall: Symmetrical regular hexagon barricade with stonework masonry lines
 */
export function drawWall(ctx, size, color, fillColor) {
  const hexRadius = size * 1.12;
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;

  // Symmetrical regular hexagon (equal radius, no vertical flattening)
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const hx = Math.cos(angle) * hexRadius;
    const hy = Math.sin(angle) * hexRadius;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Symmetrical stonework brick doodle lines
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;

  // Central horizontal mortar line (centered at y = 0)
  ctx.beginPath();
  ctx.moveTo(-hexRadius * 0.85, 0);
  ctx.lineTo(hexRadius * 0.85, 0);
  ctx.stroke();

  // Symmetrical vertical joint dividers:
  // Top tier joints: mirrored symmetrically at x = -hexRadius * 0.4 and +hexRadius * 0.4
  ctx.beginPath();
  ctx.moveTo(-hexRadius * 0.4, -hexRadius * 0.72);
  ctx.lineTo(-hexRadius * 0.4, 0);
  ctx.moveTo(hexRadius * 0.4, -hexRadius * 0.72);
  ctx.lineTo(hexRadius * 0.4, 0);

  // Bottom tier joint: centered at x = 0
  ctx.moveTo(0, 0);
  ctx.lineTo(0, hexRadius * 0.72);
  ctx.stroke();

  // Central reinforced rivet / boss dot (perfectly centered)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, hexRadius * 0.14, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Single Scribbler: Tiny triangle sketch unit
 */
export function drawScribbler(ctx, size, color, fillColor) {
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;

  ctx.beginPath();
  ctx.moveTo(0, -size * 0.85);
  ctx.lineTo(size * 0.72, size * 0.62);
  ctx.lineTo(-size * 0.72, size * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/**
 * Scribblers Swarm (Used for card icon): 4 mini triangle sketches in formation
 */
export function drawScribblersSwarm(ctx, size, color, fillColor) {
  const subSize = size * 0.58;
  const offsets = [
    { x: -size * 0.44, y: -size * 0.36 },
    { x: size * 0.44, y: -size * 0.36 },
    { x: -size * 0.44, y: size * 0.36 },
    { x: size * 0.44, y: size * 0.36 },
  ];

  for (const off of offsets) {
    ctx.save();
    ctx.translate(off.x, off.y);
    drawScribbler(ctx, subSize, color, fillColor);
    ctx.restore();
  }
}

/**
 * Registry of unit drawers
 */
export const UNIT_DRAWERS = {
  bulker: drawBulker,
  speeder: drawSpeeder,
  dash: drawSpeeder,
  ranger: drawRanger,
  longshot: drawRanger,
  splat: drawSplat,
  wall: drawWall,
  scribbler: drawScribbler,
  scribblers: drawScribblersSwarm,
};

/**
 * Universal unit drawer helper
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} type - 'bulker' | 'speeder' | 'ranger' | 'splat' | 'wall' | 'scribblers'
 * @param {number} size - base size in pixels
 * @param {string} color - primary outline & weapon stroke color
 * @param {string} fillColor - body interior fill color
 * @param {object} [options] - optional flags (e.g. { isSingleSub: boolean, isIcon: boolean })
 */
export function drawUnitVisual(ctx, type, size, color, fillColor, options = {}) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = 1.8;

  if (type === 'scribblers' && options.isSingleSub) {
    drawScribbler(ctx, size, color, fillColor);
  } else {
    const drawer = UNIT_DRAWERS[type] || UNIT_DRAWERS.speeder;
    drawer(ctx, size, color, fillColor, options);
  }

  ctx.restore();
}

/**
 * Creates a crisp, high-DPI mini canvas icon of any unit for deck card displays.
 * @param {string} type - Card/unit ID
 * @param {number} displaySize - CSS pixel dimensions (e.g. 26)
 * @param {'blue'|'red'} [team] - Visual team color palette
 * @returns {HTMLCanvasElement}
 */
export function createUnitCardIconCanvas(type, displaySize = 26, team = 'blue') {
  const canvas = document.createElement('canvas');
  const dpr = Math.max(2, window.devicePixelRatio || 2);
  canvas.width = Math.round(displaySize * dpr);
  canvas.height = Math.round(displaySize * dpr);
  canvas.style.width = `${displaySize}px`;
  canvas.style.height = `${displaySize}px`;
  canvas.className = 'unit-portrait-canvas';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.translate(displaySize / 2, displaySize / 2);

  const color = team === 'blue' ? '#1d4ed8' : '#b91c1c';
  const fillColor = team === 'blue' ? 'rgba(191, 219, 254, 0.95)' : 'rgba(254, 202, 202, 0.95)';

  // Calibrate scale per unit so they all look balanced inside the icon square
  let unitSize = displaySize * 0.44;
  if (type === 'speeder') unitSize = displaySize * 0.50; // calibrated for the compact diamond dart
  if (type === 'wall') unitSize = displaySize * 0.38; // symmetrical regular hexagon
  if (type === 'splat') unitSize = displaySize * 0.38; // symmetrical ink blob
  if (type === 'bulker') unitSize = displaySize * 0.28; // square torso with internal studded club (1.88x base size)
  if (type === 'ranger') unitSize = displaySize * 0.34; // extended barrel
  if (type === 'scribblers') unitSize = displaySize * 0.34; // 4-pack cluster

  drawUnitVisual(ctx, type, unitSize, color, fillColor, { isIcon: true });

  return canvas;
}
