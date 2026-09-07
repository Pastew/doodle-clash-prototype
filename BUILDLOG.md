# Build Log: Doodle Clash
**Genre:** Tower Defense & Strategy

This build log tracks the design, architectural, and prompting sessions for Doodle Clash.

---

## 📋 Part 1: Locked Decisions

- **Genre:** Tower Defense & Strategy. Includes defenses, unit variety, threat escalation, and a functional economy.
- **Core Loop:** Symmetrical Ink Economy → Card Selection → "Drag & Draw" Path → Grid-Snapped Movement → Clash (Units, Obstacles, Cores).
- **Controls:** Touch/mouse swipe inside a 9:16 portrait viewport styled as a notebook on a wooden desk.
- **Tech Stack:** HTML5 2D Canvas + Vanilla JS (ES Modules). Stripped out heavy third-party runtime frameworks to keep files unminified, inspectable, lightweight, and 100% offline-ready.
- **Architecture:** Modular systems (`input.js`, `deck.js`, `combat.js`, `bot.js`, `renderer.js`, `audio.js`) integrated seamlessly under `main.js` and `index.html`.
- **Roster (N = 6):** 
  1. *Bulker* (High HP, slow melee tank)
  2. *Dash / Speeder* (Low HP, fast melee)
  3. *Longshot / Ranger* (Low HP, long-range sniper)
  4. *Splat* (Low HP, AoE ranged mortar)
  5. *Wall* (High HP, slow movement, parks permanently to block)
  6. *Scribblers* (Low HP, cheap 3x swarm)
- **Grid Layout & Path Snapping:** 18 columns x 32 rows squared graph paper grid. Drawing paths, waypoints, and marching units align directly along the printed graph paper lines and intersections (via half-cell alignment) rather than floating in square centers.
- **Map & Spawn Logic:**
  - *Cores:* Blue HQ (Player, Bottom) and Red Fortress (AI, Top) with balanced health pools, automated defensive auto-attack turrets, and distinct synthesized damage audio cues (defensive alarm thud for Player HQ vs. triumphant offensive crack for Red Fortress) with mobile haptic feedback scaling inversely with base HP.
  - *Obstacles:* Center paper ink hazards with destructible collision.
  - *Ink Bottles:* Neutral capture points spawning periodically across outer flanks and center midline. Pure random tier on spawn (1 HP $\rightarrow$ +1 Ink, 2 HP $\rightarrow$ +2 Ink, 3 HP $\rightarrow$ +3 Ink). Last hit = winner of the ink.
- **Red Bot AI:** Symmetrical ink economy. Strategically deploys counter-units along lane branches with dynamic target selection.

---

## 🛠️ Part 2: Session History

### Session 1: Initial Scoping & Architecture
- **Tool:** Gemini Notebook
- **What We Built:** 5-Phase Prompting Playbook (`doodle-clash-ai-prompting-playbook-v3.md`).
- **Key Decisions:**
  - Designed isolated debug targets to force clean, unminified, and modular architectures.
  - Capped active units to N = 6 for clear rock-paper-scissors balance.
  - Formulated neutral Ink Bottles as destructible entities to reuse collision and combat pipelines.
- **Pivots:**
  - *Three.js to 2D Canvas:* Shifted to native HTML5 2D Canvas for authentic wobbly ballpoint pencil doodling and performance.
  - *Wall Speed Tuning:* Gave Wall initial travel speed so it traverses to the defensive line before anchoring.
- **Problems Solved:** Avoided expensive runtime pathfinding costs via grid coordinates and predetermined waypoint vectoring.

---

### Session 2: Technical Stack Purification
- **Tools:** Gemini AI Studio (Coding Agent), Gemini Notebook
- **What We Built:** Canvas Refactoring & Purification Blueprint.
- **Key Decisions:**
  - *Vanilla Architecture:* Enforced pure Vanilla JavaScript and HTML5 Canvas with native ES Modules, avoiding build-step obfuscation.
  - *Graph Paper Math:* Established the 18x32 squared paper matrix with direct coordinate transformations for range and AoE calculations.
- **Pivots:** 
  - *Grid Layout:* Swapped ruled lines for blue-lined graph paper to make spatial tactical decisions visually intuitive.
- **Problems Solved:** Prevented framework bloat and guaranteed instant 60 FPS rendering on both desktop and mobile viewports.

---

### Session 3: Core Simulation, Economy & Audio Synthesis (Batched Prompts)
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Complete game simulation engine across economy, combat physics, deck rotation, AI opponent, and zero-dependency procedural sound.
- **Key Decisions & Features:**
  - *Deck & Hand Cycling:* Implemented an 8-card cycle deck with a 4-card active hand, dynamic ink replenishment (1x, 2x, 3x overtime multipliers), and automatic replenishment.
  - *Combat Physics Engine:* Built complete unit mechanics for melee strikes, ranged sniper arrows, mortar ink arcs with AoE splash zones, stationary barriers, and swarm units.
  - *Symmetrical Bot AI:* Implemented Red Bot with proactive ink management, threat-response deployment, and dynamic lane assignment.
  - *Synthesized Web Audio API:* Replaced external audio files with a pure procedural synthesizer generating pencil scribbles, deployment swooshes, combat strikes, splat pops, error buzzers, and victory fanfares directly from code.
- **Problems Solved:** Eliminated all external asset dependencies, ensuring 100% offline gameplay with zero audio loading latency.

---

### Session 4: Visual Polish, UI Feedback & Thematic Styling (Batched Prompts)
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** High-contrast tactical feedback systems, end-game presentation, and responsive notebook UI.
- **Key Decisions & Features:**
  - *Affordability System:* Upgraded card states with high-contrast diagonal hatch textures, complete desaturation, and red deficit badges for cards lacking ink, contrasted with bright glowing cards when ready.
  - *Immediate Drawing Validation:* Blocked invalid drag/swipe gestures when ink is insufficient, backed by an immediate double-buzz error sound and synchronized visual error shake animations.
  - *Instant-Read Victory / Defeat Screens:* Rebuilt game over modals with distinct color palettes (Royal Sapphire/Gold celebration glow for Victory vs. Crimson/Ruby alert for Defeat) so match outcomes are recognizable without reading text.
  - *Contextual Onboarding:* Added floating tip cards positioned above the base with smart auto-dismissal after 5 card plays or 10 seconds.
- **Problems Solved:** Removed player confusion around ink availability and made game state transitions instantaneous and accessible.

---

### Session 5: Pathfinding Clarity & Standalone Verification (Batched Prompts)
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Path-drawing refinement, gesture tuning, and complete offline standalone audit.
- **Key Decisions & Features:**
  - *Waypoint-Only Path Representation:* Streamlined the unit path renderer to focus purely on green spawn anchors and connected dashed grid nodes, reducing visual clutter during unit deployment.
  - *Full Viewport & Touch Ergonomics:* Verified fluid pointer and touch drag handling across mobile and desktop displays with responsive container scaling.
  - *Standalone Compliance:* Verified zero-dependency architecture, unminified source code, and offline readiness for direct submission and archiving.

---

