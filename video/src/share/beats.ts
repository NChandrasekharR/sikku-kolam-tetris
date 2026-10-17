// Beat sheet for "Your kolam travels" (60fps). Every scene and the audio
// renderer read their timings from here, so picture and sound stay locked.

import { CLEAR_PHRASE, NOTE, Pluck, gamePlucks, pluck } from "../audio/plucks";
import { GAME_START, type Timeline } from "../game/timeline";
import { buildEndgame } from "./endgame";

export const FPS = 60;
export const endgame = buildEndgame(30);

// --- 1. The game ends ---
export const GAME_OVER = endgame.topOutFrame;
export const CARD_IN = GAME_OVER + 4; // overlay fades in over 0.32s
export const TAP_SHARE = GAME_OVER + 66;

// --- 2. Pull back to the phone; the share text pops out ---
export const PULL_START = TAP_SHARE + 22;
export const PULL_END = PULL_START + 70;
export const BUBBLE_IN = PULL_END - 12;
export const BUBBLE_FOLD = BUBBLE_IN + 150;
export const NOTE_LAND = BUBBLE_FOLD + 40;

// --- 3. The ant courier ---
export const ANT_ENTER = NOTE_LAND - 50;
export const ANT_AT_NOTE = NOTE_LAND + 40;
export const PICKUP_END = ANT_AT_NOTE + 30;
export const ANT_ARRIVE = PICKUP_END + 260;
export const CAPTION_IN = NOTE_LAND + 15;
export const CAPTION_OUT = ANT_ARRIVE - 30;

// --- 4. Paati gets it ---
export const NOTE_FLY = ANT_ARRIVE + 10;
export const PING = NOTE_FLY + 30;
export const CHAT_IN = PING + 2;
export const TAP_LINK = CHAT_IN + 85;
export const GAME_IN = TAP_LINK + 20;
// Paati's game is the gameplay video's own run, sped up: press Start, then on
// to its first Tetris (source frame 600)
export const PAATI_MAP_IN = [GAME_IN, GAME_IN + 40, GAME_IN + 80, GAME_IN + 200];
export const PAATI_MAP_SRC = [80, 120, 330, 640];

// --- 5. Pass it on ---
export const ZOOM_START = GAME_IN + 220;
export const ZOOM_END = ZOOM_START + 90;
export const COLLAPSE_END = ZOOM_END + 30;
export const BLOOM_START = COLLAPSE_END - 4;
export const RING_GAP = 11;
export const TITLE_IN = BLOOM_START + 100;
export const ANTS_MARCH = TITLE_IN + 30;
export const DURATION = TITLE_IN + 200;

// World layout (px at zoom 1). Phones stand on the floor.
export const PHONE_SCALE = 0.42;
export const FLOOR_Y = 1560;
export const MY_PHONE_X = 540;
export const PAATI_PHONE_X = 2140;
export const PHONE_Y = 1132; // centre: bottom edge sits on the floor
export const ANT_Y = 1712; // ground line the ant walks on
export const NOTE_X = 660;
export const ANT_STOP_X = 1830;

// The kolam the share network weaves: a 1-3-5-7-9-7-5-3-1 diamond whose two
// middle dots are where the phones collapse
export const NET_CELL = 100;
export const NET_ROWS = [1, 3, 5, 7, 9, 7, 5, 3, 1];
export const NET_TOP = 450;
export const NET_LEFT = 90;
export const NET_SEEDS: [number, number][] = [
  [4, 2],
  [4, 6],
];
export const netCenter = (r: number, c: number) => ({
  x: NET_LEFT + NET_CELL * (c + 0.5),
  y: NET_TOP + NET_CELL * (r + 0.5),
});

export type NetCell = { r: number; c: number; ring: number; at: number };

