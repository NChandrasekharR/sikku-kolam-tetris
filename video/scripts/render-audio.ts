// Renders the game's Raga Mohanam pluck synth offline, sample-accurate to the
// simulated event log, into public/sfx.wav. Mirrors RagaSoundEngine.playPluck:
// sine fundamental (8ms linear attack, exponential decay to 1e-4) plus an
// optional band-limited triangle an octave up at 25% (5ms attack, 0.6x decay).
//
// Usage: npx tsx scripts/render-audio.ts

import fs from "fs";
import path from "path";
import { END_AFTER_CLEARS, SEED } from "../src/game/config";
import { buildTimeline } from "../src/game/timeline";

const SR = 48000;
const S = {
  Sa3: 130.81,
  Pa3: 196.0,
  Sa4: 261.63,
  Re4: 293.66,
  Ga4: 329.63,
  Pa4: 392.0,
  Dha4: 440.0,
  Sa5: 523.25,
  Ga5: 659.25,
};

const tl = buildTimeline(SEED, END_AFTER_CLEARS);
const totalSec = tl.totalFrames / 60;
const buf = new Float64Array(Math.ceil(totalSec * SR) + SR);

// Web Audio envelope: setValueAtTime(1e-4, t0) -> linearRamp(peak, t0+atk)
// -> exponentialRamp(1e-4, t0+dur), held at 1e-4 until the oscillator stops
const env = (t: number, peak: number, atk: number, dur: number) => {
  if (t < atk) return 1e-4 + (peak - 1e-4) * (t / atk);
  if (t < dur) return peak * Math.pow(1e-4 / peak, (t - atk) / (dur - atk));
  return 1e-4;
};

const triangle = (phase: number, f: number) => {
  // Fourier series of Web Audio's triangle, band-limited below Nyquist
  let v = 0;
  for (let k = 1; k * f < SR / 2; k += 2) {
    v += (((k - 1) / 2) % 2 === 0 ? 1 : -1) * Math.sin(k * phase) / (k * k);
  }
  return (8 / (Math.PI * Math.PI)) * v;
};

const pluck = (t0: number, freq: number, duration = 0.18, volume = 0.07, harmonic = true) => {
  const start = Math.round(t0 * SR);
  const n1 = Math.ceil((duration + 0.02) * SR);
  for (let i = 0; i < n1; i++) {
    const t = i / SR;
    buf[start + i] += Math.sin(2 * Math.PI * freq * t) * env(t, volume, 0.008, duration);
  }
  if (harmonic) {
    const f2 = freq * 2;
    const n2 = Math.ceil(duration * SR);
    for (let i = 0; i < n2; i++) {
      const t = i / SR;
      buf[start + i] += triangle(2 * Math.PI * f2 * t, f2) * env(t, volume * 0.25, 0.005, duration * 0.6);
    }
  }
};

const PHRASE = [S.Sa4, S.Re4, S.Ga4, S.Pa4, S.Dha4, S.Sa5, S.Ga5];

for (const ev of tl.sounds) {
  const t = ev.time;
  switch (ev.kind) {
    case "move":
      pluck(t, S.Sa4, 0.08, 0.04, false);
      break;
    case "rotate":
      pluck(t, S.Ga4, 0.14, 0.055, true);
      break;
    case "softDrop":
      pluck(t, S.Re4, 0.06, 0.03, false);
      break;
    case "lock":
      pluck(t, S.Pa3, 0.16, 0.065, true);
      break;
    case "hardDrop":
      pluck(t, S.Sa4, 0.18, 0.08, true);
      pluck(t + 0.03, S.Sa3, 0.24, 0.08, false);
      break;
    case "hold":
      pluck(t, S.Pa4, 0.12, 0.05, false);
      pluck(t + 0.055, S.Ga4, 0.15, 0.05, false);
      break;
    case "clear": {
      const n = Math.min(PHRASE.length, (ev.count ?? 1) + 3);
      for (let i = 0; i < n; i++) pluck(t + i * 0.065, PHRASE[i], 0.42, 0.075, true);
      break;
    }
  }
}

// One uniform gain so the in-game mix plays at video loudness (peak -1 dBFS)
let peak = 0;
for (const v of buf) peak = Math.max(peak, Math.abs(v));
const gain = 0.891 / peak;

const frames = Math.ceil(totalSec * SR);
const data = Buffer.alloc(44 + frames * 4);
data.write("RIFF", 0);
data.writeUInt32LE(36 + frames * 4, 4);
data.write("WAVEfmt ", 8);
data.writeUInt32LE(16, 16);
data.writeUInt16LE(1, 20); // PCM
data.writeUInt16LE(2, 22); // stereo
data.writeUInt32LE(SR, 24);
data.writeUInt32LE(SR * 4, 28);
data.writeUInt16LE(4, 32);
data.writeUInt16LE(16, 34);
data.write("data", 36);
data.writeUInt32LE(frames * 4, 40);
for (let i = 0; i < frames; i++) {
  const s = Math.max(-1, Math.min(1, buf[i] * gain));
  const v = Math.round(s * 32767);
  data.writeInt16LE(v, 44 + i * 4);
  data.writeInt16LE(v, 44 + i * 4 + 2);
}
const out = path.join(__dirname, "..", "public", "sfx.wav");
fs.writeFileSync(out, data);
console.log(
  `wrote ${out}: ${totalSec.toFixed(2)}s, ${tl.sounds.length} events, raw peak ${peak.toFixed(3)}, gain x${gain.toFixed(2)} (+${(20 * Math.log10(gain)).toFixed(1)} dB)`,
);