### Session 6: Proactive Bot AI & Reaction Jitter Tuning
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Overhauled enemy bot intelligence to make opponent play aggressively, strategically, and realistically.
- **Key Decisions & Features:**
  - *Proactive Affordability Deployment:* Replaced static 12-15s idle delays with real-time target planning. The bot plans intended units and deploys promptly once ink requirements are met.
  - *Human Reaction / Drawing Jitter:* Added realistic 350ms–850ms reaction jitter delays, simulating human thinking and finger drawing times.
  - *Ink Overflow Protection:* Automatically fast-tracks deployment if ink approaches the 10-ink cap to prevent waste.
  - *Dynamic Tactical Path Generation:* Expanded beyond static routes to generate varied center rushes, flanking sweeps, and neutral ink node contesting paths.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 7: Controls Streamlining & Grid-Line Alignment
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Cleaned up header HUD controls and locked unit paths directly onto graph paper lines.
- **Key Decisions & Features:**
  - *Fast-Forward Control Removal:* Hidden the fast-forward speed button from the top timer HUD, keeping the header distraction-free with pure focus on match time and multiplier status.
  - *Grid-Line Path Alignment Locked:* Replaced the floating square-center movement with direct graph-line alignment. Unit trajectories, spawn points, and waypoint dashed lines now sit and travel directly along the printed blue graph paper lines and intersections.
  - *Finger Trace Test Finalized:* Retained waypoint-only node visualization, keeping the arena clean and legible.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 8: Defensive Base Auto-Attacks & Turret Feedback
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Automated defensive base auto-attack turrets for Blue HQ and Red Fortress with projectile tracking and visual feedback.
- **Key Decisions & Features:**
  - *Symmetrical Base Turrets:* Added a 4.8-grid-cell defensive radius to both player and bot bases, automatically firing high-speed ink bolts every 1.1 seconds (2 damage per bolt) at the nearest intruder.
  - *Dynamic Projectile Tracking:* Implemented homing ink bolt projectiles with oriented dart silhouettes, ink burst impact particles, and procedural hit audio.
  - *Visual Perimeter & Battlement Sparks:* Added dashed circular defense boundaries around each fortress and synchronized muzzle flash sparks atop the castle battlements when firing.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 9: Minimalist Base Geometry & Centered Base HP Bars
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Cleaned up base visuals to a minimalist square layout, centered the base HP bar right on top of each base, and removed redundant text labels and battlement teeth.
- **Key Decisions & Features:**
  - *Clean Square Geometry:* Removed the three top battlement teeth blocks, rendering both Player and Bot bases as clean, crisp geometric squares.
  - *Centered Base HP Bar:* Repositioned the HP health bar and numeric readout to sit directly in the middle of each base, layered cleanly on top of the base square.
  - *Label Cleanup:* Removed the "RED FORTRESS" and "BLUE HQ" label texts for a modern, uncluttered battlefield appearance.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 10: Top UI Bar Cleanup & Dedicated Symmetrical Enemy Ink Bar
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Removed the redundant HP bars and mini-ink indicators from the top UI bar, keeping the top header clean with the centered timer, and introduced a full-width Enemy Ink Bar styled identically to the Player's Ink Bar.
- **Key Decisions & Features:**
  - *Removed Redundant Top HP Bars:* Removed both Blue and Red HP bars from the top header since fortress HP is now prominently displayed in the center of each base on the battlefield.
  - *Removed Mini Ink from Header:* Removed the cramped mini ink text and bars from the top UI bar for a clean, focused header.
  - *Symmetrical Enemy Ink Bar:* Created a dedicated Enemy Ink Bar above the arena mirroring the Player's Ink Bar at the bottom, complete with a 12px track, 10-unit segmentation pips, red gradient fill, live numeric readout (`ENEMY: X.X / 10 INK`), and real-time generation rate.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 11: Removed Firing Spark / Plus Sign From Base Towers
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Removed the spark cross lines (plus sign) and muzzle flash artifact that appeared when a base fortress fired its defensive turret shots.
- **Key Decisions & Features:**
  - *Clean Projectile Launch:* Base tower attacks now shoot projectiles cleanly without the extraneous plus sign / spark icon overlay on the base.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 12: Simplified End-Game Dialog & Unit Card Emoji Stats
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Simplified the end-of-game dialog title, description, and stats text, and added rich emoji-based combat stats to each unit card in the player's hand.
- **Key Decisions & Features:**
  - *Simplified End Dialog Texts:* Streamlined outcome copy to clean, crisp titles and subtitles (`Victory: Enemy base destroyed`, `Defeat: Your base was destroyed`, `Draw: Both bases fell`), and simplified stats (`Blue: X HP | Red: Y HP`).
  - *Card Combat Stats with Emojis:* Added a 2x2 stats grid to every card displaying `❤️ HP`, `⚔️ DMG`, `⚡ SPD`, and `🎯 RNG / 🗡️ Melee / 👥 Count`.
  - *Refined Card Geometry:* Adjusted card container height (98px) to house cost badge, unit name, SVG doodle silhouette, stats grid, and role pill comfortably without overcrowding.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 13: Ink Wall 1.5x Visual Scale
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Scaled the Ink Wall barricade unit 1.5x bigger in the battlefield arena.
- **Key Decisions & Features:**
  - *1.5x Wall Scaling:* Increased the hexagon wall dimension from `size * 1.3` to `size * 1.95` (`wSize`) and adjusted brick doodle lines for a bold, sturdy barricade presence.
  - *Scaled Overhead Health Bar:* Widened the overhead health bar to match the 1.5x scaled barricade and raised its offset cleanly above the enlarged unit.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 14: Reduced Drawing Node Density (Min 3 Distance Spacing)
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Replaced the dense per-grid-crossing node placement with a relaxed distance threshold requiring at least 3 grid units between consecutive path dots.
- **Key Decisions & Features:**
  - *Minimum 3 Distance Threshold:* Waypoints along player drawn trails are now only created when the pointer travels at least 3 grid units away from the previous node (`dist >= 3.0`).
  - *Clean Waypoint Presentation:* Eliminated dense dot clumps and intermediate interpolation stepping, giving the drawn dashed lines an airy, clean hand-sketched look while units smoothly march between the waypoints.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 15: Unit Stat Differentiation & Archetype Spread
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Spread unit stats across health, damage, speed, range, and attack speed to heighten tactical diversity and archetype extremes.
- **Key Decisions & Features:**
  - *Bulker:* HP increased to 15, damage up to 3, speed reduced to 0.9 cells/s, and attack speed adjusted to 1.3s for a true lumbering juggernaut brawler feel.
  - *Speeder:* HP tuned down to 2 (glass cannon), damage increased to 4, speed bumped to 3.0 cells/s, and attack speed quickened to 0.6s for lightning hit-and-run strikes.
  - *Ranger:* Damage increased to 5, range stretched to 6.5 cells, attack speed set to 1.8s, and speed adjusted to 1.1 cells/s for true long-distance sniper impact.
  - *Splat Blob:* HP tuned to 5, damage increased to 3, range expanded to 3.6 cells, and speed set to 1.0 cells/s for devastating anti-swarm artillery splash.
  - *Ink Wall:* HP boosted to 18, speed adjusted to 0.6 cells/s, creating a rock-solid battlefield barricade.
  - *Scribblers:* Speed increased to 2.6 cells/s and attack speed quickened to 0.5s for rapid, hyperactive swarm nibbling.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 16: Faster Projectiles, Snappy Damage Dust & Ink Bump Animation
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Accelerated projectile fly speeds, quickened the damage dust particle animation, and added bump animations when the player destroys ink bottles.
- **Key Decisions & Features:**
  - *Faster Projectile Velocities:* Base bolts accelerated to 26 cells/s, Ranger darts to 24 cells/s, and Splat blob lobs to 14 cells/s (doubled flight speeds) for snappy, instant combat feedback.
  - *Snappy Damage Dust:* Accelerated particle dissipation to 4.5x rate with higher initial expansion speed, giving damage impacts crisp, responsive puff animations.
  - *Ink Bottle Bump & Pop:* Added an elastic bounce/bump scale animation (1.45x scale peak) and rising glowing `+2 INK!` floating text when ink bottles are shattered.
  - *Player Ink Bar Bump Animation:* Added `@keyframes inkBump` pulse to the player's ink meter with cyan glow and brightness highlight whenever ink is destroyed and awarded.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 17: Critical Base HP (<= 5) Danger Alert Animations
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Added multi-layered high-priority danger animations whenever a base reaches 5 HP or lower.
- **Key Decisions & Features:**
  - *Expanding Shockwave Waves:* Two staggered red danger waves radiate continuously outward from the critical base.
  - *Radial Hazard Beacon Glow:* Pulsing red hazard beacon aura centered on the base structure.
  - *Heartbeat Tremor & Structural Fractures:* Added a heartbeat scale thump with high-frequency distress tremor jitter and hand-drawn pencil fissure cracks across the base face.
  - *Urgent Flashing Badge:* Added a bright pulsing warning badge (`⚠️ BASE DANGER! X HP` / `⚠️ TARGET CRITICAL! X HP`) with glowing yellow borders.
  - *Peripheral Screen Danger Vignette:* Pulsing red emergency danger gradients along the canvas edge to immediately alert the player anywhere on screen.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 18: Card Price Diversification & Economic Spread
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Diversified unit ink costs across a wide 1 to 5 ink spectrum, making cheap harasser units cheaper and the strongest titans more expensive.
- **Key Decisions & Features:**
  - *Speeder (1 Ink):* Reduced cost from 2 to 1 ink, turning Speeder into an ultra-cheap, fast-cycling emergency responder and lane harasser.
  - *Scribblers (2 Ink):* Reduced cost from 3 to 2 ink, making the 4-sketch swarm an accessible, cost-effective counter against single-target attackers.
  - *Ink Wall (3 Ink):* Maintained at 3 ink as a dependable tactical barricade.
  - *Ranger (4 Ink):* Increased cost from 3 to 4 ink, reflecting its massive 6.5 range and lethal 5 damage sniper shots.
  - *Splat Blob (4 Ink):* Set at 4 ink for heavy AoE cluster-clearing artillery.
  - *Bulker (5 Ink):* Increased cost from 4 to 5 ink and upgraded to 16 HP / 4 DMG, establishing it as the premier high-investment raid-boss frontline juggernaut.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 19: Streamlined Danger FX (Removed Big Screen Edge Rectangle)
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Removed the intrusive screen-edge rectangle overlay while preserving all unit/base critical danger effects.
- **Key Decisions & Features:**
  - *Clean Viewport:* Removed the screen-wide border rectangle and edge gradient box so the paper battlefield remains completely unobstructed and clean.
  - *Preserved Core Danger Animations:* Retained all focused base animations, including circular expanding shockwave rings, radial hazard glow, heartbeat tremor pulse, sketch fissure cracks, pulsing perimeter ring, and warning pill badge.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 20: Unified Unit Drawing Architecture & Deck Card Unit Portraits
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Created a single source of truth for all unit artwork (`src/systems/unitDrawers.js`), eliminating duplicate code and rendering authentic in-game unit portraits directly on the deck cards.
- **Key Decisions & Features:**
  - *Single Source of Truth (`unitDrawers.js`):* Extracted dedicated, modular drawer functions for every NPC (`drawBulker`, `drawSpeeder`, `drawRanger`, `drawSplat`, `drawWall`, `drawScribbler`, `drawScribblersSwarm`).
  - *Zero Duplication:* Both the in-game arena renderer (`renderer.js`) and the hand card portraits (`main.js`) call the exact same rendering logic.
  - *Card Canvas Portraits:* Replaced generic placeholder SVGs with crisp high-DPI mini canvas portraits generated by `createUnitCardIconCanvas(type, 28, 'blue')`.
  - *Future Modification Friendly:* Any changes made to a unit's visual silhouette, weapons, doodles, or accessories inside `unitDrawers.js` will immediately and automatically update both on-field units and deck card icons simultaneously.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 21: Wall NPC Mechanic Update (Relentless Mobile Unit)
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Removed wall's locking/stopping behavior so it operates identically to other mobile combat units.
- **Key Decisions & Features:**
  - *Identical Unit Behavior:* Removed `updateWallUnit` and special-casing in `combat.js`. The wall now processes combat, path movement, and core marching through standard `updateCombatUnit`.
  - *Continuous Movement:* The wall no longer freezes or stops when its drawn path is completed; it continues onward marching directly toward the enemy core.
  - *Full Combat Engagement:* Granted 2 damage, 1.2 attack range, and 3.0 detect range with 0.7 speed, turning it into a formidable armored battering ram that engages enemies, obstacles, ink bottles, and core structures.
  - *UI & Hand Alignment:* Updated card stats to display its damage (2 DMG) and Melee classification.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 22: Wall NPC Stat Tuning (20 HP, 1 Damage)
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Rebalanced the Ink Wall into a high-durability, low-damage siege ram.
- **Key Decisions & Features:**
  - *HP Buffed to 20:* Highest individual health pool in the game, allowing it to soak sustained fire from snipers, bots, and cores.
  - *Damage Set to 1:* Tuned down to 1 damage to emphasize its tanky soaking and ramming identity.
  - *Automatic UI Sync:* Hand cards, deck stats, and overhead combat health bars automatically reflect the new 20 HP / 1 DMG values.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 23: Symmetrical GFX for Ink Wall and Splat Blob
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Redesigned Ink Wall and Splat Blob graphics from flattened proportions into clean, fully symmetrical geometries across both combat arena and deck cards.
- **Key Decisions & Features:**
  - *Symmetrical Ink Wall:* Replaced the vertically flattened hexagon with an equal-radius regular hexagon (`hexRadius = size * 1.12`). Added clean, symmetrical horizontal and vertical mortar joints with a central reinforced boss rivet.
  - *Symmetrical Splat Blob:* Replaced the squished horizontal ellipse with a circular ink core (`radius = size * 0.72`), 4-way radially symmetrical splash droplet satellites at 45° intervals, and a centered concentric ink ring.
  - *Unified Sizing & Card Icons:* Calibrated high-DPI mini card portraits and overhead health bars to sit symmetrically above the new balanced shapes.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 24: Dynamic Unit Facing for Movement (Point 1) and Attacking (Point 2)
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Added directional rotation so units visually face their direction of travel when moving (Point 1) and turn to face their target when attacking (Point 2).
- **Key Decisions & Features:**
  - *Point 1 (Movement Facing):* Units calculate their travel vector (whether following waypoints along the drawn path, marching toward the enemy core, or chasing a nearby foe) and dynamically face forward along that vector.
  - *Point 2 (Target Facing):* Units engaging in combat (Rangers sniping, Splats lobbing artillery, Bulkers/Speeders/Walls/Scribblers ramming or smacking targets) turn and aim directly toward their target (enemy unit, obstacle blot, ink bottle, or enemy core).
  - *Stable Overhead HUD:* The unit artwork rotates cleanly around its center, while the overhead health bar remains strictly horizontal and stable above the unit's head for clear visibility.
  - *Decisions Locked (User Approved):* Both Point 1 (`FACE_MOVEMENT_DIRECTION`) and Point 2 (`FACE_TARGET_DIRECTION`) are formally locked as core battle mechanics in `src/constants.js`.
