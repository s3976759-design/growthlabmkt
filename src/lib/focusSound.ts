// Procedural ambient sound engine using Web Audio API.
// Each "sound" is a recipe over noise nodes + filters/oscillators.
// No external audio file dependency — works offline, instantly.

export interface SoundOption {
  id: string;
  label: string;
  emoji: string;
}

export const SOUNDS: SoundOption[] = [
  { id: "rain", label: "Mưa rơi", emoji: "🌧️" },
  { id: "water", label: "Suối chảy", emoji: "💧" },
  { id: "birds", label: "Chim rừng", emoji: "🐦" },
  { id: "cafe", label: "Quán cà phê", emoji: "☕" },
  { id: "ocean", label: "Sóng biển", emoji: "🌊" },
  { id: "fire", label: "Lửa trại", emoji: "🔥" },
  { id: "wind", label: "Gió nhẹ", emoji: "🍃" },
];

type EngineState = {
  ctx: AudioContext;
  master: GainNode;
  nodes: AudioNode[];
  rafIds: number[];
  intervalIds: number[];
  cleanup: () => void;
};

let engine: EngineState | null = null;
let currentId: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}
export function subscribeFocus(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export function getFocusState() {
  return { currentId, isPlaying: !!engine };
}

function createNoiseBuffer(ctx: AudioContext, type: "white" | "pink" | "brown") {
  const length = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, length, ctx.sampleRate);
  const d = buf.getChannelData(0);
  if (type === "white") {
    for (let i = 0; i < length; i++) d[i] = Math.random() * 2 - 1;
  } else if (type === "pink") {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  } else {
    let last = 0;
    for (let i = 0; i < length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  }
  return buf;
}

function loopNoise(ctx: AudioContext, type: "white" | "pink" | "brown") {
  const src = ctx.createBufferSource();
  src.buffer = createNoiseBuffer(ctx, type);
  src.loop = true;
  src.start();
  return src;
}

function buildSound(ctx: AudioContext, master: GainNode, id: string): EngineState {
  const nodes: AudioNode[] = [];
  const rafIds: number[] = [];
  const intervalIds: number[] = [];

  const connect = (src: AudioNode, ...chain: AudioNode[]) => {
    let prev: AudioNode = src;
    chain.forEach((n) => {
      prev.connect(n);
      prev = n;
    });
    prev.connect(master);
    nodes.push(src, ...chain);
  };

  if (id === "rain") {
    const noise = loopNoise(ctx, "white");
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 1000;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 6000;
    const g = ctx.createGain(); g.gain.value = 0.6;
    connect(noise, hp, lp, g);
  } else if (id === "water") {
    const noise = loopNoise(ctx, "pink");
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1200; bp.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.value = 0.5;
    // gentle modulation
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.4;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 400;
    lfo.connect(lfoGain); lfoGain.connect(bp.frequency); lfo.start();
    nodes.push(lfo, lfoGain);
    connect(noise, bp, g);
  } else if (id === "birds") {
    // background forest + chirps
    const noise = loopNoise(ctx, "pink");
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2000;
    const bgGain = ctx.createGain(); bgGain.gain.value = 0.15;
    connect(noise, lp, bgGain);

    const chirp = () => {
      if (!engine) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const base = 1800 + Math.random() * 1800;
      o.frequency.setValueAtTime(base, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(base * (1.4 + Math.random()), ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      o.connect(g); g.connect(master);
      o.start(); o.stop(ctx.currentTime + 0.22);
    };
    intervalIds.push(window.setInterval(chirp, 700 + Math.random() * 800));
  } else if (id === "cafe") {
    const noise = loopNoise(ctx, "brown");
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 600; bp.Q.value = 0.5;
    const g = ctx.createGain(); g.gain.value = 0.7;
    connect(noise, bp, g);
    // occasional clinks
    const clink = () => {
      if (!engine) return;
      const o = ctx.createOscillator();
      const gg = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = 1800 + Math.random() * 800;
      gg.gain.setValueAtTime(0.001, ctx.currentTime);
      gg.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.005);
      gg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.connect(gg); gg.connect(master);
      o.start(); o.stop(ctx.currentTime + 0.3);
    };
    intervalIds.push(window.setInterval(clink, 4000 + Math.random() * 3000));
  } else if (id === "ocean") {
    const noise = loopNoise(ctx, "brown");
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 800;
    const g = ctx.createGain(); g.gain.value = 0.0;
    connect(noise, lp, g);
    // wave envelope
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.1;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.5;
    const offset = ctx.createConstantSource(); offset.offset.value = 0.5; offset.start();
    lfo.connect(lfoGain); lfoGain.connect(g.gain); offset.connect(g.gain); lfo.start();
    nodes.push(lfo, lfoGain, offset);
  } else if (id === "fire") {
    const noise = loopNoise(ctx, "pink");
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1500;
    const g = ctx.createGain(); g.gain.value = 0.5;
    connect(noise, lp, g);
    // crackles
    const crackle = () => {
      if (!engine) return;
      const o = ctx.createOscillator();
      const gg = ctx.createGain();
      o.type = "square";
      o.frequency.value = 60 + Math.random() * 200;
      gg.gain.setValueAtTime(0, ctx.currentTime);
      gg.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.08, ctx.currentTime + 0.005);
      gg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
      o.connect(gg); gg.connect(master);
      o.start(); o.stop(ctx.currentTime + 0.08);
    };
    intervalIds.push(window.setInterval(crackle, 120 + Math.random() * 200));
  } else if (id === "wind") {
    const noise = loopNoise(ctx, "brown");
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 400; bp.Q.value = 1.2;
    const g = ctx.createGain(); g.gain.value = 0.55;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 200;
    lfo.connect(lfoGain); lfoGain.connect(bp.frequency); lfo.start();
    nodes.push(lfo, lfoGain);
    connect(noise, bp, g);
  } else {
    // fallback white noise
    const noise = loopNoise(ctx, "white");
    const g = ctx.createGain(); g.gain.value = 0.3;
    connect(noise, g);
  }

  return {
    ctx,
    master,
    nodes,
    rafIds,
    intervalIds,
    cleanup: () => {
      intervalIds.forEach((i) => clearInterval(i));
      rafIds.forEach((r) => cancelAnimationFrame(r));
      nodes.forEach((n) => {
        try {
          // @ts-expect-error stop is on source nodes only
          if (typeof n.stop === "function") n.stop();
        } catch {
          // noop
        }
        try {
          n.disconnect();
        } catch {
          // noop
        }
      });
    },
  };
}

export function playFocusSound(id: string, volume: number) {
  stopFocusSound();
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = Math.max(0, Math.min(1, volume / 100));
  master.connect(ctx.destination);
  engine = buildSound(ctx, master, id);
  currentId = id;
  notify();
}

export function setFocusVolume(volume: number) {
  if (!engine) return;
  engine.master.gain.value = Math.max(0, Math.min(1, volume / 100));
}

export function stopFocusSound() {
  if (!engine) return;
  engine.cleanup();
  engine.ctx.close().catch(() => undefined);
  engine = null;
  currentId = null;
  notify();
}
