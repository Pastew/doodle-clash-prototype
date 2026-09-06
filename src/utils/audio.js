// Web Audio API procedural sound synthesizer for crisp pen doodles, ink splats, and hits
class SoundFX {
  constructor() {
    this.ctx = null;
  }

  getContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playScribble() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      // White noise burst filtered like pencil/pen scratch
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800 + Math.random() * 800, ctx.currentTime);
      filter.Q.setValueAtTime(3, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {
      // Audio playback silently guarded
    }
  }

  playDeploy() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }

  playHit() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  playSplat() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      // Low squish pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  playBottle(tier = 2) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, t); // C5
      if (tier >= 2) {
        osc.frequency.setValueAtTime(659.25, t + 0.07); // E5
        osc.frequency.setValueAtTime(783.99, t + 0.14); // G5
      } else {
        osc.frequency.setValueAtTime(659.25, t + 0.08); // E5
      }
      if (tier >= 3) {
        osc.frequency.setValueAtTime(1046.50, t + 0.21); // High C6 fanfare!
      }
      const duration = tier >= 3 ? 0.38 : tier === 2 ? 0.28 : 0.20;
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(t + duration);
    } catch {}
  }

  // Rising whoosh + bright ding when the match speed ramps up (1min/2min marks)
  playSpeedUp() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // 1. Rising sawtooth whoosh
      const whoosh = ctx.createOscillator();
      const whooshGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      whoosh.type = 'sawtooth';
      whoosh.frequency.setValueAtTime(180, t);
      whoosh.frequency.exponentialRampToValueAtTime(900, t + 0.25);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.exponentialRampToValueAtTime(4000, t + 0.25);
      whooshGain.gain.setValueAtTime(0.001, t);
      whooshGain.gain.exponentialRampToValueAtTime(0.16, t + 0.15);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      whoosh.connect(filter);
      filter.connect(whooshGain);
      whooshGain.connect(ctx.destination);
      whoosh.start(t);
      whoosh.stop(t + 0.28);

      // 2. Bright confirmation ding on landing
      const ding = ctx.createOscillator();
      const dingGain = ctx.createGain();
      ding.type = 'triangle';
      ding.frequency.setValueAtTime(880, t + 0.22);
      ding.frequency.setValueAtTime(1318.51, t + 0.27); // E6
      dingGain.gain.setValueAtTime(0.001, t + 0.22);
      dingGain.gain.exponentialRampToValueAtTime(0.2, t + 0.26);
      dingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      ding.connect(dingGain);
      dingGain.connect(ctx.destination);
      ding.start(t + 0.22);
      ding.stop(t + 0.55);
    } catch {}
  }

  // Urgent two-pulse alert when 30 seconds remain in the match
  playTimeWarning() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      [0, 0.18].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(660, t + offset);
        gain.gain.setValueAtTime(0.001, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.16, t + offset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + offset);
        osc.stop(t + offset + 0.16);
      });
    } catch {}
  }

  // Short countdown tick for the final 5-4-3-2-1 — pitch rises as it counts down,
  // with a longer, louder tick on the final second.
  playCountdownTick(secondsLeft = 1) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const freq = 520 + (5 - secondsLeft) * 90;
      osc.frequency.setValueAtTime(freq, t);
      const isFinal = secondsLeft <= 1;
      const duration = isFinal ? 0.22 : 0.12;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(isFinal ? 0.22 : 0.16, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration);
    } catch {}
  }

  playError() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      // Double low buzz pulse for unmistakable "wrong / not enough ink" signal
      [0, 0.08].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime + offset);
        osc.frequency.linearRampToValueAtTime(95, ctx.currentTime + offset + 0.07);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.07);
      });
    } catch {}
  }

  playVictory() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {}
  }

  // Urgent defensive alarm thud when player's base takes damage
  playOurBaseDamage() {
    try {
      const now = performance.now();
      if (this.lastOurBaseHit && now - this.lastOurBaseHit < 65) return;
      this.lastOurBaseHit = now;

      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // 1. Heavy sub-bass warning thud (deep impact feeling)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(125, t);
      subOsc.frequency.exponentialRampToValueAtTime(32, t + 0.22);
      subGain.gain.setValueAtTime(0.35, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(t);
      subOsc.stop(t + 0.22);

      // 2. Urgent dissonant alarm klaxon (minor second interval: 196Hz + 208Hz)
      [196, 208].forEach((freq) => {
        const alarmOsc = ctx.createOscillator();
        const alarmGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        alarmOsc.type = 'sawtooth';
        alarmOsc.frequency.setValueAtTime(freq, t);
        alarmOsc.frequency.linearRampToValueAtTime(freq * 0.82, t + 0.18);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, t);
        filter.frequency.linearRampToValueAtTime(300, t + 0.18);
        filter.Q.setValueAtTime(3.5, t);

        alarmGain.gain.setValueAtTime(0.18, t);
        alarmGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        alarmOsc.connect(filter);
        filter.connect(alarmGain);
        alarmGain.connect(ctx.destination);

        alarmOsc.start(t);
        alarmOsc.stop(t + 0.18);
      });

      // 3. Ink crumble crunch (filtered noise burst)
      const bufferSize = Math.floor(ctx.sampleRate * 0.09);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const nFilter = ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.setValueAtTime(550, t);
      nFilter.Q.setValueAtTime(2.0, t);
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.12, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(t);
    } catch {}
  }

  // Rewarding offensive crack & triumphant chime when enemy base takes damage
  playEnemyBaseDamage() {
    try {
      const now = performance.now();
      if (this.lastEnemyBaseHit && now - this.lastEnemyBaseHit < 65) return;
      this.lastEnemyBaseHit = now;

      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // 1. Crisp offensive impact crack (high-energy punch)
      const crackOsc = ctx.createOscillator();
      const crackGain = ctx.createGain();
      crackOsc.type = 'sawtooth';
      crackOsc.frequency.setValueAtTime(560, t);
      crackOsc.frequency.exponentialRampToValueAtTime(140, t + 0.11);
      crackGain.gain.setValueAtTime(0.25, t);
      crackGain.gain.exponentialRampToValueAtTime(0.002, t + 0.11);
      crackOsc.connect(crackGain);
      crackGain.connect(ctx.destination);
      crackOsc.start(t);
      crackOsc.stop(t + 0.11);

      // 2. Rewarding high-pitch triumphant chime (bright 784Hz [G5] to 1046.5Hz [C6] ding)
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'triangle';
      chimeOsc.frequency.setValueAtTime(783.99, t);
      chimeOsc.frequency.setValueAtTime(1046.50, t + 0.04);
      chimeGain.gain.setValueAtTime(0.18, t);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chimeOsc.start(t);
      chimeOsc.stop(t + 0.26);

      // 3. Shimmering ink splash pop (crisp high-pass noise)
      const bufferSize = Math.floor(ctx.sampleRate * 0.06);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const nFilter = ctx.createBiquadFilter();
      nFilter.type = 'highpass';
      nFilter.frequency.setValueAtTime(2400, t);
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.08, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(t);
    } catch {}
  }
}

export const soundFX = new SoundFX();
