// Haptic vibration feedback for mobile devices
let lastVibrateTime = 0;

/**
 * Triggers phone vibration when the player's base takes damage.
 * Lower remaining HP results in significantly bigger, longer, and more alarming vibrations.
 *
 * @param {number} currentHp - Current remaining HP of our base
 * @param {number} maxHp - Maximum HP of the base (default 30)
 */
export function vibrateBaseHit(currentHp, maxHp = 30) {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate !== 'function') return;

  const now = performance.now();
  // Debounce rapid successive hits within 80ms to avoid interrupting or stuttering the vibration pattern
  if (now - lastVibrateTime < 80) return;
  lastVibrateTime = now;

  try {
    const safeHp = Math.max(0, Math.min(maxHp, currentHp));
    const hpRatio = safeHp / maxHp; // 1.0 (full health) down to 0.0 (destroyed)
    const dangerLevel = 1.0 - hpRatio; // 0.0 (no damage) up to 1.0 (critical)

    let pattern;

    if (safeHp <= 5) {
      // Critical Danger (HP <= 5): Urgent high-intensity triple alarm tremor
      const pulse1 = Math.round(75 + dangerLevel * 45);  // ~115ms
      const pause1 = 35;
      const pulse2 = Math.round(95 + dangerLevel * 55);  // ~145ms
      const pause2 = 35;
      const pulse3 = Math.round(130 + dangerLevel * 70); // ~195ms
      pattern = [pulse1, pause1, pulse2, pause2, pulse3];
    } else if (safeHp <= 12) {
      // Low HP (HP <= 12): Heavy double shudder
      const pulse1 = Math.round(55 + dangerLevel * 45); // ~85ms - 95ms
      const pause1 = 45;
      const pulse2 = Math.round(80 + dangerLevel * 60); // ~120ms - 135ms
      pattern = [pulse1, pause1, pulse2];
    } else {
      // Moderate to High HP: Single punchy haptic tap that scales up with missing HP
      // Starts around 40ms at full HP, scaling up to ~95ms as HP drops towards 12
      const duration = Math.round(40 + dangerLevel * 75);
      pattern = [duration];
    }

    navigator.vibrate(pattern);
  } catch {
    // Silently guard in environments where haptics are disabled or restricted
  }
}