- **Final Status:** Decision locked and verified 100% functional, responsive, and standalone ready.

---

### Session 25: Bulker Visual Redesign (Studded War Bat / Spiked Club)
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Redesigned Bulker's visual artwork from the placeholder square torso into a heavy studded war bat / spiked club based on the user's hand-drawn reference.
- **Key Decisions & Features:**
  - *Reference Matched:* Implemented pommel knob, straight handle grip, tapered club barrel with rounded dome head, and 4 rounded side studs/spikes (2 left, 2 right) in ink outline and translucent fill style.
  - *Card Icon Tilt:* Angled diagonally across the square card frame at -37.5° to match the user's doodle.
  - *Combat Field Orientation:* Points forward along the movement/attack angle, turning the unit into an active charging club weapon during charges and melee strikes.
  - *Instant Rollback Preserved:* Kept `drawBulkerClassic` intact in `src/systems/unitDrawers.js` for immediate one-command rollback if requested.
- **Final Status:** Implemented for user playtesting, verified 100% functional and responsive.

---

### Session 26: Bulker Square with Internal Club & Juicy Attack Hit Animation
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** 
  1. Updated Bulker's design to a solid square body with the studded war club angled diagonally inside, capturing the user's sketch 1:1 while retaining heavy tank volume.
  2. Implemented a simplistic, juicy combat attack animation featuring kinetic forward lunging, impact vibration/shake, squash & stretch, dynamic internal club swing, and target hit reaction.
