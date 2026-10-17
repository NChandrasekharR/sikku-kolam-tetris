// Offline renderer for the pluck synth. Mirrors RagaSoundEngine.playPluck:
// sine fundamental (8ms linear attack, exponential decay to 1e-4) plus an
// optional band-limited triangle an octave up at 25% (5ms attack, 0.6x decay).

import fs from "fs";
import type { Pluck } from "../src/audio/plucks";

const SR = 48000;

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

const mix = (plucks: Pluck[], totalSec: number) => {
  const buf = new Float64Array(Math.ceil(totalSec * SR) + SR);
  for (const { t, freq, dur, vol, harmonic } of plucks) {
    const start = Math.round(t * SR);
    const n1 = Math.ceil((dur + 0.02) * SR);
    for (let i = 0; i < n1; i++) {
      const s = i / SR;
      buf[start + i] += Math.sin(2 * Math.PI * freq * s) * env(s, vol, 0.008, dur);
    }
    if (harmonic) {
      const f2 = freq * 2;
      const n2 = Math.ceil(dur * SR);
      for (let i = 0; i < n2; i++) {
        const s = i / SR;
        buf[start + i] += triangle(2 * Math.PI * f2 * s, f2) * env(s, vol * 0.25, 0.005, dur * 0.6);
      }
    }
  }
  return buf;
};

// Renders plucks to a 16-bit stereo WAV, with one uniform gain so the in-game
// mix plays at video loudness (peak -1 dBFS)
export const writePlucksWav = (plucks: Pluck[], totalSec: number, out: string) => {
  const buf = mix(plucks, totalSec);
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
  fs.writeFileSync(out, data);
  return { peak, gain };
};
