// Pre-simulates the whole video once: intro (start screen + mandala dissolve),
// the bot-played game, and the held/faded ending. Every frame of the video is
// then a pure lookup into this data.

import { Bot } from "./bot";
import { CLEAR_ANIM_DURATION, COLS, DT, PALETTE, PieceType, RICE_FLOUR_HEX } from "./constants";
import { Engine, Grid, ParticleSpawn, Snapshot, SoundEvent, createEmptyGrid } from "./engine";
import { createRng } from "./rng";

// Intro / outro beats, in frames at 60fps
export const HOVER_START = 96; // Start button eases into its hover state
export const PRESS = 120; // Start pressed: overlay fades out (320ms)
export const OVERLAY_FADE = Math.round(320 / DT);
export const DISSOLVE_START = 160; // seeded mandala dissolves like a line clear
export const DISSOLVE_FRAMES = Math.ceil(CLEAR_ANIM_DURATION / DT);
export const GAME_START = 192;
export const END_HOLD = 66;
export const END_FADE = 72;

// seedInitialSikkuMandala() from the original
const MANDALA: [number, number, PieceType, number][] = [
  [12, 4, "O", 101],
  [13, 3, "O", 101], [13, 4, "O", 101], [13, 5, "O", 101],
  [14, 2, "O", 101], [14, 3, "O", 101], [14, 4, "O", 101], [14, 5, "O", 101], [14, 6, "O", 101],
  [15, 3, "O", 101], [15, 4, "O", 101], [15, 5, "O", 101],
  [16, 4, "O", 101],
  [19, 0, "T", 102], [19, 1, "T", 102], [19, 2, "T", 102], [18, 1, "T", 102],
  [19, 6, "S", 103], [19, 7, "S", 103], [18, 7, "S", 103], [18, 8, "S", 103],
  [17, 0, "I", 104], [16, 0, "I", 104], [15, 0, "I", 104], [14, 0, "I", 104],
  [19, 3, "J", 105], [19, 4, "J", 105], [19, 5, "J", 105], [18, 3, "J", 105],
];

const mandalaGrid = (): Grid => {
  const g = createEmptyGrid();
  for (const [r, c, t, gid] of MANDALA) g[r][c] = { color: PALETTE[t], type: t, groupId: gid };
  return g;
};

export type GameRun = {
  snapshots: Snapshot[];
  sounds: SoundEvent[];
  particles: ParticleSpawn[];
  clears: { frame: number; count: number }[];
  toppedOut: boolean;
  maxHoles: number;
};

const countHoles = (grid: Grid) => {
  let holes = 0;
  for (let c = 0; c < COLS; c++) {
    let seen = false;
    for (let r = 0; r < grid.length; r++) {
      if (grid[r][c] !== null) seen = true;
      else if (seen) holes++;
    }
  }
  return holes;
};

export const simulateGame = (seed: number, endAfterClears: number, maxFrames: number): GameRun => {
  const engine = new Engine(createRng(seed), createRng(seed ^ 0x9e3779b9));
  const bot = new Bot(createRng(seed * 7 + 1));
  engine.endAfterClears = endAfterClears;
  engine.frame = 0;
  engine.startNewGame();
  const snapshots: Snapshot[] = [];
  let maxHoles = 0;
  for (let k = 0; k < maxFrames; k++) {
    engine.frame = k;
    bot.tick(engine);
    engine.update();
    snapshots.push(engine.snapshot());
    maxHoles = Math.max(maxHoles, countHoles(engine.grid));
    if (engine.state === "ENDED") break;
  }
  return {
    snapshots,
    sounds: engine.sounds,
    particles: engine.particles,
    clears: engine.clears,
    toppedOut: engine.toppedOut,
    maxHoles,
  };
};

export type Timeline = {
  totalFrames: number;
  gameEnd: number; // video frame of the final game snapshot
  introGrid: Grid;
  run: GameRun;
  sounds: { time: number; kind: SoundEvent["kind"]; count?: number }[];
  particles: ParticleSpawn[]; // frames are video frames
};

export const buildTimeline = (seed: number, endAfterClears: number): Timeline => {
  const run = simulateGame(seed, endAfterClears, 60 * 120);
  const introGrid = mandalaGrid();

  // Dissolve burst uses the same rice-flour particle recipe as a line clear
  const fx = createRng(seed ^ 0x51ed270b);
  const introParticles: ParticleSpawn[] = [];
  for (const [r, c, t] of MANDALA) {
    for (let i = 0; i < 6; i++) {
      const angle = fx() * Math.PI * 2;
      const speed = 0.45 + fx() * 2.3;
      introParticles.push({
        frame: DISSOLVE_START,
        col: c + 0.5,
        row: r + 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.35,
        size: 1.8 + fx() * 2.8,
        decay: 0.016 + fx() * 0.02,
        color: i % 2 === 0 ? RICE_FLOUR_HEX : PALETTE[t],
      });
    }
  }

  const gameEnd = GAME_START + run.snapshots.length - 1;
  return {
    totalFrames: gameEnd + 1 + END_HOLD + END_FADE,
    gameEnd,
    introGrid,
    run,
    sounds: run.sounds.map((s) => ({ ...s, time: (GAME_START + s.frame) / 60 })),
    particles: [
      ...introParticles,
      ...run.particles.map((p) => ({ ...p, frame: p.frame + GAME_START })),
    ],
  };
};