- **Key Decisions & Features:**
  - *Square Body with Internal Club:* Sturdy square torso with clean ink border; inside rests the white-filled diagonal studded club with pommel, grip, dome head, and 4 side studs.
  - *Juicy Attack Lunge:* When attacking, the unit surges forward along its facing axis toward the target with a smooth sine-wave lunge and snap-back.
  - *Kinetic Strike Shake:* At the moment of contact, a sharp micro-shake shudders through the attacker.
  - *Dynamic Club Swing:* The club inside winds up and swings through with an added dynamic arc during attacks.
  - *Squash & Stretch:* Subtle non-intrusive scaling along the attack vector gives each hit punchy weight.
  - *Target Hit Reaction:* Damaged units experience a brief kinetic impact vibration (`hitShakeTimer`).
  - *Overhead HUD Stability:* The health bar stays strictly level and stable above the unit without tilting or shaking out of place.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 27: Bulker Graphic Scaled Up 1.5x
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Scaled Bulker's graphic up by 1.5x to give the 5-cost juggernaut titan massive visual presence on the battlefield and make the internal studded club doodle prominent and readable.
- **Key Decisions & Features:**
  - *1.5x Chassis & Weapon Scale:* Increased Bulker's base graphic size factor from 1.25 to 1.88, with ink line width scaled to 2.2px.
  - *Spanned Club Diagonal:* Sized the internal studded war club to span corner-to-corner across the square with bolder 2.0px stroke outlines.
  - *Card Icon Calibration:* Tuned `createUnitCardIconCanvas` to render the enlarged graphic cleanly centered inside the 26px hand card portrait.
  - *Overhead HUD Spacing:* Expanded Bulker's health bar width to 26px and raised its vertical offset cleanly above the enlarged square frame.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 28: Enemy AI Rule Enforcement & Shuffled Spawn Queue
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Audited the Enemy AI spawning rules and replaced the old weighted-random roll with a strict shuffled deck-queue mechanism.
- **Key Decisions & Features:**
  - *Allowed Unit Pool:* Confirmed the 6 allowed units (`speeder`, `bulker`, `ranger`, `scribblers`, `splat`, `wall`), identical to the player's playable deck cards in `CARDS_DATA`.
  - *Shuffled Deck Queue:* The bot initializes an array of all 6 units and shuffles them using the Fisher-Yates algorithm.
  - *Sequential Dequeuing:* The bot dequeues one unit at a time, waits for sufficient ink to pay its cost, executes the deployment, and then dequeues the next.
  - *Anti-Repeat Shuffle Boundary:* When the queue empties, it re-populates with all 6 units and reshuffles. If the first unit of the new cycle matches the last deployed unit from the previous cycle, it swaps it with another item in the queue. This guarantees the AI never spawns the same unit back-to-back.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 29: Card Click/Drawing Rule Enforcement
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Forbade single-click immediate card spawns. Enforced that players must either draw a line with at least one waypoint dot placed OR double-click the card.
- **Key Decisions & Features:**
  - *Single-Click Selection Only:* Clicking a card in the hand now strictly selects it as the active card (`selectedCardId`), rendering its selection highlight without deploying any unit.
  - *Double-Click Quick Deploy:* Double-clicking a card (two rapid clicks within 350ms or desktop `dblclick`) triggers the quick deployment at the baseline green point corresponding to the card button, with ink cost checks and cooldown prevention.
  - *Drawing Line Constraint (>= 1 dot placed):* In `DoodleInputManager.endAt()`, requiring `gridNodes.length >= 2` ensures that a start anchor alone does not count as a completed path. Drawing must place at least one waypoint dot into the battlefield, preventing accidental single-click canvas taps from spawning units.
  - *Updated In-Game Hint:* Adjusted the battlefield tutorial prompt to: *"✏️ Draw path (at least 1 dot) or double-click card to deploy"*.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 30: Removed Double-Click & Decreased Waypoint Distance
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Removed the double-click deploy feature so cards only select as active, decreased minimum dot spacing distance, and updated tutorial prompt.
- **Key Decisions & Features:**
  - *Removed Double-Click:* Cards in hand strictly select as active upon click/tap. No button double-click or double-tap will trigger spawning. Units can now only be deployed by drawing ink paths into the battlefield.
  - *Decreased Dot Distance by 1:* Reduced `MIN_NODE_DISTANCE` from `3.0` to `2.0` in `DoodleInputManager`, making path drawing more responsive and allowing closer waypoint dots.
  - *Updated In-Game Prompt Text:* Changed prompt to: *"✏️ Select card & drag a path into the field to deploy"*.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 31: Faster Ink Respawn & Increased Board Ink Presence
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Shortened ink bottle respawn time and increased the frequency and quantity of ink bottles appearing across the board.
- **Key Decisions & Features:**
  - *Faster Respawn Interval:* Reduced `nextBottleSpawnTimer` from `20.0s` down to `6.0s` (over 3x faster respawn rate), ensuring ink pickups drop frequently throughout the match.
  - *Increased Board Capacity:* Raised maximum concurrent active ink bottles on the battlefield from `4` to `5` to maintain an active, rewarding arena.
  - *3 Opening Fair Bottles:* Match now starts with 3 fair bottles (one in Red territory at `(5, 10)`, one in Blue territory at `(12, 21)`, and one at the neutral Midline at `(3, 16)`), providing an immediate contest point from second 1.
  - *Expanded Symmetrical Spots:* Expanded `PREDEFINED_BOTTLE_SPOTS` from 6 to 8 symmetrical positions across Red flank/forward, Midline, and Blue flank/forward.
  - *Bottle Array Garbage Collection:* Added cleanup of completed bottle destruction animations in `DeckAndEconomyManager.update` to keep memory footprint lean.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 32: Outer Spread Ink Positions & Single Center Midline Spot
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Spread ink bottle spawn locations across the outer flanks of the battlefield while keeping strictly one single position in the middle.
- **Key Decisions & Features:**
  - *Strictly One Center Position:* Configured `{ x: 9, y: 16 }` as the single, exclusive ink position in the middle of the board (dead-center of the arena).
  - *Outer Flank Spread:* Spread all other ink bottle positions onto the outer columns (`x = 2` on the left wing, `x = 15` on the right wing), spaced evenly with 5-grid vertical steps along the arena:
    - Upper Red Outer: `{ x: 2, y: 6 }` and `{ x: 15, y: 6 }`
    - Mid Red Outer: `{ x: 2, y: 11 }` and `{ x: 15, y: 11 }`
    - Mid Blue Outer: `{ x: 2, y: 21 }` and `{ x: 15, y: 21 }`
    - Lower Blue Outer: `{ x: 2, y: 26 }` and `{ x: 15, y: 26 }`
  - *Symmetrical Match Opening:* Initial 3 bottles updated to start at Red mid-left outer flank `(2, 11)`, Blue mid-right outer flank `(15, 21)`, and the single center midline spot `(9, 16)`.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 33: Speeder Graphic Redesign & Stat Rebalance
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Redesigned the Speeder unit with a smaller graphic footprint, a new sleek diamond-dart shape, and adjusted stats to 2 HP, 2 ATK, and 5 Speed.
- **Key Decisions & Features:**
  - *New Sleek Shape (Diamond Dart / Rhombus):* Replaced the triangular delta blade with an aerodynamic 4-point Diamond Dart chassis featuring a sharp prow, swept side wing tips, rear tail, longitudinal razor speed spine, and lateral aerodynamic wing creases.
  - *Smaller GFX Footprint:* Scaled the graphic down with a `0.70x` factor (`sSize = size * 0.70`), ensuring the Speeder is distinctly agile, lightweight, and compact on the battlefield compared to standard units.
  - *Calibrated Card Portrait & Overhead Bar:* Calibrated `createUnitCardIconCanvas` to `displaySize * 0.50` for a sharp, balanced card portrait and scaled the overhead health bar to fit comfortably above the compact graphic.
  - *Stat Rebalance:*
    - **HP:** 2
    - **Damage (ATK):** 2 (down from 3)
    - **Speed:** 5.0 (up from 3.0, making it an ultra-fast paper dart)
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 34: Distinct Base Damage Audio & Impact Feedback
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Synthesized distinct, evocative sound effects for damage taken by our base (Player Blue HQ) versus the enemy base (AI Red Fortress), coupled with synchronized visual micro-shake and flash feedback.
- **Key Decisions & Features:**
  - *Our Base Under Attack (`playOurBaseDamage`):* Procedurally synthesized an urgent defensive alarm thud combining a heavy sub-bass impact drop (125 Hz $\rightarrow$ 32 Hz), a sharp minor-second alert klaxon (196 Hz + 208 Hz through a resonant low-pass filter), and crumbling paper ink noise.
  - *Enemy Base Damaged (`playEnemyBaseDamage`):* Procedurally synthesized a crisp, high-energy offensive crack (560 Hz $\rightarrow$ 140 Hz) followed by a triumphant high-register chime (784 Hz G5 $\rightarrow$ 1046.5 Hz C6) and an ink splash sizzle.
  - *Polyphonic Throttling:* Implemented a 65ms cooldown safeguard in the audio synthesizer to prevent harsh clipping or sound distortion during rapid swarm attacks.
  - *Synchronized Visual Feedback:* Connected `hitShakeTimer` to `drawSingleCore` to generate reactive micro-shakes and momentary crimson border flashes on whichever base sustains damage.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 35: Mobile Base Damage Haptics with Inverse HP Scaling
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Integrated mobile phone vibration feedback using the Web Vibration API whenever the player's base takes damage, with vibration intensity scaling inversely with remaining health.
- **Key Decisions & Features:**
  - *Inverse Health Scaling:* Lower base HP generates progressively bigger, longer, and more alarming haptic patterns:
    - *High / Healthy HP ($> 12$ HP):* Single punchy haptic tap scaling smoothly from 40ms to 95ms as health decreases.
    - *Low HP ($6 - 12$ HP):* Heavy double shudder pattern ($\approx 85\text{ms} - 95\text{ms}$ pulse, 45ms pause, $120\text{ms} - 135\text{ms}$ pulse).
    - *Critical Danger ($\le 5$ HP):* High-intensity emergency triple tremor ($115\text{ms} + 145\text{ms} + 195\text{ms}$ with 35ms pauses).
  - *Debounced Multi-Hit Guard:* Enforced an 80ms debounce window to prevent rapid multi-attacks from stuttering or canceling vibration patterns mid-stroke.
  - *Permission & Platform Gracefulness:* Declared `vibrate` frame permission in `metadata.json` and wrapped browser execution in feature-detection checks for seamless cross-platform desktop/mobile support.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 36: Randomized Ink Bottle Tiers & Last-Hit Rule
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Transformed ink bottles into multi-tiered dynamic objectives with randomized durability and rewards (1 HP $\rightarrow$ +1 Ink, 2 HP $\rightarrow$ +2 Ink, 3 HP $\rightarrow$ +3 Ink) where the last hit decides the winner.
- **Key Decisions & Features:**
  - *Pure Random Spawning:* Both opening match bottles and subsequent periodic spawns now roll randomly across 3 distinct tiers:
    - *Tier 1:* 1 HP, awards +1 Ink on destruction.
    - *Tier 2:* 2 HP, awards +2 Ink on destruction.
    - *Tier 3:* 3 HP, awards +3 Ink on destruction (distinguished by a larger flask silhouette and golden neck trim).
  - *Last Hit Takes the Bounty:* Whichever unit lands the killing blow that reduces bottle HP to 0 secures the full ink reward for their team (`bot.lastHitTeam = attackerTeam`).
  - *Dynamic Health HUD:* Added hovering HP counters above every active bottle (`1 HP` or `current/max HP`), turning from blue to urgent orange when damaged to highlight steal opportunities. Multi-HP bottles display an overhead mini health bar.
  - *Winner Notification FX:* Shattering bottles spawn floating animated text showing who won the bounty (`+X INK!` in radiant cyan for player last-hits, or `ENEMY +X INK!` in radiant red for bot last-hits).
  - *Multi-Tier Fanfare Audio:* Scaled `soundFX.playBottle(tier)` with melodic ascending fanfares, culminating in a high C6 chime for Tier 3 collections.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 37: Mobile Hand Card Layout Refactoring (Full-Width Name & Non-Wrapping Cost Badge)
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Redesigned the card layout in the player's bottom hand HUD to guarantee the unit name is always 100% visible without truncation, and the ink cost badge never breaks across two lines on mobile screens.
- **Key Decisions & Features:**
  - *Dedicated Vertical Stacking:* Eliminated the cramped horizontal `.card-header-row` that forced the cost badge and name to compete for width within narrow cards ($\approx 72\text{px} - 82\text{px}$ on phones).
  - *Full-Width Unit Name Banner:* Positioned `.card-name` at the top of the card spanning the entire card width with responsive typography (`clamp(9px, 2.6vw, 10.5px)`), bold font weight, and centered alignment, preventing ellipsis cuts (`Scribblers`, `Splat Blob`, `Ink Wall` always display in full).
  - *Non-Wrapping Cost Badge:* Refactored `.card-cost-badge` with `display: inline-flex; align-items: center; white-space: nowrap; flex-shrink: 0;`, housing `<span class="cost-drop">💧</span>` and `<span class="cost-val">${cost}</span>` together so the drop icon and number are physically prevented from wrapping into separate lines.
  - *Visual Balance & Breathing Room:* Increased `#handCardsContainer` height to 108px and tuned the unit portrait canvas (26px) so all five card components (Name, Cost Pill, Canvas Portrait, 2x2 Stats Grid, Role Chip) are aligned along the vertical center axis with generous spacing and zero clipping.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 38: Card Stats Simplification & Contextual Attack Icons
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Streamlined the hand cards by completely removing clutter (speed, range, role/aoe/swarm tags) and replacing generic crossed swords with archetype-specific attack icons: sword (`🗡️`) for melee, bow (`🏹`) for ranged, and boom (`💥`) for splash.
- **Key Decisions & Features:**
  - *Contextual Attack Iconography:* Replaced the generic `⚔️` with distinctive attack icons tailored to unit combat types:
    - `🗡️` Single sword for Melee units (*Bulker*, *Speeder*, *Ink Wall*, *Scribblers*).
    - `🏹` Bow & arrow for Ranged units (*Ranger*).
    - `💥` Explosion/boom for Splash & AoE units (*Splat Blob*).
  - *Total Elimination of Range & Speed:* Removed both speed (`⚡`) and range chips from the cards entirely as requested.
  - *Removed Melee / AoE / Swarm Role Footer:* Completely discarded the `.card-role` chip and swarm badges from the card face, leaving only essential combat stats.
  - *Clean 2-Chip Horizontal Layout:* Card stats now sit in a balanced single row containing only HP (`❤️`) and the unit's attack (`🗡️` / `🏹` / `💥`), yielding maximum legibility and visual clarity.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 39: Animated Hand Card Cycle (Slide-Left & Right Slide-In Deal)
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Implemented a smooth physical FLIP card cycling animation whenever a card is deployed onto the notebook arena.
- **Key Decisions & Features:**
  - *Confirmed Game Cycle Mechanics:* When a card is played from anywhere in the 4-card hand, it leaves the hand, all cards situated to its right immediately slide left to fill the vacancy, and the newly drawn card deals into the far right slot.
  - *Deployed Card Ghost Exit:* Cloned the played card into a temporary `.card-deploying-ghost` that floats upward towards the arena canvas with `translateY(-28px) scale(0.85)` and fades out over 0.28s.
  - *Smooth FLIP Slide-to-Left:* Measured previous card coordinates with `getBoundingClientRect()`. For all surviving cards to the right of the deployed card, inverted their positions (`translateX(deltaX)`) and transitioned them smoothly to `translateX(0)` with a fluid cubic-bezier curve (`0.22, 1, 0.36, 1`) over 0.32s.
  - *Right Side Slide-In Entry:* Handled the incoming newly drawn card by initializing it offset to the right (`translateX(50px) scale(0.92)` with `opacity: 0`) and transitioning it into position alongside the sliding cards over 0.34s.
  - *HUD & Ghost Isolation:* Guarded `updateHUD` and ink error shakers to target `.hand-card:not(.card-deploying-ghost)`, ensuring full framerate updates never interfere with the active slide transitions.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 40: Top-Right Info Button, Quick Rules & Full Unit Stats Screen
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Added a dedicated `ℹ️` Info button to the top-right header and built a modal info screen presenting quick rules and complete unit stats.
- **Key Decisions & Features:**
  - *Top-Right Info Button:* Positioned an accessible `ℹ️` button (`#btnInfo`) in the top right of `#game-header` with symmetric balance, crisp hover effects, and clean micro-interactions.
  - *Short & Punchy Game Rules:* Summarized the core gameplay rules into 3 brief bullet points: Objective (destroy red base before 3:00 timeout), Draw to Deploy (tap card & drag ink path), and Ink Economy (automatic regeneration, 2x/3x speedup, and ink bottle pickups).
  - *Comprehensive Unit Roster & Stats:* Dynamically rendered all 6 units from `CARDS_DATA` with:
    - High-DPI canvas avatar portraits (`createUnitCardIconCanvas`).
    - Name, Ink Cost badge, and Archetype Role chip.
    - Full combat stats: HP (`❤️`), Attack damage with contextual icons (`🗡️` / `🏹` / `💥`), Attack Range, and Movement Speed category.
    - Short tactical description per unit.
  - *Match Pause on Open:* Opening the info screen politely pauses the game loop and timer simulation, resuming smoothly without skipping frames when closed via the header ✕ button, backdrop click, Escape key, or bottom resume button.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 41: Base HP Points Display & Progressive Ink Acceleration (2x at 1m, 3x at 2m)
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Replaced the cluttered `30/30 HP` fraction on bases with just the remaining HP points value, and updated the match ink acceleration pacing to 2x after the 1st minute and 3x after the 2nd minute.
- **Key Decisions & Features:**
  - *Base HP Points Display:* Simplified the text above the base health bar from `${hp}/${maxHp} HP` (e.g. `30/30 HP`) to solely display the hit points `${hp}` (e.g. `30`), fitting cleanly inside the base square without horizontal text overflow.
  - *Updated Ink Speedup Schedule:*
    - **Minute 1 (03:00 - 02:00):** Base 1x rate (+0.5 ink/sec).
    - **Minute 2 (02:00 - 01:00, after 1st minute):** Accelerated to **2x rate** (+1.0 ink/sec).
    - **Minute 3 (01:00 - 00:00, after 2nd minute):** Accelerated to **3x rate** (+1.5 ink/sec).
  - *Coordinated Bot & Testing Economy:* Bot AI economy automatically scales with the new multiplier curve. Also updated `btnSpeedUp` and info modal documentation to stay in sync with the new progression.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 42: Player Base Position Adjustment (1 Unit Higher)
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Elevated the player's base (Blue Core) and starting deploy line by 1 grid cell up the notebook canvas.
- **Key Decisions & Features:**
  - *Base Coordinates:* Shifted `blueCore.y` from `30` to `29` in `CombatManager` (constructor and reset methods).
  - *Player Drawing Start Anchor:* Shifted `PLAYER_START_Y` from `31` to `30` in `src/constants.js` and updated the blue unit fallback start position to match the new base coordinates.
  - *Opponent Bot AI Pathing:* Adjusted bot dynamic path targets (`targetBaseY = 28`) and lower lane waypoints to cleanly lead into the repositioned player core.
  - *Tip Card Offset:* Adjusted `#drawHint` positioning (`bottom: 68px`) to remain cleanly situated above the elevated player base.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 43: Custom Vector Favicon Creation
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Designed and integrated a bespoke, high-contrast vector SVG favicon tailored to the Doodle Clash theme.
- **Key Decisions & Features:**
  - *Graphic Design:* Created `/public/favicon.svg` featuring a rounded graph-paper notebook page tile with light blue grid lines, a stylized fountain pen nib, a vibrant blue ink droplet with a specular gleam, and dynamic blue/red scribble arcs.
  - *Browser & Device Support:* Linked via `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` and `<link rel="apple-touch-icon" href="/favicon.svg" />` in `index.html` for crisp rendering across all screen resolutions, tabs, and mobile bookmarks.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 44: Mobile Direct Drag-from-Card Fix
