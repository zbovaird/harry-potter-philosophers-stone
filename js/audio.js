/**
 * Procedural music/SFX buses with optional future file loading.
 * Real Audio buffers can be dropped into assets/audio later.
 */
export class GameAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicNodes = [];
    this.currentTheme = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.28;
    this.musicGain.connect(this.master);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.7;
    this.sfxGain.connect(this.master);

    this.enabled = true;
  }

  resume() {
    if (this.ctx?.state === "suspended") this.ctx.resume();
  }

  tone({ frequency = 440, duration = 0.12, type = "sine", volume = 0.08, slideTo = null, delay = 0, bus = "sfx" }) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + duration);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(bus === "music" ? this.musicGain : this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  noise({ duration = 0.08, volume = 0.05, filterType = "lowpass", filterFreq = 1000 }) {
    if (!this.enabled || !this.ctx) return;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    const t0 = this.ctx.currentTime;
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start(t0);
  }

  stopMusic() {
    for (const node of this.musicNodes) {
      try {
        node.stop();
      } catch {
        /* already stopped */
      }
    }
    this.musicNodes = [];
    this.currentTheme = null;
  }

  playTheme(themeId) {
    if (!this.enabled || !this.ctx) return;
    if (this.currentTheme === themeId) return;
    this.stopMusic();
    this.currentTheme = themeId;
    this.resume();

    const themes = {
      diagon: { root: 110, fifth: 165, mood: "warm" },
      greatHall: { root: 98, fifth: 147, mood: "grand" },
      bathroom: { root: 82, fifth: 123, mood: "tense" },
      forest: { root: 73, fifth: 110, mood: "dark" },
      dungeon: { root: 65, fifth: 98, mood: "ominous" },
      quirrell: { root: 55, fifth: 82, mood: "danger" },
    };
    const theme = themes[themeId] || themes.diagon;
    const t0 = this.ctx.currentTime;

    const drone = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    drone.type = "sine";
    drone.frequency.value = theme.root;
    droneGain.gain.value = 0.12;
    drone.connect(droneGain);
    droneGain.connect(this.musicGain);
    drone.start(t0);
    this.musicNodes.push(drone);

    const pad = this.ctx.createOscillator();
    const padGain = this.ctx.createGain();
    pad.type = "triangle";
    pad.frequency.value = theme.fifth;
    padGain.gain.value = 0.05;
    pad.connect(padGain);
    padGain.connect(this.musicGain);
    pad.start(t0);
    this.musicNodes.push(pad);

    if (theme.mood === "danger" || theme.mood === "ominous") {
      const pulse = this.ctx.createOscillator();
      const pulseGain = this.ctx.createGain();
      pulse.type = "sawtooth";
      pulse.frequency.value = theme.root * 2;
      pulseGain.gain.value = 0.02;
      pulse.connect(pulseGain);
      pulseGain.connect(this.musicGain);
      pulse.start(t0);
      this.musicNodes.push(pulse);
    }
  }

  cast(spellColorHint = 0.5) {
    const base = 320 + spellColorHint * 280;
    this.tone({ frequency: base, slideTo: base * 1.8, duration: 0.18, type: "sine", volume: 0.07 });
    this.tone({ frequency: base * 0.5, duration: 0.1, type: "triangle", volume: 0.04, delay: 0.02 });
    this.noise({ duration: 0.06, volume: 0.03, filterFreq: 1800 });
  }

  hit() {
    this.noise({ duration: 0.1, volume: 0.06, filterType: "bandpass", filterFreq: 600 });
    this.tone({ frequency: 180, slideTo: 80, duration: 0.15, type: "square", volume: 0.04 });
  }

  ui() {
    this.tone({ frequency: 520, duration: 0.08, type: "sine", volume: 0.05 });
  }

  win() {
    this.tone({ frequency: 392, duration: 0.2, type: "sine", volume: 0.06 });
    this.tone({ frequency: 523, duration: 0.25, type: "sine", volume: 0.06, delay: 0.12 });
    this.tone({ frequency: 659, duration: 0.35, type: "sine", volume: 0.06, delay: 0.24 });
  }

  jump() {
    this.tone({ frequency: 220, slideTo: 440, duration: 0.14, type: "triangle", volume: 0.05 });
  }

  hurt() {
    this.tone({ frequency: 140, slideTo: 70, duration: 0.22, type: "sawtooth", volume: 0.05 });
    this.noise({ duration: 0.12, volume: 0.05, filterFreq: 400 });
  }

  interact() {
    this.tone({ frequency: 440, slideTo: 660, duration: 0.12, type: "sine", volume: 0.05 });
  }
}
