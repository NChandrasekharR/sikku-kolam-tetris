// Autoplayer: picks placements with a Tetris-building heuristic (keeps the
// rightmost column open as a well) and executes them with human-paced taps.

import { COLS, PieceType, ROWS } from "./constants";
import {
  Engine,
  Grid,
  ROTATION_KICKS,
  collide,
  rotateMatrixCW,
  spawnPosition,
} from "./engine";
import { Rng } from "./rng";

const WELL = COLS - 1;

type Pose = { matrix: number[][]; x: number; y: number };

type Placement = {
  rotations: number;
  targetX: number;
  grid: Grid;
  lines: number;
};

// Mirrors Engine.rotatePiece kick logic on a detached pose
const rotatePose = (grid: Grid, pose: Pose): Pose | null => {
  const rotated = rotateMatrixCW(pose.matrix);
  for (const [ox, oy] of ROTATION_KICKS) {
    if (!collide(grid, pose, ox, oy, rotated)) {
      return { matrix: rotated, x: pose.x + ox, y: pose.y + oy };
    }
  }
  return null;
};

const placeAndClear = (grid: Grid, pose: Pose) => {
  const g = grid.map((row) => row.slice());
  for (let r = 0; r < pose.matrix.length; r++) {
    for (let c = 0; c < pose.matrix[r].length; c++) {
      if (pose.matrix[r][c]) {
        const by = pose.y + r;
        if (by < 0) return null;
        g[by][pose.x + c] = { color: "", type: "I", groupId: 0 };
      }
    }
  }
  const kept = g.filter((row) => !row.every((c) => c !== null));
  const lines = ROWS - kept.length;
  while (kept.length < ROWS) kept.unshift(Array(COLS).fill(null));
  return { grid: kept, lines };
};

const enumerate = (grid: Grid, type: PieceType, start: Pose): Placement[] => {
  const out: Placement[] = [];
  const maxRot = type === "O" ? 1 : 4;
  let pose: Pose | null = start;
  for (let rot = 0; rot < maxRot && pose; rot++) {
    if (rot > 0) pose = rotatePose(grid, pose);
    if (!pose) break;
    for (let tx = -3; tx < COLS; tx++) {
      // walk laterally at the current height, as the executor will
      const dir = Math.sign(tx - pose.x);
      let x = pose.x;
      let ok = true;
      while (x !== tx) {
        if (collide(grid, { ...pose, x }, dir, 0)) {
          ok = false;
          break;
        }
        x += dir;
      }
      if (!ok) continue;
      let y = pose.y;
      const at = { matrix: pose.matrix, x: tx, y };
      if (collide(grid, at, 0, 0)) continue;
      while (!collide(grid, { ...at, y }, 0, 1)) y++;
      const res = placeAndClear(grid, { matrix: pose.matrix, x: tx, y });
      if (!res) continue;
      out.push({ rotations: rot, targetX: tx, grid: res.grid, lines: res.lines });
    }
  }
  return out;
};

const heights = (grid: Grid) => {
  const h: number[] = [];
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS && grid[r][c] === null) r++;
    h.push(ROWS - r);
  }
  return h;
};

const evalBoard = (grid: Grid) => {
  const h = heights(grid);
  let holes = 0;
  for (let c = 0; c < COLS; c++) {
    let seen = false;
    for (let r = 0; r < ROWS; r++) {
      if (grid[r][c] !== null) seen = true;
      else if (seen) holes++;
    }
  }
  let bump = 0;
  for (let c = 0; c < WELL - 1; c++) bump += Math.abs(h[c] - h[c + 1]);
  let agg = 0;
  let maxH = 0;
  for (let c = 0; c < WELL; c++) {
    agg += h[c];
    maxH = Math.max(maxH, h[c]);
  }
  // Narrow pits outside the well can only be filled by an I
  let pits = 0;
  for (let c = 0; c < WELL; c++) {
    const left = c === 0 ? Infinity : h[c - 1];
    const right = c === WELL - 1 ? Infinity : h[c + 1];
    const depth = Math.min(left, right) - h[c];
    if (depth >= 3) pits += depth - 2;
  }
  return (
    -60 * holes -
    3 * bump -
    1 * agg -
    40 * h[WELL] -
    25 * pits -
    (maxH > 11 ? (maxH - 11) * 30 : 0)
  );
};

