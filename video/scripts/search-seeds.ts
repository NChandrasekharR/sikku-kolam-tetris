// Finds seeds where the bot plays clean and the game can end on a Tetris
// ~37-41s into gameplay. Usage: npx tsx scripts/search-seeds.ts [from] [to]
import { simulateGame } from "../src/game/timeline";

const from = Number(process.argv[2] ?? 1);
const to = Number(process.argv[3] ?? 200);
const rows: string[] = [];
const t0 = Date.now();
for (let seed = from; seed <= to; seed++) {
  const run = simulateGame(seed, Infinity, 60 * 45);
  if (run.toppedOut) continue;
  run.clears.forEach((c, i) => {
    if (c.count !== 4 || c.frame < 2160 || c.frame > 2460) return;
    const before = run.clears.slice(0, i + 1);
    const tetrises = before.filter((x) => x.count === 4).length;
    const others = before.length - tetrises;
    const after = run.snapshots[Math.min(run.snapshots.length - 1, c.frame + 27)];
    const cells = after.grid.flat().filter(Boolean).length;
    // holes up to this point
    rows.push(`${seed}\tclearIdx=${i + 1}\tframe=${c.frame} (${(c.frame / 60).toFixed(1)}s)\ttetris=${tetrises}\tothers=${others}\tleft=${cells}\tmaxHoles=${run.maxHoles}\tclears=${before.map((x) => x.count).join("")}`);
  });
}
console.log(rows.join("\n"));
console.error(`searched ${to - from + 1} seeds in ${Date.now() - t0}ms`);
