/**
 * Sound kit: a recorded folk soundtrack, dusk ambience, synthesised effects, and Sir Reginald's
 * lines spoken aloud. Browsers only allow audio after a click, so call unlock() from the sound
 * toggle; setEnabled() then follows the toggle.
 */

type Phase = 'waiting' | 'flying' | 'crashed';

const LOOKAHEAD = 0.25;

/**
 * Soundtrack, played in order and looped. Tracks by RandomMind, released as CC0 (public domain)
 * on OpenGameArt: opengameart.org/content/medieval-market-day, /medieval-minstrel-dance and
 * /medieval-rejoicing. `gain` evens out their loudness.
 */
const PLAYLIST = [
  { file: 'market-day.mp3', gain: 0.5 },
  { file: 'market-day.mp3', gain: 0.5 },
  { file: 'minstrel-dance.mp3', gain: 0.92 },
  { file: 'rejoicing.mp3', gain: 0.9 },
];
/** Relative to the page, so it works wherever the game is hosted. */
const MUSIC_URL = 'audio/music/';

/** Voices that suit an elderly English gentleman, best first. */
const MALE_VOICES = /ryan|thomas|george|arthur|oliver|daniel|alfie|elliot|noah|uk english male|\bmale\b/i;
const FEMALE_VOICES = /hazel|susan|libby|sonia|maisie|mia|abbi|bella|hollie|olivia|kate|serena|martha|female/i;

export class SoundFx {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private duck!: GainNode;
  private music!: GainNode;
  private amb!: GainNode;
  private fx!: GainNode;
  private verb!: GainNode;
  private noise!: AudioBuffer;
  private brown!: AudioBuffer;
  private water: AudioBufferSourceNode | null = null;
  private timer: number | null = null;
  private suspendTimer: number | null = null;
  private enabled = false;

  private track: HTMLAudioElement | null = null;
  private trackGain!: GainNode;
  private trackIndex = 0;

  private voice: SpeechSynthesisVoice | null = null;
  private saying: string | null = null;

  private nextFlap = 0;
  private nextBeat = 0;
  private nextChirp = 0;
  private nextOwl = 0;
  private phase: Phase = 'waiting';
  private mult = 1;
  private intensity = 0;

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      this.ctx = ctx;

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 4;
      comp.attack.value = 0.004;
      comp.release.value = 0.2;
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(comp).connect(ctx.destination);

      // music runs through its own gain so it can dip under speech and gunfire
      this.duck = ctx.createGain();
      this.duck.connect(this.master);
      this.music = ctx.createGain();
      this.music.gain.value = 0.6;
      this.music.connect(this.duck);
      this.amb = this.bus(0.45);
      this.fx = this.bus(0.9);