- **Tool:** Gemini AI Studio (Coding Agent)
- **What We Built:** Diagnosed and fixed the mobile bug where dragging directly from a card into the arena failed to draw a path without prior selection.
- **Root Cause Analysis:**
  1. *DOM Destruction Mid-Touch:* Previously, `startDrawFromCard` called `this.renderHandUI()`, which completely cleared and rebuilt `this.handCardsContainer.innerHTML = ''`. In mobile browsers (iOS Safari and Chrome Android), destroying the touch target element while the user's finger is on it immediately triggers a `touchcancel` event, terminating the touch gesture before `touchmove` can stream.
  2. *Missing Default Prevention on Card Touch:* `touchstart` was not calling `e.preventDefault()`, allowing mobile browsers to initiate vertical scroll or gesture handling when dragging upward out of the card area.
  3. *Unprotected Controls Container:* `#controls-container` and `#handCardsContainer` lacked `touch-action: none;` and `user-select: none;`.
- **Key Decisions & Features:**
  - *Non-Destructive Card Selection:* Created `selectCard(cardId)` which toggles the `.selected` CSS class on existing card elements without re-rendering or modifying the DOM tree, ensuring the touch target remains valid and stable throughout the drag.
  - *Mobile Touchstart Event Handling:* Dedicated `touchstart` listener with `e.preventDefault()`, checking affordability and smoothly initializing drawing from the card's horizontal touch location at the bottom grid baseline.
  - *Mobile Arena Flick / Release Support:* Added endpoint capture in `endAt()` so quick upward swipes into the arena that cross the baseline immediately place waypoints even on rapid gestures.
  - *CSS Gesture Guards:* Applied `touch-action: none`, `user-select: none`, `-webkit-user-select: none` to `#controls-container` and `#handCardsContainer`, and `pointer-events: none` to all card children.