const lineReward = (lines: number, grid: Grid) => {
  if (lines === 0) return 0;
  if (lines === 4) return 900;
  const maxH = Math.max(...heights(grid));
  return maxH >= 10 ? 60 * lines : -70 * lines;
};

// Best placement reachable from a pose, valued with one-piece lookahead
const bestFrom = (grid: Grid, type: PieceType, pose: Pose, nextType: PieceType | null) => {
  let best = -Infinity;
  let bestPlacement: Placement | null = null;
  for (const p of enumerate(grid, type, pose)) {
    let v = lineReward(p.lines, p.grid);
    if (nextType) {
      let bestNext = -Infinity;
      for (const q of enumerate(p.grid, nextType, spawnPosition(nextType))) {
        bestNext = Math.max(bestNext, lineReward(q.lines, q.grid) + evalBoard(q.grid));
      }
      v += bestNext === -Infinity ? -5000 : bestNext;
    } else {
      v += evalBoard(p.grid);
    }
    if (v > best) {
      best = v;
      bestPlacement = p;
    }
  }
  return { value: best, placement: bestPlacement };
};

type Plan = {
  rotationsLeft: number;
  targetX: number;
  overshoot: number; // extra column to overshoot before correcting (0 = none)
  softDrop: boolean;
  dropping: boolean;
};

export class Bot {
  private pieceId = -1;
  private plan: Plan | null = null;
  private nextAction = 0;
  private holdsUsed = 0;

  constructor(private rng: Rng) {}

  private between(a: number, b: number) {
    return a + Math.floor(this.rng() * (b - a + 1));
  }

  private makePlan(e: Engine): Plan | "hold" {
    const cur = e.current!;
    const pose = { matrix: cur.matrix, x: cur.x, y: cur.y };
    const now = bestFrom(e.grid, cur.type, pose, e.nextType);

    if (e.canHold) {
      const altType = e.holdType ?? e.nextType;
      if (altType && altType !== cur.type) {
        const alt = bestFrom(e.grid, altType, spawnPosition(altType), e.holdType ? e.nextType : null);
        const cmp = e.holdType ? now.value : bestFrom(e.grid, cur.type, pose, null).value;
        if (alt.value > cmp + 120) {
          this.holdsUsed++;
          return "hold";
        }
      }
    }

    const p = now.placement;
    if (!p) return { rotationsLeft: 0, targetX: cur.x, overshoot: 0, softDrop: false, dropping: false };
    const dist = Math.abs(p.targetX - cur.x);
    return {
      rotationsLeft: p.rotations,
      targetX: p.targetX,
      overshoot: dist >= 2 && this.rng() < 0.08 ? Math.sign(p.targetX - cur.x) : 0,
      softDrop: this.rng() < 0.08,
      dropping: false,
    };
  }

  tick(e: Engine) {
    const f = e.frame;
    if (e.state !== "PLAYING" || !e.current) return;

    if (e.current.groupId !== this.pieceId) {
      const fromHold = !e.canHold;
      this.pieceId = e.current.groupId;
      this.plan = null;
      this.nextAction = f + (fromHold ? this.between(7, 11) : this.between(11, 19));
      return;
    }
    if (f < this.nextAction) return;

    if (!this.plan) {
      const plan = this.makePlan(e);
      if (plan === "hold") {
        e.holdPiece();
        return;
      }
      this.plan = plan;
    }
    const plan = this.plan;
    const cur = e.current;

    if (plan.dropping) {
      e.softDrop();
      this.nextAction = f + 3;
      return;
    }
    if (plan.rotationsLeft > 0) {
      if (!e.rotatePiece()) this.plan = null; // blocked: re-plan from here
      else plan.rotationsLeft--;
      this.nextAction = f + this.between(6, 9);
      return;
    }
    const goal = plan.targetX + plan.overshoot;
    if (cur.x !== goal) {
      const moved = e.movePiece(Math.sign(goal - cur.x));
      if (!moved) {
        if (plan.overshoot) plan.overshoot = 0;
        else plan.targetX = cur.x;
      }
      this.nextAction = f + this.between(4, 6);
      return;
    }
    if (plan.overshoot) {
      plan.overshoot = 0;
      this.nextAction = f + this.between(7, 10);
      return;
    }
    if (plan.softDrop) {
      plan.dropping = true;
      e.softDrop();
      this.nextAction = f + 9;
      return;
    }
    e.hardDrop();
  }
}
