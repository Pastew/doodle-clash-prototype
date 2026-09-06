export const GRID_COLS = 18;
export const GRID_ROWS = 32;
export const MAX_PATH_NODES = 80;
export const PLAYER_START_Y = 30; // Locked starting Y at the player's base (moved 1 unit higher from 31 to 30)
export const DRAW_ON_GRID_LINES = true; // Locked decision: paths, waypoints, and units travel directly along graph paper lines

// Base ink regen rate per second at 1x speed; the 1x/2x/3x match phases multiply this directly (0.4 / 0.8 / 1.2)
export const BASE_INK_REGEN_RATE = 0.4;

// Base Turret Defense Constants
export const BASE_ATTACK_RANGE = 4.8; // Defense perimeter in grid cells
export const BASE_ATTACK_INTERVAL = 1.1; // Attack interval in seconds
export const BASE_ATTACK_DAMAGE = 2; // Damage per turret bolt

// Unit Facing & Direction Config (LOCKED DECISION: units face movement & combat target)
export const UNIT_FACING_CONFIG = {
  FACE_MOVEMENT_DIRECTION: true, // Locked: Unit when moving always faces direction of movement
  FACE_TARGET_DIRECTION: true,   // Locked: Unit when attacking always faces direction of target
};

export const CARDS_DATA = {
  bulker: {
    id: 'bulker',
    name: 'Bulker',
    cost: 5,
    description: 'Heavy juggernaut titan. Absorbs massive punishment and smashes with a club.',
    role: 'Tank',
    hp: 16,
    damage: 5, // buffed from 4: strengthens the top-cost card's identity as a clear power pick
    speed: 1.035, // grid cells per second (+15% from 0.9)
    attackRange: 1.4,
    detectRange: 3.5,
    attackSpeed: 1.3,
    silhouette: 'studded-bat',
  },
  speeder: {
    id: 'speeder',
    name: 'Speeder',
    cost: 1,
    description: 'Ultra-fast diamond dart assassin. Dashes across the paper with lightning speed.',
    role: 'Assassin',
    hp: 2,
    damage: 2,
    speed: 5.0,
    attackRange: 1.2,
    detectRange: 3.2,
    attackSpeed: 0.6,
    silhouette: 'diamond-dart',
  },
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    cost: 4,
    description: 'Sharpshooter box with a rifle barrel. Fires lethal long-range ink darts.',
    role: 'Sniper',
    hp: 3, // bumped from 2: no longer identically fragile to the cheapest unit (Speeder) despite costing 4x more
    damage: 5,
    speed: 1.1,
    attackRange: 5.6, // trimmed from 6.5: still the longest range in the game, less of a "never reachable" outlier
    detectRange: 5.6,
    attackSpeed: 1.8,
    silhouette: 'square-rifle',
  },
  splat: {
    id: 'splat',
    name: 'Splat Blob',
    cost: 3,
    description: 'Squished ink blob that hurls explosive ink splash.',
    role: 'AoE Blaster',
    hp: 5,
    damage: 3,
    speed: 1.0,
    attackRange: 3.6,
    detectRange: 3.6,
    attackSpeed: 1.5,
    aoeRadius: 2.0,
    silhouette: 'blob-splat',
  },
  wall: {
    id: 'wall',
    name: 'Ink Wall',
    cost: 4,
    description: 'Heavy mobile barricade. Marches relentlessly into combat and rams enemy targets.',
    role: 'Battering Ram',
    hp: 30,
    damage: 1,
    speed: 0.7,
    attackRange: 1.2,
    detectRange: 3.0,
    attackSpeed: 1.5,
    silhouette: 'hexagon-wall',
  },
  scribblers: {
    id: 'scribblers',
    name: 'Scribblers',
    cost: 2,
    description: '4 mini triangle sketches running together.',
    role: 'Swarm',
    hp: 1,
    damage: 1,
    speed: 2.6,
    attackRange: 1.1,
    detectRange: 2.8,
    attackSpeed: 0.6, // slowed from 0.5: swarm's DPS-per-cost was a clear outlier vs the rest of the roster
    silhouette: 'triangles-swarm',
  },
};

export const INITIAL_DECK = [
  CARDS_DATA.bulker,
  CARDS_DATA.speeder,
  CARDS_DATA.ranger,
  CARDS_DATA.splat,
  CARDS_DATA.wall,
  CARDS_DATA.scribblers,
];

// Predefined ink bottle spots on 18x32 notebook grid: spread on outer flanks with strictly ONE position in the middle
export const PREDEFINED_BOTTLE_SPOTS = [
  { x: 2, y: 6 },   // Red far-left outer flank
  { x: 15, y: 6 },  // Red far-right outer flank
  { x: 2, y: 11 },  // Red mid-left outer flank
  { x: 15, y: 11 }, // Red mid-right outer flank
  { x: 9, y: 16 },  // Strictly ONE position in the middle (exact center)
  { x: 2, y: 21 },  // Blue mid-left outer flank
  { x: 15, y: 21 }, // Blue mid-right outer flank
  { x: 2, y: 26 },  // Blue far-left outer flank
  { x: 15, y: 26 }, // Blue far-right outer flank
];

// Predefined obstacle blot spots along the diagonal on 18x32 grid
export const PREDEFINED_OBSTACLE_SPOTS = [
  { x: 5, y: 12 }, // Upper-left (Red diagonal)
  { x: 12, y: 20 }, // Lower-right (Blue diagonal)
];

// Helper to snap canvas point to grid coordinate
export function screenToGrid(px, py, canvasWidth, canvasHeight) {
  const cellWidth = canvasWidth / GRID_COLS;
  const cellHeight = canvasHeight / GRID_ROWS;
  const col = Math.floor(px / cellWidth);
  const row = Math.floor(py / cellHeight);
  return {
    x: Math.max(0, Math.min(GRID_COLS - 1, col)),
    y: Math.max(0, Math.min(GRID_ROWS - 1, row)),
  };
}

// Helper to convert grid coordinate to screen pixel center
export function gridToScreen(gx, gy, canvasWidth, canvasHeight) {
  const cellWidth = canvasWidth / GRID_COLS;
  const cellHeight = canvasHeight / GRID_ROWS;
  return {
    x: (gx + 0.5) * cellWidth,
    y: (gy + 0.5) * cellHeight,
  };
}

// Helper Euclidean distance between 2 grid coords
export function gridDist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