- **Final Status:** Verified 100% functional, responsive, and standalone ready.

---

### Session 45: Mobile Browser Chrome Overlap Fix
- **Tool:** Claude Code
- **What We Built:** Fixed the bottom card hand and ink bar getting covered by the mobile browser's own UI (address bar / gesture nav bar / home indicator) when its chrome was visible on-screen.
- **Root Cause Analysis:** `#app-root` was sized with `100vh`, which mobile browsers report as the *large* viewport height (assuming retracted chrome). When the browser chrome was actually showing, the game's flex-column layout (header → canvas → footer with hand cards + ink bar) was taller than the real visible area, clipping the footer behind the chrome.
- **Key Decisions & Features:**
  - *Dynamic Viewport Height:* Added `height: 100dvh` on `#app-root` (after the existing `100vh` fallback) so the layout live-tracks the actual visible viewport as browser chrome shows/hides.
  - *Safe-Area Support:* Added `viewport-fit=cover` to the `<meta name="viewport">` tag and `env(safe-area-inset-bottom)` padding to `#controls-container`, so the footer clears the home-indicator/gesture-bar area on notched phones.
- **Final Status:** CSS-only fix, no JS changes required; recommended follow-up is a spot-check on a real iOS Safari / Android Chrome device since `dvh`/safe-area behavior varies by OS version.