      // valley reverb: a few seconds of decaying stereo noise
      const conv = ctx.createConvolver();
      const len = Math.floor(ctx.sampleRate * 2.6);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
      }
      conv.buffer = ir;
      this.verb = ctx.createGain();
      this.verb.gain.value = 0.35;
      this.verb.connect(conv).connect(this.master);

      const n = Math.floor(ctx.sampleRate * 2);
      this.noise = ctx.createBuffer(1, n, ctx.sampleRate);
      const wd = this.noise.getChannelData(0);
      for (let i = 0; i < n; i++) wd[i] = Math.random() * 2 - 1;
      this.brown = ctx.createBuffer(1, n, ctx.sampleRate);
      const bd = this.brown.getChannelData(0);
      let last = 0;
      for (let i = 0; i < n; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        bd[i] = last * 3.5;
      }

      // the soundtrack streams from a media element into the music bus
      const el = new Audio();
      el.preload = 'auto';
      el.addEventListener('ended', () => this.playTrack(this.trackIndex + 1));
      this.trackGain = ctx.createGain();
      ctx.createMediaElementSource(el).connect(this.trackGain).connect(this.music);
      this.track = el;
      this.loadTrack(0);

      if ('speechSynthesis' in window) {
        const pick = () => (this.voice = pickVoice(window.speechSynthesis.getVoices()));
        pick();
        window.speechSynthesis.addEventListener('voiceschanged', pick);
      }
    }
    void this.ctx.resume();
  }

  /** Follows the sound toggle: fades everything in or out and runs the scheduler. */
  setEnabled(on: boolean) {
    const ctx = this.ctx;
    if (!ctx || on === this.enabled) return;
    this.enabled = on;
    const t = ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(on ? 0.85 : 0, t + (on ? 0.8 : 0.3));
    if (this.suspendTimer !== null) window.clearTimeout(this.suspendTimer);
    this.suspendTimer = null;
    if (on) {
      void ctx.resume();
      void this.track?.play().catch(() => {});
      this.nextChirp = t + 0.6;
      this.nextOwl = t + 8;
      this.startWater();
      if (this.timer === null) this.timer = window.setInterval(() => this.tick(), 50);
    } else {
      if (this.timer !== null) window.clearInterval(this.timer);
      this.timer = null;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      this.suspendTimer = window.setTimeout(() => {
        this.track?.pause();
        this.stopWater();
        void ctx.suspend();
      }, 400);
    }
  }

  /** Called with every state update: drives the heartbeat and the wingbeats. */
  setPhase(phase: Phase, mult: number) {
    if (phase === 'flying' && this.phase !== 'flying' && this.ctx) {
      this.nextFlap = this.ctx.currentTime + 0.05;
      this.nextBeat = this.ctx.currentTime + 0.4;
    }
    this.phase = phase;
    this.mult = mult;
  }

  /** Sir Reginald says a line, after `delay` seconds. The music dips so every word is clear. */
  say(text: string, delay = 0) {
    if (!this.enabled || !('speechSynthesis' in window)) return;
    window.setTimeout(() => {
      const synth = window.speechSynthesis;
      if (!this.enabled || (synth.speaking && this.saying === text)) return;
      if (synth.speaking || synth.pending) synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (this.voice) u.voice = this.voice;
      u.lang = this.voice?.lang ?? 'en-GB';
      // slower and lower: a portly old gentleman
      u.rate = 0.92;
      u.pitch = 0.78;
      u.volume = 1;
      u.onstart = () => this.dip(0.28, 0.12);
      u.onend = u.onerror = () => {
        if (this.saying === text) this.saying = null;
        this.dip(1, 0.7);
      };
      this.saying = text;
      synth.speak(u);
    }, delay * 1000);
  }

  // --- game moments -------------------------------------------------------------------

  /** Take-off: a splash, a burst of wingbeats, quacks, and the hunter closing his gun. */
  launch() {
    const ctx = this.live();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.splash(t, 0.55);
    for (let i = 0; i < 4; i++) this.flap(t + 0.05 + i * 0.11, 1.2);
    this.quack(t + 0.12, 3);
    this.click(t + 0.45, 1600, 0.35);
    this.click(t + 0.53, 2400, 0.28);
  }

  /** A shot that misses: the blast, pellets whizzing past, then his reload. */
  miss() {
    const ctx = this.live();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.shot(t);
    this.whizz(t + 0.02);
    this.reload(t + 1.6);
  }

  /** The duck is hit: the blast, then the splash when it lands. */
  crash(splashIn: number) {
    const ctx = this.live();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.shot(t);
    this.splash(t + splashIn, 1);
    this.reload(t + 1.9);
  }

  /** The duck faints from lack of air: a weak quack, a falling whistle, then the splash. */
  faint(splashIn: number) {
    const ctx = this.live();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.quack(t, 1);
    this.fall(t + 0.15, Math.max(0.3, splashIn - 0.15));
    this.splash(t + splashIn, 1);
  }

  /** The crocodile erupts from the lake, its jaws snap shut, and it drags the duck under. */
  croc() {
    const ctx = this.live();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.splash(t, 0.8);
    this.quack(t + 0.08, 2);
    this.click(t + 0.3, 420, 0.7);
    this.noiseBurst(t + 0.3, 0.09, 0.55, 'lowpass', 380, 1, this.fx);
    this.splash(t + 0.6, 1);
  }

  /** The croc leaps out of the lake (in `emergeIn` s) and comes down jaws-first on the duck (in `diveIn` s). */
  crocLeap(emergeIn: number, diveIn: number) {
    const ctx = this.live();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.splash(t + emergeIn, 0.7);
    this.click(t + diveIn - 0.04, 420, 0.7);
    this.noiseBurst(t + diveIn - 0.04, 0.09, 0.55, 'lowpass', 380, 1, this.fx);
    this.splash(t + diveIn, 1.3);
  }

  /** A player cashes out: coins. */
  cashout() {
    const ctx = this.live();
    if (!ctx) return;
    this.chime(ctx.currentTime);
  }

  // --- scheduler --------------------------------------------------------------------------

  private tick() {
    const ctx = this.ctx;
    if (!ctx || !this.enabled) return;
    const t = ctx.currentTime;
    const horizon = t + LOOKAHEAD;

    // tension follows the multiplier while the duck is up
    const target = this.phase === 'flying' ? Math.min(1, 0.3 + Math.log(Math.max(1, this.mult)) / Math.log(20)) : 0;
    this.intensity += (target - this.intensity) * (target > this.intensity ? 0.08 : 0.04);

    if (this.phase === 'flying') {
      if (this.nextFlap < t) this.nextFlap = t + 0.02;
      const rate = 2.6 + Math.min(2.4, Math.log(Math.max(1, this.mult)) * 1.1);
      while (this.nextFlap < horizon) {
        this.flap(this.nextFlap, 1);
        this.nextFlap += 1 / rate;
      }
      // a heartbeat that quickens as the multiplier climbs
      if (this.nextBeat < t) this.nextBeat = t + 0.02;
      const bpm = 70 + 70 * Math.min(1, Math.log(Math.max(1, this.mult)) / Math.log(15));
      while (this.nextBeat < horizon) {
        this.heartbeat(this.nextBeat, 0.25 + 0.45 * this.intensity);
        this.nextBeat += 60 / bpm;
      }
    }

    while (this.nextChirp < horizon) {
      this.chirp(this.nextChirp, Math.random() < 0.5 ? 4600 : 5200);
      this.nextChirp += 0.5 + Math.random() * 1.3;
    }
    if (this.nextOwl < horizon) {
      this.owl(this.nextOwl);
      this.nextOwl += 22 + Math.random() * 20;
    }
  }

  // --- soundtrack -------------------------------------------------------------------------

  private loadTrack(i: number) {
    const el = this.track;
    if (!el || !this.ctx) return;
    this.trackIndex = i % PLAYLIST.length;
    const next = PLAYLIST[this.trackIndex];
    this.trackGain.gain.setValueAtTime(next.gain, this.ctx.currentTime);
    const url = MUSIC_URL + next.file;
    // the loop track repeats: just rewind instead of reloading it
    if (el.src.endsWith(url)) el.currentTime = 0;
    else el.src = url;
  }

  private playTrack(i: number) {
    this.loadTrack(i);
    if (this.enabled) void this.track?.play().catch(() => {});
  }

  /** Lowers (or restores) the music to `level` over `time` seconds. */
  private dip(level: number, time: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.duck.gain.cancelScheduledValues(t);
    this.duck.gain.setValueAtTime(this.duck.gain.value, t);
    this.duck.gain.linearRampToValueAtTime(level, t + time);
  }

  /** "Lub-dub": two soft, low thumps. */
  private heartbeat(t: number, vol: number) {
    [0, 0.17].forEach((d, i) => {
      const at = t + d;
      const g = this.env(at, 0.008, vol * (i ? 0.6 : 1), 0.16);
      g.connect(this.music);
      const o = this.osc('sine', i ? 58 : 66, at, 0.2);
      o.frequency.exponentialRampToValueAtTime(38, at + 0.14);
      o.connect(g);
    });
  }

  // --- effects ----------------------------------------------------------------------------

  /** Twelve-bore: a sharp crack, a chesty blast, a deep thump, and echoes off the far hills. */
  private shot(t: number) {
    this.noiseBurst(t, 0.03, 0.6, 'highpass', 2500, 0.7, this.fx);
    const body = this.noiseBurst(t, 0.42, 0.55, 'lowpass', 2600, 0.8, this.fx, 260);
    body.connect(this.verb);
    const g = this.env(t, 0.002, 0.55, 0.38);
    g.connect(this.fx);
    const o = this.osc('sine', 120, t, 0.4);
    o.frequency.exponentialRampToValueAtTime(34, t + 0.3);
    o.connect(g);
    // the report rolls back off the hills
    [0.32, 0.68, 1.1].forEach((d, i) => {
      const e = this.noiseBurst(t + d, 0.5, 0.22 / (i + 1), 'lowpass', 900 - i * 200, 0.8, this.fx, 180);
      e.connect(this.verb);
    });
    // the band ducks for the blast
    if (!this.saying) {
      this.dip(0.5, 0.02);
      window.setTimeout(() => !this.saying && this.dip(1, 0.6), 500);
    }
  }

  /** Pellets tearing past. */
  private whizz(t: number) {
    const ctx = this.ctx!;
    const src = this.src(this.noise, t, 0.3);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 4;
    bp.frequency.setValueAtTime(5200, t);
    bp.frequency.exponentialRampToValueAtTime(1400, t + 0.25);
    const g = this.env(t, 0.01, 0.18, 0.26);
    src.connect(bp).connect(g).connect(this.fx);
  }

  /** A cartoon falling whistle that drops in pitch over `dur` seconds. */
  private fall(t: number, dur: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1300, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.06);
    g.gain.setValueAtTime(0.09, t + dur * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.fx);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  /** He breaks the gun, the spent shells pop out and tinkle, and it snaps shut. */
  private reload(t: number) {
    this.click(t, 1400, 0.4);
    this.ting(t + 0.12, 3100);
    this.ting(t + 0.19, 3500);
    this.click(t + 0.6, 2200, 0.32);
    this.click(t + 0.95, 1200, 0.5);
  }

  private click(t: number, f: number, vol: number) {
    this.noiseBurst(t, 0.025, vol, 'bandpass', f, 3, this.fx);
    const g = this.env(t, 0.001, vol * 0.4, 0.04);
    g.connect(this.fx);
    this.osc('square', f / 4, t, 0.05).connect(g);
  }

  private ting(t: number, f: number) {
    const g = this.env(t, 0.002, 0.06, 0.18);
    g.connect(this.fx);
    this.osc('sine', f, t, 0.2).connect(g);
  }

  /** Wingbeat: a soft whump of air. */
  private flap(t: number, vol: number) {
    const ctx = this.ctx!;
    const src = this.src(this.noise, t, 0.16);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(380, t);
    bp.frequency.exponentialRampToValueAtTime(900, t + 0.05);
    bp.frequency.exponentialRampToValueAtTime(300, t + 0.14);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22 * vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    src.connect(bp).connect(g).connect(this.fx);
  }

  /** Mallard: a nasal, raspy quack, a few times, each a little lower. */
  private quack(t0: number, count: number) {
    const ctx = this.ctx!;
    for (let i = 0; i < count; i++) {
      const t = t0 + i * 0.2;
      const f = 300 - i * 18;
      const o = this.osc('sawtooth', f * 1.15, t, 0.2);
      o.frequency.setValueAtTime(f * 1.15, t);
      o.frequency.linearRampToValueAtTime(f, t + 0.05);
      o.frequency.exponentialRampToValueAtTime(f * 0.78, t + 0.17);
      // rasp
      const am = ctx.createGain();
      am.gain.value = 0.6;
      const lfo = this.osc('square', 55, t, 0.2);
      const lg = ctx.createGain();
      lg.gain.value = 0.4;
      lfo.connect(lg).connect(am.gain);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.32 - i * 0.05, t + 0.02);
      g.gain.setValueAtTime(0.28 - i * 0.05, t + 0.09);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(am);
      for (const [fc, q, lvl] of [
        [1000, 5, 1],
        [1900, 7, 0.6],
        [3000, 9, 0.25],
      ] as const) {
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = fc;
        bp.Q.value = q;
        const lg2 = ctx.createGain();
        lg2.gain.value = lvl;
        am.connect(bp).connect(lg2).connect(g);
      }
      g.connect(this.fx);
      g.connect(this.verb);
    }
  }

  /** Water: a slap, a spray, then bubbles. */
  private splash(t: number, size: number) {
    this.noiseBurst(t, 0.09, 0.5 * size, 'lowpass', 1800, 0.8, this.fx, 500);
    const spray = this.noiseBurst(t + 0.02, 0.5 * size + 0.2, 0.28 * size, 'bandpass', 3200, 0.9, this.fx, 1500);
    spray.connect(this.verb);
    for (let i = 0; i < 5; i++) {
      const bt = t + 0.12 + i * 0.07 + Math.random() * 0.05;
      const f = 500 + Math.random() * 500;
      const g = this.env(bt, 0.004, 0.05 * size, 0.07);
      g.connect(this.fx);
      const o = this.osc('sine', f, bt, 0.08);
      o.frequency.exponentialRampToValueAtTime(f * 2.2, bt + 0.06);
      o.connect(g);
    }
  }

  /** Coins for the player. */
  private chime(t: number) {
    [1318.5, 1760, 2637].forEach((f, i) => {
      const at = t + i * 0.07;
      const g = this.env(at, 0.003, 0.16, 0.6);
      g.connect(this.fx);
      g.connect(this.verb);
      this.osc('triangle', f, at, 0.65).connect(g);
      const g2 = this.env(at, 0.002, 0.05, 0.25);
      g2.connect(this.fx);
      this.osc('sine', f * 2.76, at, 0.3).connect(g2);
    });
  }

  // --- ambience ---------------------------------------------------------------------------

  private startWater() {
    const ctx = this.ctx!;
    if (this.water) return;
    const src = ctx.createBufferSource();
    src.buffer = this.brown;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    const g = ctx.createGain();
    g.gain.value = 0.16;
    // slow swell, like water lapping at the bank
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.18;
    const lg = ctx.createGain();
    lg.gain.value = 0.08;
    lfo.connect(lg).connect(g.gain);
    src.connect(lp).connect(g).connect(this.amb);
    src.start();
    lfo.start();
    src.onended = () => lfo.stop();
    this.water = src;
  }

  private stopWater() {
    this.water?.stop();
    this.water = null;
  }

  /** A cricket: a short train of pulses. */
  private chirp(t: number, f: number) {
    const ctx = this.ctx!;
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    pan.connect(this.amb);
    const pulses = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < pulses; i++) {
      const at = t + i * 0.045;
      const g = this.env(at, 0.004, 0.035, 0.03);
      g.connect(pan);
      this.osc('sine', f, at, 0.04).connect(g);
    }
  }

  /** A distant tawny owl: "hoo... hoo-hoo". */
  private owl(t: number) {
    [
      [0, 0.45],
      [0.75, 0.18],
      [0.98, 0.5],
    ].forEach(([d, len]) => {
      const at = t + d;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.06, at + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, at + len);
      g.connect(this.amb);
      g.connect(this.verb);
      const o = this.osc('sine', 410, at, len + 0.05);
      o.frequency.setValueAtTime(380, at);
      o.frequency.linearRampToValueAtTime(420, at + len * 0.4);
      o.frequency.linearRampToValueAtTime(360, at + len);
      o.connect(g);
    });
  }

  // --- plumbing ---------------------------------------------------------------------------

  private live() {
    return this.enabled ? this.ctx : null;
  }

  private bus(level: number) {
    const g = this.ctx!.createGain();
    g.gain.value = level;
    g.connect(this.master);
    return g;
  }

  private osc(type: OscillatorType, f: number, t: number, dur: number) {
    const o = this.ctx!.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.start(t);
    o.stop(t + dur);
    return o;
  }

  private src(buf: AudioBuffer, t: number, dur: number) {
    const s = this.ctx!.createBufferSource();
    s.buffer = buf;
    const off = Math.random() * Math.max(0, buf.duration - dur - 0.01);
    s.start(t, off, dur + 0.01);
    return s;
  }

  /** A gain node shaped as a quick attack and an exponential decay. */
  private env(t: number, attack: number, peak: number, decay: number) {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }

  /** Filtered noise with a decaying envelope; optionally sweeps the filter down to `sweepTo`. */
  private noiseBurst(t: number, dur: number, vol: number, type: BiquadFilterType, f: number, q: number, out: AudioNode, sweepTo?: number) {
    const ctx = this.ctx!;
    const src = this.src(this.noise, t, dur);
    const flt = ctx.createBiquadFilter();
    flt.type = type;
    flt.frequency.setValueAtTime(f, t);
    if (sweepTo) flt.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    flt.Q.value = q;
    const g = this.env(t, 0.002, vol, dur);
    src.connect(flt).connect(g).connect(out);
    return g;
  }
}

/** The best English gentleman's voice the browser has: British, male, and natural-sounding if possible. */
function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -Infinity;
  for (const v of voices) {
    if (!v.lang.toLowerCase().startsWith('en')) continue;
    let score = 0;
    if (/en[-_]gb/i.test(v.lang)) score += 4;
    if (MALE_VOICES.test(v.name)) score += 3;
    if (FEMALE_VOICES.test(v.name)) score -= 4;
    if (/natural|online|neural|enhanced|premium/i.test(v.name)) score += 1;
    if (score > bestScore) {
      best = v;
      bestScore = score;
    }
  }
  return best;
}
