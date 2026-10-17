// Renders the gameplay video's sound effects, sample-accurate to the
// simulated event log, into public/sfx.wav.
//
// Usage: npx tsx scripts/render-audio.ts

import path from "path";
import { gamePlucks } from "../src/audio/plucks";
import { END_AFTER_CLEARS, SEED } from "../src/game/config";
import { buildTimeline } from "../src/game/timeline";
import { writePlucksWav } from "./synth";

const tl = buildTimeline(SEED, END_AFTER_CLEARS);
const totalSec = tl.totalFrames / 60;
const plucks = tl.sounds.flatMap((ev) => gamePlucks(ev.kind, ev.time, ev.count ?? 1));

const out = path.join(__dirname, "..", "public", "sfx.wav");
const { peak, gain } = writePlucksWav(plucks, totalSec, out);
console.log(
  `wrote ${out}: ${totalSec.toFixed(2)}s, ${tl.sounds.length} events, raw peak ${peak.toFixed(3)}, gain x${gain.toFixed(2)} (+${(20 * Math.log10(gain)).toFixed(1)} dB)`,
);
