// Deterministic port of the game core from kolam_polka_dot_tetris.html.
// Rules, constants, kicks, scoring and timing are unchanged; Math.random is
// replaced by seeded streams and the rAF clock by a fixed 60fps step.

import {
  CLEAR_ANIM_DURATION,
  COLS,
  DT,
  PALETTE,
  PieceType,
  RICE_FLOUR_HEX,
  ROWS,
  SHAPES,
  getDropInterval,
} from "./constants";
import { Rng } from "./rng";

export type Cell = { color: string; type: PieceType; groupId: number } | null;
export type Grid = Cell[][];

export type Piece = {
  type: PieceType;
  color: string;
  groupId: number;
  matrix: number[][];
  x: number;
  y: number;
};

export type GameState = "PLAYING" | "CLEARING" | "ENDED";

export type SoundKind =
  | "move"
  | "rotate"
  | "softDrop"
  | "lock"
  | "hardDrop"
  | "hold"
  | "clear";

export type SoundEvent = { frame: number; kind: SoundKind; count?: number };

// Particle positions are stored in board-cell units so the renderer owns layout
export type ParticleSpawn = {
  frame: number;
  col: number;
  row: number;
  vx: number;
  vy: number;
  size: number;
  decay: number;
  color: string;
};

export type ClearEvent = { frame: number; count: number };

export const createEmptyGrid = (): Grid =>
  Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));

export const collide = (
  board: Grid,
  piece: { x: number; y: number; matrix: number[][] },
  offsetX = 0,
  offsetY = 0,
  customMatrix: number[][] | null = null,
) => {
  const m = customMatrix || piece.matrix;
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (m[r][c] !== 0) {
        const nx = piece.x + c + offsetX;
        const ny = piece.y + r + offsetY;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx] !== null) return true;
      }
    }
  }
  return false;
};

export const rotateMatrixCW = (matrix: number[][]) => {
  const N = matrix.length;
  const res = Array.from({ length: N }, () => Array(N).fill(0));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      res[c][N - 1 - r] = matrix[r][c];
    }
  }
  return res;
};

export const ROTATION_KICKS = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [0, -1],
  [-2, 0],
  [2, 0],
  [-1, -1],
  [1, -1],
];

export const spawnPosition = (type: PieceType) => {
  const matrix = SHAPES[type].map((row) => [...row]);
  return {
    matrix,
    x: Math.floor((COLS - matrix[0].length) / 2),
    y: type === "I" ? -1 : 0,
  };
};

export type Snapshot = {
  grid: Grid;
  piece: Piece | null;
  ghostY: number;
  holdType: PieceType | null;
  nextType: PieceType | null;
  canHold: boolean;
  score: number;
  lines: number;
  level: number;
  state: GameState;
  clearingRows: number[];
  clearProgress: number;
};

export class Engine {
  grid: Grid = createEmptyGrid();
  bag: PieceType[] = [];
  current: Piece | null = null;
  nextType: PieceType | null = null;
  holdType: PieceType | null = null;
  canHold = true;
  groupCounter = 1;
  score = 0;
  lines = 0;
  level = 1;
  state: GameState = "PLAYING";
  dropCounter = 0;
  clearingRows: number[] = [];
  clearProgress = 0;
  frame = 0;
  toppedOut = false;

  sounds: SoundEvent[] = [];
  particles: ParticleSpawn[] = [];
  clears: ClearEvent[] = [];

  // End the run once this many line-clear events have completed
  endAfterClears = Infinity;

  constructor(
    private bagRng: Rng,
    private fxRng: Rng,
  ) {}

  private sound(kind: SoundKind, count?: number) {
    this.sounds.push({ frame: this.frame, kind, count });
  }

