// Generate ambient sounds with the Web Audio API — no asset downloads required.
// Three loops: rain, white noise, forest hum.

export type AmbientKind = "off" | "rain" | "white" | "forest";

let ctx: AudioContext | null = null;
let source: AudioBufferSourceNode | null = null;
let gain: GainNode | null = null;
let current: AmbientKind = "off";

function getCtx(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

function makeNoiseBuffer(seconds = 4): AudioBuffer {
  const c = getCtx();
  const len = c.sampleRate * seconds;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function shapeFilter(node: AudioNode, kind: AmbientKind): AudioNode {
  const c = getCtx();
  const filter = c.createBiquadFilter();
  if (kind === "rain") {
    filter.type = "highpass";
    filter.frequency.value = 1200;
  } else if (kind === "forest") {
    filter.type = "lowpass";
    filter.frequency.value = 600;
  } else {
    filter.type = "lowpass";
    filter.frequency.value = 8000;
  }
  node.connect(filter);
  return filter;
}

export function play(kind: AmbientKind, volume = 0.25) {
  stop();
  if (kind === "off") return;
  const c = getCtx();
  if (c.state === "suspended") c.resume();
  const buf = makeNoiseBuffer(kind === "rain" ? 6 : 4);
  source = c.createBufferSource();
  source.buffer = buf;
  source.loop = true;
  gain = c.createGain();
  gain.gain.value = volume;
  const shaped = shapeFilter(source, kind);
  shaped.connect(gain).connect(c.destination);
  source.start();
  current = kind;
}

export function stop() {
  try { source?.stop(); } catch { /* ignore */ }
  source?.disconnect();
  gain?.disconnect();
  source = null;
  gain = null;
  current = "off";
}

export function setVolume(v: number) {
  if (gain) gain.gain.value = Math.max(0, Math.min(1, v));
}

export function getCurrent(): AmbientKind {
  return current;
}