---

### Session 46: Match Speed-Up Feedback (Sound + Visual FX)
- **Tool:** Claude Code
- **What We Built:** Added a distinct sound cue and on-screen visual effect that fire at the exact moment the match speeds up (the 1-minute and 2-minute ink-rate multiplier transitions).
- **Key Decisions & Features:**
  - *`soundFX.playSpeedUp()`:* New procedural Web Audio cue in `audio.js` — a rising filtered sawtooth whoosh landing on a bright triangle-wave confirmation ding, following the existing oscillator-based sound design pattern.
  - *Transition Detection:* Game loop now tracks `this.lastRateMultiplier` and compares it against `deckManager.getRateMultiplier()` each frame, firing the effect exactly once per speed-up (reset on match restart).
  - *Visual Effect:* One-shot scale/glow bump on the `#multiplierBadge`, a radial gold flash across the canvas (`#speedUpFlash`), and a floating "2X SPEED!" / "3X SPEED!" popup (`#speedUpText`) that pops and fades over the battlefield.
  - *Bug Fix:* `updateHUD()` was overwriting the multiplier badge's entire `className` every frame, which would have wiped the one-shot bump class; switched to `classList.add/remove` so both classes coexist.
- **Final Status:** Verified via code review and syntax checks; recommend a manual playtest (or the hidden debug `⏩` speed-skip button) to confirm the timing feels right.

---

### Session 47: Ink & Base HP Readability Pass
- **Tool:** Claude Code
- **What We Built:** Improved the visibility and formatting of ink-related HUD text on the canvas, and simplified the base's critical-state warning.
- **Key Decisions & Features:**
  - *Scaled, Higher-Contrast Ink Text:* Both the on-bottle `+N INK` label and the rising `+N INK!` capture popup now scale their font size with the reward tier (bigger pop for +3, smaller for +1) and gained outline/stroke treatment (dark navy outline on the bottle label, white outline on the popup) so they stay legible against the bottle's liquid color and the notebook-paper background.
  - *Ink Bottle HP Format:* Bottle HP readout changed from an inconsistent `1 HP` / `3/3 HP` mix to a uniform `current/max` format with no unit suffix (e.g. `1/1`, `3/3`).
  - *Removed BASE DANGER / TARGET CRITICAL Badge:* Removed the pulsing pill-shaped warning badge and its text overlay on bases at critical HP. All other critical-state effects (distress cracks, camera jitter, red glow, flashing HP bar and numeric readout) are left intact.
- **Final Status:** Verified via code review and syntax checks (`node --check`).

---

### Session 48: Ink Collection Trail & Bottle Scale
- **Tool:** Claude Code
- **What We Built:** A homing ink-droplet trail that flies from a captured bottle to the winning team's base, plus a bigger, easier-to-read bottle graphic.
- **Key Decisions & Features:**
  - *Bottle Graphic Size:* `baseSize` in `drawInkBottles` scaled 1.5x.
  - *Homing Trail Particles:* New `spawnInkCollectTrail()` in `combat.js` spawns 8-14 droplets (scaled by reward tier) from the bottle's position that steer toward the capturing team's base and vanish on arrival, colored to match the capturing team, at 1.5x speed with a short fading motion-blur streak (`drawParticles` in `renderer.js`). The bottle itself stays put — only its existing pop/fade animation plays; a full "the bottle physically flies to the base" version was tried and reverted per feedback (kept as trail-only).
  - *`updateParticles` Seek Mode:* Particles can now carry a `seek: {x, y}` target and home toward it independent of the existing fixed-velocity burst particles, with no effect on non-seeking particles (obstacle bursts, smudge effects).
- **Final Status:** Verified via code review and syntax checks.

---