  getNextFromBag(): PieceType {
    if (this.bag.length === 0) {
      this.bag = ["I", "O", "T", "S", "Z", "J", "L"];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.bagRng() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }

  createPiece(type: PieceType): Piece {
    const { matrix, x, y } = spawnPosition(type);
    return { type, color: PALETTE[type], groupId: ++this.groupCounter, matrix, x, y };
  }

  startNewGame() {
    this.grid = createEmptyGrid();
    this.bag = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.holdType = null;
    this.nextType = this.getNextFromBag();
    this.state = "PLAYING";
    this.spawnNextPiece();
    this.dropCounter = 0;
  }

  spawnNextPiece() {
    const type = this.nextType || this.getNextFromBag();
    this.nextType = this.getNextFromBag();
    this.current = this.createPiece(type);
    this.canHold = true;
    if (collide(this.grid, this.current, 0, 0)) {
      this.toppedOut = true;
      this.state = "ENDED";
    }
  }

  movePiece(dir: number) {
    if (this.state !== "PLAYING" || !this.current) return false;
    if (!collide(this.grid, this.current, dir, 0)) {
      this.current.x += dir;
      this.sound("move");
      return true;
    }
    return false;
  }

  rotatePiece() {
    if (this.state !== "PLAYING" || !this.current) return false;
    if (this.current.type === "O") return false;
    const rotated = rotateMatrixCW(this.current.matrix);
    for (const [ox, oy] of ROTATION_KICKS) {
      if (!collide(this.grid, this.current, ox, oy, rotated)) {
        this.current.matrix = rotated;
        this.current.x += ox;
        this.current.y += oy;
        this.sound("rotate");
        return true;
      }
    }
    return false;
  }

  softDrop() {
    if (this.state !== "PLAYING" || !this.current) return;
    if (!collide(this.grid, this.current, 0, 1)) {
      this.current.y += 1;
      this.score += 1;
      this.dropCounter = 0;
      this.sound("softDrop");
    } else {
      this.lockPiece();
    }
  }

  hardDrop() {
    if (this.state !== "PLAYING" || !this.current) return;
    let dropped = 0;
    while (!collide(this.grid, this.current, 0, 1)) {
      this.current.y += 1;
      dropped++;
    }
    this.score += dropped * 2;
    this.sound("hardDrop");
    this.lockPiece();
  }

  holdPiece() {
    if (this.state !== "PLAYING" || !this.current || !this.canHold) return;
    this.sound("hold");
    const curType = this.current.type;
    if (this.holdType === null) {
      this.holdType = curType;
      this.spawnNextPiece();
    } else {
      const swap = this.holdType;
      this.holdType = curType;
      this.current = this.createPiece(swap);
    }
    this.canHold = false;
    this.dropCounter = 0;
  }

  getGhostY() {
    if (!this.current) return 0;
    let gy = this.current.y;
    while (!collide(this.grid, this.current, 0, gy - this.current.y + 1)) gy++;
    return gy;
  }

  spawnRiceFlourBurst(col: number, row: number, count: number, tintHex: string) {
    for (let i = 0; i < count; i++) {
      const angle = this.fxRng() * Math.PI * 2;
      const speed = 0.45 + this.fxRng() * 2.3;
      this.particles.push({
        frame: this.frame,
        col,
        row,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.35,
        size: 1.8 + this.fxRng() * 2.8,
        decay: 0.016 + this.fxRng() * 0.02,
        color: i % 2 === 0 ? RICE_FLOUR_HEX : tintHex,
      });
    }
  }

  lockPiece() {
    if (!this.current) return;
    const { matrix, x, y, color, type, groupId } = this.current;
    let aboveTop = false;
    const grid = this.grid.map((row) => row.slice());

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const by = y + r;
          const bx = x + c;
          if (by < 0) {
            aboveTop = true;
          } else if (by < ROWS && bx >= 0 && bx < COLS) {
            grid[by][bx] = { color, type, groupId };
            this.spawnRiceFlourBurst(bx + 0.5, by + 0.5, 4, color);
          }
        }
      }
    }
    this.grid = grid;

    if (aboveTop) {
      this.toppedOut = true;
      this.state = "ENDED";
      return;
    }

    const fullRows: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      if (grid[r].every((cell) => cell !== null)) fullRows.push(r);
    }

    if (fullRows.length > 0) {
      this.clearingRows = fullRows;
      this.clearProgress = 0;
      this.state = "CLEARING";
      this.current = null;
      this.sound("clear", fullRows.length);
      this.clears.push({ frame: this.frame, count: fullRows.length });
      fullRows.forEach((r) => {
        for (let c = 0; c < COLS; c++) {
          const cellObj = grid[r][c];
          this.spawnRiceFlourBurst(c + 0.5, r + 0.5, 6, cellObj ? cellObj.color : RICE_FLOUR_HEX);
        }
      });
    } else {
      this.sound("lock");
      this.spawnNextPiece();
    }
  }

  finishLineClear() {
    const count = this.clearingRows.length;
    const newGrid = this.grid.filter((_, idx) => !this.clearingRows.includes(idx));
    while (newGrid.length < ROWS) newGrid.unshift(Array<Cell>(COLS).fill(null));
    this.grid = newGrid;

    const linePoints = [0, 100, 300, 500, 800];
    this.score += (linePoints[count] || count * 250) * this.level;
    this.lines += count;
    this.level = Math.floor(this.lines / 10) + 1;
    this.clearingRows = [];

    const completed = this.clears.length;
    if (completed >= this.endAfterClears) {
      this.state = "ENDED";
      this.current = null;
      return;
    }
    this.state = "PLAYING";
    this.spawnNextPiece();
  }

  // One p5 draw() tick: gravity / clear animation
  update() {
    if (this.state === "PLAYING") {
      this.dropCounter += DT;
      const interval = getDropInterval(this.level);
      if (this.dropCounter >= interval) {
        this.dropCounter = 0;
        if (this.current && !collide(this.grid, this.current, 0, 1)) {
          this.current.y += 1;
        } else {
          this.lockPiece();
        }
      }
    } else if (this.state === "CLEARING") {
      this.clearProgress += DT / CLEAR_ANIM_DURATION;
      if (this.clearProgress >= 1) this.finishLineClear();
    }
  }

  snapshot(): Snapshot {
    const piece = this.current
      ? { ...this.current }
      : null;
    return {
      grid: this.grid,
      piece,
      ghostY: this.current ? this.getGhostY() : 0,
      holdType: this.holdType,
      nextType: this.nextType,
      canHold: this.canHold,
      score: this.score,
      lines: this.lines,
      level: this.level,
      state: this.state,
      clearingRows: this.clearingRows,
      clearProgress: this.clearProgress,
    };
  }
}