export const NET_CELLS: NetCell[] = (() => {
  const cells: [number, number][] = [];
  NET_ROWS.forEach((w, r) => {
    for (let c = 4 - (w - 1) / 2; c <= 4 + (w - 1) / 2; c++) cells.push([r, c]);
  });
  const has = (r: number, c: number) => cells.some(([a, b]) => a === r && b === c);
  // BFS outward from both seeds: the share spreading friend to friend
  const ring = new Map<string, number>(NET_SEEDS.map(([r, c]) => [`${r},${c}`, 0]));
  const queue = [...NET_SEEDS];
  while (queue.length) {
    const [r, c] = queue.shift()!;
    const d = ring.get(`${r},${c}`)!;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const k = `${r + dr},${c + dc}`;
      if (has(r + dr, c + dc) && !ring.has(k)) {
        ring.set(k, d + 1);
        queue.push([r + dr, c + dc]);
      }
    }
  }
  return cells.map(([r, c]) => {
    const d = ring.get(`${r},${c}`)!;
    const jitter = (r * 7 + c * 3) % 4;
    return { r, c, ring: d, at: BLOOM_START + d * RING_GAP + (d === 0 ? 0 : jitter) };
  });
})();

export const shareLines = () => [
  `I scored ${endgame.score.toLocaleString("en-US")} in Sikku Kolam Tetris ᯽`,
  `${endgame.lines} lines · level ${endgame.level}`,
  "Try it here: kolam-tetris.vercel.app",
];

// Trail dots the ant leaves: one every TRAIL_STEP px after the pickup
export const TRAIL_STEP = 84;
export const ANT_PICKUP_X = NOTE_X - 40;
export const antX = (frame: number) => {
  if (frame < ANT_AT_NOTE) {
    const t = Math.max(0, (frame - ANT_ENTER) / (ANT_AT_NOTE - ANT_ENTER));
    return -240 + (ANT_PICKUP_X + 240) * (1 - (1 - t) * (1 - t));
  }
  if (frame < PICKUP_END) return ANT_PICKUP_X;
  const t = Math.min(1, (frame - PICKUP_END) / (ANT_ARRIVE - PICKUP_END));
  // ease in and out of the walk so the camera can follow smoothly
  const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return ANT_PICKUP_X + (ANT_STOP_X - ANT_PICKUP_X) * e;
};
// Camera x offset: locked to the ant, then settling on Paati's phone
export const camOffset = (frame: number) => {
  if (frame < PICKUP_END) return 0;
  const settle = PAATI_PHONE_X - MY_PHONE_X;
  const follow = antX(frame) - ANT_PICKUP_X;
  const w = Math.min(1, Math.max(0, (frame - (ANT_ARRIVE - 100)) / 120));
  const ws = w * w * (3 - 2 * w);
  return follow + ws * (settle - (ANT_STOP_X - ANT_PICKUP_X));
};
export const TRAIL_DOTS = (() => {
  const dots: { x: number; at: number }[] = [];
  let next = NOTE_X + 20;
  for (let f = PICKUP_END; f <= ANT_ARRIVE; f++) {
    const x = antX(f);
    // dot is dropped under the ant's abdomen as it passes
    while (x - 50 >= next && next < ANT_STOP_X - 60) {
      dots.push({ x: next, at: f });
      next += TRAIL_STEP;
    }
  }
  return dots;
})();

const TRAIL_TUNE = [NOTE.Sa4, NOTE.Re4, NOTE.Ga4, NOTE.Pa4, NOTE.Dha4, NOTE.Pa4, NOTE.Ga4, NOTE.Re4];
const RING_TUNE = [NOTE.Sa4, NOTE.Re4, NOTE.Ga4, NOTE.Pa4, NOTE.Dha4, NOTE.Sa5, NOTE.Re5, NOTE.Ga5];

