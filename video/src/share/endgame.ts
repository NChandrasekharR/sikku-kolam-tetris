// Opening of the share story: the last few pieces of a long game landing on
// a tall woven stack until the next piece has no room (top-out).

import { COLS, PALETTE, PieceType, ROWS } from "../game/constants";
import { Engine, Grid, Snapshot, createEmptyGrid } from "../game/engine";
import { createRng } from "../game/rng";
import type { FrameView } from "../game/view";

const TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

// Rows STACK_TOP..19 are full except one staggered gap each, so nothing clears
const STACK_TOP = 5;

const buildStack = (): Grid => {
  const rng = createRng(2026);
  const g = createEmptyGrid();
  let gid = 500;
  for (let r = STACK_TOP; r < ROWS; r++) {
    const gap = (r * 7 + 3) % COLS;
    for (let c = 0; c < COLS; c++) {
      if (c === gap) continue;
      const t = TYPES[Math.floor(rng() * TYPES.length)];
      g[r][c] = { color: PALETTE[t], type: t, groupId: gid++ };
    }
  }
  return g;
};

// Where each remaining piece goes: rotations, then columns to shift
const PLAN = [
  { rotations: 1, shift: -4 },
  { rotations: 0, shift: 3 },
  { rotations: 0, shift: 0 },
  { rotations: 2, shift: 0 },
  { rotations: 0, shift: 0 },
];

export type Endgame = {
  snapshots: Snapshot[];
  sounds: Engine["sounds"];
  particles: Engine["particles"];
  topOutFrame: number;
  score: number;
  lines: number;
  level: number;
};

export const buildEndgame = (holdFrames: number): Endgame => {
  const engine = new Engine(createRng(41), createRng(42));
  engine.frame = 0;
  engine.startNewGame();
  engine.grid = buildStack();
  engine.score = 7120;
  engine.lines = 20;
  engine.level = 3;
  engine.holdType = "I";

  const snapshots: Snapshot[] = [];
  let piece = -1;
  let planIdx = -1;
  let next = 0;
  let rotationsLeft = 0;
  let shiftLeft = 0;
  let topOutFrame = -1;

  for (let k = 0; k < 60 * 20; k++) {
    engine.frame = k;
    const cur = engine.current;
    if (engine.state === "PLAYING" && cur) {
      if (cur.groupId !== piece) {
        piece = cur.groupId;
        planIdx = Math.min(planIdx + 1, PLAN.length - 1);
        rotationsLeft = PLAN[planIdx].rotations;
        shiftLeft = PLAN[planIdx].shift;
        next = k + 20;
      } else if (k >= next) {
        if (rotationsLeft > 0) {
          engine.rotatePiece();
          rotationsLeft--;
          next = k + 9;
        } else if (shiftLeft !== 0) {
          engine.movePiece(Math.sign(shiftLeft));
          shiftLeft -= Math.sign(shiftLeft);
          next = k + 6;
        } else {
          engine.hardDrop();
          next = k + 8;
        }
      }
    }
    engine.update();
    snapshots.push(engine.snapshot());
    if (engine.toppedOut && topOutFrame < 0) topOutFrame = k;
    if (topOutFrame >= 0 && k >= topOutFrame + holdFrames) break;
  }

  return {
    snapshots,
    sounds: engine.sounds,
    particles: engine.particles,
    topOutFrame,
    score: engine.score,
    lines: engine.lines,
    level: engine.level,
  };
};

export const endgameView = (eg: Endgame, frame: number): FrameView => {
  const s = eg.snapshots[Math.max(0, Math.min(frame, eg.snapshots.length - 1))];
  return {
    grid: s.grid,
    clearingRows: s.clearingRows,
    clearProgress: s.clearProgress,
    piece: s.piece,
    ghostY: s.ghostY,
    playing: s.state === "PLAYING",
    wave: s.state === "CLEARING" && s.clearingRows.length > 0,
    holdType: s.holdType,
    nextType: s.nextType,
    canHold: s.canHold,
    score: s.score,
    lines: s.lines,
    level: s.level,
  };
};
