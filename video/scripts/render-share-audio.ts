// Renders the share story's sound into public/share-sfx.wav, using the same
// pluck synth and the beat sheet the composition animates from.
//
// Usage: npx tsx scripts/render-share-audio.ts

import path from "path";
import { END_AFTER_CLEARS, SEED } from "../src/game/config";
import { buildTimeline } from "../src/game/timeline";
import { DURATION, FPS, shareStoryPlucks } from "../src/share/beats";
import { writePlucksWav } from "./synth";

const main = buildTimeline(SEED, END_AFTER_CLEARS);
const plucks = shareStoryPlucks(main);
const totalSec = DURATION / FPS;
const out = path.join(__dirname, "..", "public", "share-sfx.wav");
const { peak, gain } = writePlucksWav(plucks, totalSec, out);
console.log(`wrote ${out}: ${totalSec.toFixed(2)}s, ${plucks.length} plucks, raw peak ${peak.toFixed(3)}, gain x${gain.toFixed(2)}`);