// Paati's source frame for a story frame (monotonic, sped-up montage)
export const paatiSourceFrame = (frame: number) => {
  const xs = PAATI_MAP_IN;
  const ys = PAATI_MAP_SRC;
  if (frame <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (frame <= xs[i]) return ys[i - 1] + ((frame - xs[i - 1]) / (xs[i] - xs[i - 1])) * (ys[i] - ys[i - 1]);
  }
  return ys[ys.length - 1];
};
const paatiStoryFrame = (src: number) => {
  for (let i = 1; i < PAATI_MAP_SRC.length; i++) {
    if (src <= PAATI_MAP_SRC[i]) {
      const a = PAATI_MAP_SRC[i - 1];
      const b = PAATI_MAP_SRC[i];
      return PAATI_MAP_IN[i - 1] + ((src - a) / (b - a)) * (PAATI_MAP_IN[i] - PAATI_MAP_IN[i - 1]);
    }
  }
  return PAATI_MAP_IN[PAATI_MAP_IN.length - 1];
};

export const PAATI_TETRIS_FRAME = (main: Timeline) => {
  const c = main.run.clears[0];
  return Math.round(paatiStoryFrame(c.frame + GAME_START));
};

// Everything the story plays, in the game's own synth
export const shareStoryPlucks = (main: Timeline): Pluck[] => {
  const s = (f: number) => f / FPS;
  const out: Pluck[] = [];
  // 1. the game's own sounds, then its game-over phrase
  for (const ev of endgame.sounds) out.push(...gamePlucks(ev.kind, s(ev.frame), ev.count ?? 1));
  out.push(...gamePlucks("gameOver", s(GAME_OVER)));
  out.push(...gamePlucks("rotate", s(TAP_SHARE)));
  // 2. bubble pops out, folds, lands
  out.push(...gamePlucks("hold", s(BUBBLE_IN)));
  out.push(...gamePlucks("move", s(BUBBLE_FOLD)));
  out.push(...gamePlucks("lock", s(NOTE_LAND)));
  // 3. pickup, then a little walking tune, one note per rice-flour dot
  out.push(...gamePlucks("hold", s(ANT_AT_NOTE + 8)));
  TRAIL_DOTS.forEach((d, i) => out.push(pluck(s(d.at), TRAIL_TUNE[i % TRAIL_TUNE.length], 0.24, 0.04, true)));
  // 4. delivery ping, chat, tap, Paati's Start and her Tetris
  out.push(...gamePlucks("rotate", s(NOTE_FLY)));
  out.push(pluck(s(PING), NOTE.Ga5, 0.3, 0.06, true), pluck(s(PING) + 0.09, NOTE.Sa5, 0.36, 0.06, true));
  out.push(...gamePlucks("move", s(CHAT_IN)));
  out.push(...gamePlucks("rotate", s(TAP_LINK)));
  out.push(...gamePlucks("rotate", s(paatiStoryFrame(120))));
  for (const ev of main.sounds) {
    const src = Math.round(ev.time * FPS);
    if (src < 330 || src > 640 || (ev.kind !== "hardDrop" && ev.kind !== "clear")) continue;
    out.push(...gamePlucks(ev.kind, s(paatiStoryFrame(src)), ev.count ?? 1));
  }
  out.push(...gamePlucks("hold", s(PAATI_TETRIS_FRAME(main) + 6)));
  // 5. phones become dots, the kolam blooms ring by ring, then the title
  out.push(pluck(s(COLLAPSE_END - 6), NOTE.Sa5, 0.3, 0.05, true));
  const rings = Math.max(...NET_CELLS.map((c) => c.ring));
  for (let d = 0; d <= rings; d++) {
    out.push(pluck(s(BLOOM_START + d * RING_GAP), RING_TUNE[Math.min(d, RING_TUNE.length - 1)], 0.5, 0.055, true));
  }
  CLEAR_PHRASE.forEach((f, i) => out.push(pluck(s(TITLE_IN) + i * 0.065, f, 0.42, 0.075, true)));
  return out.sort((a, b) => a.t - b.t);
};
