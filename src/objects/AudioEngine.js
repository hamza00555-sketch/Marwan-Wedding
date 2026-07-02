// Pure-WebAudio sound engine: synthesized SFX + a looping hijaz-scale
// music sequencer. No audio files needed, works offline.

// D hijaz (double-harmonic-ish) — gives the music its Arabic wedding flavour.
// Index:      0       1       2       3       4       5       6       7
const HIJAZ = [146.83, 155.56, 185.00, 196.00, 220.00, 233.08, 277.18, 293.66]; // D3 base

const MUTE_KEY = 'marwan-muted';

class AudioEngine {
  constructor() {
    this.ctx      = null;
    this.master   = null;
    this.musicBus = null;
    this.muted    = localStorage.getItem(MUTE_KEY) === '1';

    this._seqTimer  = null;
    this._nextStep  = 0;
    this._stepIndex = 0;
    this._track     = null;
  }

  // Must be called from a user gesture (click / key) at least once.
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;

    this.ctx    = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.34;
    this.musicBus.connect(this.master);
    return true;
  }

  toggleMuted() {
    this.muted = !this.muted;
    localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    if (this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
    return this.muted;
  }

  // ── primitive voices ───────────────────────────────────────────────────

  _tone(freq, when, dur, { type = 'triangle', vol = 0.5, glideTo = null,
                           attack = 0.008, bus = null } = {}) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(bus || this.master);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  _noise(when, dur, { vol = 0.3, freq = 3000, q = 1, type = 'bandpass', bus = null } = {}) {
    if (!this.ctx) return;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch  = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(f).connect(g).connect(bus || this.master);
    src.start(when);
  }

  _now() { return this.ctx ? this.ctx.currentTime : 0; }

  // ── SFX ────────────────────────────────────────────────────────────────

  jump(second = false) {
    if (!this.ensure()) return;
    const t = this._now();
    const f = second ? 420 : 330;
    this._tone(f, t, 0.16, { type: 'triangle', vol: 0.4, glideTo: f * 1.9 });
    this._noise(t, 0.07, { vol: 0.10, freq: 5000 });
  }

  coin(chain = 1) {
    if (!this.ensure()) return;
    const t = this._now();
    // pitch climbs with the combo chain — very satisfying
    const base = 1046 * Math.pow(1.06, Math.min(chain, 12));
    this._tone(base,        t,        0.09, { type: 'sine', vol: 0.35 });
    this._tone(base * 1.335, t + 0.07, 0.14, { type: 'sine', vol: 0.32 });
  }

  bigCoin() {
    if (!this.ensure()) return;
    const t = this._now();
    [1046, 1318, 1568, 2093].forEach((f, i) =>
      this._tone(f, t + i * 0.06, 0.16, { type: 'sine', vol: 0.3 }));
  }

  hurt() {
    if (!this.ensure()) return;
    const t = this._now();
    this._tone(280, t, 0.28, { type: 'sawtooth', vol: 0.4, glideTo: 90 });
    this._noise(t, 0.18, { vol: 0.22, freq: 900, q: 0.7 });
  }

  shieldSave() {
    if (!this.ensure()) return;
    const t = this._now();
    this._tone(880, t, 0.10, { type: 'square', vol: 0.22, glideTo: 660 });
    this._tone(660, t + 0.08, 0.22, { type: 'square', vol: 0.20, glideTo: 440 });
    this._noise(t, 0.12, { vol: 0.18, freq: 4200, q: 2 });
  }

  powerup() {
    if (!this.ensure()) return;
    const t = this._now();
    [523, 659, 784, 1046].forEach((f, i) =>
      this._tone(f, t + i * 0.07, 0.15, { type: 'triangle', vol: 0.32 }));
  }

  nearMiss() {
    if (!this.ensure()) return;
    const t = this._now();
    this._noise(t, 0.22, { vol: 0.25, freq: 1600, q: 0.6, type: 'highpass' });
    this._tone(1200, t + 0.02, 0.12, { type: 'sine', vol: 0.12, glideTo: 2000 });
  }

  milestone() {
    if (!this.ensure()) return;
    const t = this._now();
    [880, 1174, 1760].forEach((f, i) =>
      this._tone(f, t + i * 0.09, 0.35, { type: 'sine', vol: 0.25 }));
  }

  click() {
    if (!this.ensure()) return;
    this._tone(700, this._now(), 0.06, { type: 'square', vol: 0.15 });
  }

  win() {
    if (!this.ensure()) return;
    const t = this._now();
    const seq = [0, 2, 4, 7, 4, 7, 7];
    seq.forEach((deg, i) => {
      const f = HIJAZ[deg] * 4;
      this._tone(f, t + i * 0.14, 0.3, { type: 'triangle', vol: 0.32 });
      this._tone(f / 2, t + i * 0.14, 0.3, { type: 'sine', vol: 0.2 });
    });
    this._noise(t + seq.length * 0.14, 0.6, { vol: 0.15, freq: 6000, q: 0.5 });
  }

  gameover() {
    if (!this.ensure()) return;
    const t = this._now();
    [4, 2, 1, 0].forEach((deg, i) =>
      this._tone(HIJAZ[deg] * 2, t + i * 0.22, 0.4, { type: 'triangle', vol: 0.3 }));
  }

  // ── music sequencer ────────────────────────────────────────────────────
  // 16 steps per bar (16th notes), lookahead scheduling.

  startMusic(track = 'game') {
    if (!this.ensure()) return;
    this.stopMusic();
    this._track     = track;
    this._stepIndex = 0;
    this._nextStep  = this.ctx.currentTime + 0.06;
    this._seqTimer  = setInterval(() => this._pump(), 30);
  }

  stopMusic() {
    if (this._seqTimer) { clearInterval(this._seqTimer); this._seqTimer = null; }
    this._track = null;
  }

  _pump() {
    if (!this.ctx || !this._track) return;
    const bpm     = this._track === 'game' ? 108 : 84;
    const stepDur = 60 / bpm / 4;

    while (this._nextStep < this.ctx.currentTime + 0.18) {
      this._scheduleStep(this._stepIndex, this._nextStep, stepDur);
      this._nextStep += stepDur;
      this._stepIndex = (this._stepIndex + 1) % 128; // 8-bar loop
    }
  }

  _scheduleStep(s, t, stepDur) {
    const bar  = Math.floor(s / 16);
    const step = s % 16;
    const bus  = this.musicBus;

    if (this._track === 'menu') {
      // sparse dreamy arp
      if (s % 4 === 0) {
        const arp = [0, 2, 4, 6, 7, 6, 4, 2];
        const f = HIJAZ[arp[(s / 4) % 8]] * 2;
        this._tone(f, t, stepDur * 5, { type: 'sine', vol: 0.30, bus });
      }
      if (s % 32 === 0) {
        this._tone(HIJAZ[0], t, stepDur * 24, { type: 'triangle', vol: 0.25, bus });
      }
      return;
    }

    // ── game track ──
    // kick: steps 0 and 8, plus a pickup on 14 every other bar
    if (step === 0 || step === 8 || (step === 14 && bar % 2 === 1)) {
      this._tone(150, t, 0.11, { type: 'sine', vol: 0.55, glideTo: 48, bus });
    }
    // hat on off-beats
    if (step % 4 === 2) {
      this._noise(t, 0.04, { vol: 0.10, freq: 8000, q: 1.5, type: 'highpass', bus });
    }
    // darbuka-ish tek on 4 & 12
    if (step === 4 || step === 12) {
      this._noise(t, 0.07, { vol: 0.14, freq: 2600, q: 3, bus });
    }

    // bass: root movement D D G A per 4 bars
    if (step % 8 === 0) {
      const roots = [0, 0, 3, 4, 0, 0, 4, 3];
      this._tone(HIJAZ[roots[bar]] , t, stepDur * 7, { type: 'triangle', vol: 0.4, bus });
    }

    // melody: a catchy hijaz phrase over 8 bars (degree, step-in-loop, length)
    const MEL = [
      // bars 0-1
      [7, 0, 2], [6, 4, 2], [4, 8, 2], [6, 12, 2],
      [7, 16, 2], [8, 20, 2], [7, 24, 4],
      // bars 2-3
      [4, 32, 2], [6, 36, 2], [7, 40, 2], [6, 44, 2],
      [4, 48, 2], [2, 52, 2], [1, 56, 4],
      // bars 4-5 (repeat of opening)
      [7, 64, 2], [6, 68, 2], [4, 72, 2], [6, 76, 2],
      [7, 80, 2], [8, 84, 2], [7, 88, 4],
      // bars 6-7 (resolve down to root)
      [6, 96, 2], [4, 100, 2], [2, 104, 2], [4, 108, 2],
      [2, 112, 2], [1, 116, 2], [0, 120, 6],
    ];
    for (const [deg, at, len] of MEL) {
      if (at === s) {
        const f = (deg <= 7 ? HIJAZ[deg] : HIJAZ[deg - 7] * 2) * 4;
        this._tone(f, t, stepDur * len * 0.92, { type: 'square', vol: 0.115, bus });
        this._tone(f, t, stepDur * len * 0.92, { type: 'sine',   vol: 0.16,  bus });
      }
    }
  }
}

// singleton
const audio = new AudioEngine();
export default audio;