### Session 49: Unit Roster Balance Pass
- **Tool:** Claude Code
- **What We Built:** A round of stat tuning aimed at diversifying the roster and removing cost/DPS outliers, based on a full stats-table review.
- **Key Decisions & Features:**
  - *Ink Wall HP:* `20 → 30`.
  - *Bulker Speed:* `0.9 → 1.035` (+15%), and later *Bulker Damage:* `4 → 5` to strengthen its identity as the top-cost power pick.
  - *Splat Blob / Ink Wall Cost Swap:* Splat `4 → 3`, Wall `3 → 4`.
  - *Ranger:* HP `2 → 3` (was identically fragile to the cheapest unit, Speeder, despite costing 4x more) and range `6.5 → 5.6` (was an outlier reach vs. the next-highest, Splat's 3.6).
  - *Scribblers:* `attackSpeed` interval `0.5 → 0.6`, trimming the swarm's DPS-per-cost from a clear outlier (4.0) down to match Speeder's (3.33).
- **Final Status:** Verified via `node --check`; recommend playtesting Scribblers/Ranger specifically for degenerate strategies.

---

### Session 50: Scribbler Swarm Formation Fix
- **Tool:** Claude Code
- **What We Built:** Fixed the 4 Scribbler sub-units visually collapsing onto the exact same position while marching/chasing/attacking, instead of staying spread out.
- **Root Cause Analysis:** Each sub spawns with a distinct `{dx, dy}` offset, but that offset was discarded after spawn — every subsequent frame all 4 subs steered toward the *exact same* waypoint/target coordinate, converging as they traveled. A first attempted fix (offsetting only the steering angle) caused subs to freeze/jitter in place, because the very first waypoint equals the spawn coordinate, so the offset-adjusted aim point equalled the unit's own spawn position (zero-length steering vector) while the raw-distance arrival check never advanced.
- **Key Decisions & Features:**
  - *Persistent `formationOffset`:* Stored on each sub-unit at spawn (`combat.js`).
  - *`applyFormationOffset()` helper:* Applied consistently to both the steering angle **and** the arrival-distance check in the path-follow branch (so a sub advances once it reaches its own offset point, not the raw node), plus the chase and march-to-core branches. Attack-range checks and `performAttack` targets keep using real, un-offset coordinates, so damage/targeting is unaffected — only movement heading and waypoint-arrival timing are adjusted, and only for `isScribblerSub` units.
- **Final Status:** Confirmed working after the arrival-check fix; low-risk, single-file (`combat.js`) change covering both player- and bot-deployed swarms.

---

### Session 51: Symmetrical Bot Ink Economy & Fair Opening
- **Tool:** Claude Code
- **What We Built:** Prevented the AI opponent from getting a head start — it now withholds its first deployment until the player deploys theirs, while keeping ink regeneration symmetrical between both sides throughout.
- **Key Decisions & Features:**
  - *`BotOpponentAI.update()`* gained a `canDeploy` flag (`main.js` passes `this.playerCardsDeployed > 0`); ink regeneration always runs, but the opening-delay countdown and deploy decision are skipped entirely until the player has deployed at least once.
  - An earlier version gated the bot's entire `update()` call (freezing its ink too) but was corrected after noticing the enemy ink bar wasn't rising while the player's was — ink regen needed to stay symmetrical from match start.
- **Final Status:** Verified via `node --check`.

---

### Session 52: Match-End Urgency Alerts
- **Tool:** Claude Code
- **What We Built:** A 30-second remaining warning and a final 5-4-3-2-1 countdown, reusing the speed-up alert's sound+flash+popup pattern with its own red urgency theme.
- **Key Decisions & Features:**
  - *`triggerMatchAlertEffect(label)`:* New shared helper driving a red radial canvas flash (`#matchAlertFlash`) and a big centered popup (`#matchAlertText`), independent of the existing gold speed-up overlay elements so the two can't interfere.
  - *30s Warning:* Fires once when `matchTimeRemaining` crosses 30s — `soundFX.playTimeWarning()` (urgent two-pulse square-wave alert) plus a "30 SECONDS LEFT!" popup.
  - *Countdown Ticks:* Each integer-second crossing in the final 5 seconds fires `soundFX.playCountdownTick(n)` (pitch rises as it counts down, louder/longer on the final tick) plus a big digit popup.
  - *Speed-Up Popup Polish:* The "2X SPEED!" / "3X SPEED!" text was enlarged (26px → 40px) and reworded to "2X INK" / "3X INK" to match what's actually changing.
- **Final Status:** Verified via `node --check`; timing not yet visually confirmed in a live browser (no connected browser session) — recommend a playtest to confirm no visual clash near match end.

---

### Session 53: Adaptive Bot Difficulty & Ink Rate Constant
- **Tool:** Claude Code
- **What We Built:** Made the AI's reaction speed implicitly track player skill via a simple, stateless proxy — how much ink the player is currently banking — plus extracted the base ink regen rate to a shared constant.
- **Key Decisions & Features:**
  - *Ink-Bank-Based Reaction Delay:* `BotOpponentAI.update()` now takes `playerInk`; when starting its reaction-jitter timer, the bot adds a penalty proportional to `min(1, playerInk / 10)` on top of a random baseline — a player hoarding unspent ink (playing less efficiently) gets a laxer bot, one spending tightly gets the bot's sharpest reaction. No persistent skill-tracking state.
  - *Tuning Pass:* The baseline/penalty split was iterated down twice per feedback ("too lazy") — from an initial 0.5-2.0s range, to 0.3-1.3s, to the current 0.2-1.0s range (`0.2 + random(0-0.2) + up to 0.6 penalty`).
  - *`BASE_INK_REGEN_RATE` Constant:* Ink regen rate changed from `0.5/1.0/1.5` (1x/2x/3x phases) to `0.4/0.8/1.2`, and the previously-duplicated `0.4` literal (in `deck.js`, `bot.js`, and two HUD rate-display strings in `main.js`) was extracted into a single `BASE_INK_REGEN_RATE` constant in `constants.js`.
- **Final Status:** Verified via `node --check`.

---

### Session 54: Bot Reaction Speed Increase & README Accuracy Pass
- **Tool:** Claude Code
- **What We Built:** A further bot reaction-speed tuning pass, plus a full rewrite of `README.md` to match the game's actual current state.
- **Key Decisions & Features:**
  - *Bot Reaction Delay:* Tightened again from the 0.2-1.0s range down to `0.15 + random(0-0.15) + up to 0.5 penalty`, i.e. a new 0.15-0.8s range — roughly 20-25% faster across the board while keeping the same ink-hoarding-based difficulty scaling from Session 53.
  - *README Rewrite:* The unit roster section was stale (every single card's ink cost was wrong, Scribblers was documented as 3 units instead of 4, ink bottle rewards were described as a flat `+2` instead of randomized `+1/+2/+3`, and the drawing baseline referenced an outdated `y ≥ 24` grid value). Replaced the bullet list with a stats table (sorted by cost, pulled directly from `constants.js`), corrected the bottle/drawing descriptions, filled in the missing `unitDrawers.js`/`haptics.js` entries in the project structure tree, and removed the entire "AI Studio Dev Container" cleanup section since those files (`package.json`, `vite.config.ts`, `metadata.json`) were already stripped from git tracking and gitignored.
- **Final Status:** Verified via `node --check`; README cross-checked line-by-line against `constants.js`.