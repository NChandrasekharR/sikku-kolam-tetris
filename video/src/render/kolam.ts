// Canvas2D port of the p5 renderer from kolam_polka_dot_tetris.html.
// Geometry, stroke weights, alphas and draw order are unchanged; every p5
// line()/shape is stroked as its own path so overlapping translucent
// strokes blend exactly as they do in p5. Ink: Rice Flour, weave: Tapestry.

import {
  BOARD_X,
  BOARD_Y,
  CELL,
  COLS,
  PALETTE,
  PieceType,
  RICE_FLOUR_HEX,
  ROWS,
  SHAPES,
} from "../game/constants";
import type { Grid, ParticleSpawn, Piece } from "../game/engine";

type Ctx = CanvasRenderingContext2D;
export type Conn = { N: boolean; E: boolean; S: boolean; W: boolean };

// Optional per-segment ink, used to colour each continuous line separately.
// quad: 0..3 = N, E, S, W; end: which tangent point the segment touches.
export type StrandInk = (quad: number, end: "in" | "out") => string;

const rgbCache = new Map<string, [number, number, number]>();
const rgba = (hex: string, alpha255: number) => {
  let rgb = rgbCache.get(hex);
  if (!rgb) {
    const n = parseInt(hex.slice(1), 16);
    rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    rgbCache.set(hex, rgb);
  }
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.max(0, Math.min(255, alpha255)) / 255})`;
};

const line = (ctx: Ctx, x1: number, y1: number, x2: number, y2: number) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

const circle = (ctx: Ctx, x: number, y: number, d: number) => {
  ctx.beginPath();
  ctx.arc(x, y, d / 2, 0, Math.PI * 2);
  ctx.fill();
};

export const drawSikkuKolamCell = (
  ctx: Ctx,
  cx: number,
  cy: number,
  size: number,
  conn: Conn,
  pigmentHex: string,
  scale = 1,
  alpha = 1,
  isGhost = false,
  strandInk?: StrandInk,
) => {
  const R = size * 0.5 * scale;
  if (R <= 1.5) return;

  const r0 = R * Math.SQRT1_2;
  const connCount = (conn.N ? 1 : 0) + (conn.E ? 1 : 0) + (conn.S ? 1 : 0) + (conn.W ? 1 : 0);

  const quadrants = [
    { connected: conn.N, a1: (-3 * Math.PI) / 4, a2: -Math.PI / 4, mx: cx, my: cy - R, oppositeConn: conn.S },
    { connected: conn.E, a1: -Math.PI / 4, a2: Math.PI / 4, mx: cx + R, my: cy, oppositeConn: conn.W },
    { connected: conn.S, a1: Math.PI / 4, a2: (3 * Math.PI) / 4, mx: cx, my: cy + R, oppositeConn: conn.N },
    { connected: conn.W, a1: (3 * Math.PI) / 4, a2: (5 * Math.PI) / 4, mx: cx - R, my: cy, oppositeConn: conn.E },
  ];

  const strokeW = Math.max(1.5, size * (isGhost ? 0.065 : 0.115) * scale);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // styleFor maps a segment's strand ink (null unless strandInk is given) to
  // a stroke style; returning null skips the segment
  const traceCellWeave = (styleFor: (hex: string | null) => string | null) => {
    const ink = (q: number, end: "in" | "out") => (strandInk ? strandInk(q, end) : null);
    const use = (q: number, end: "in" | "out") => {
      const style = styleFor(ink(q, end));
      if (style) ctx.strokeStyle = style;
      return style !== null;
    };
    quadrants.forEach((quad, q) => {
      const tInX = cx + r0 * Math.cos(quad.a1);
      const tInY = cy + r0 * Math.sin(quad.a1);
      const tOutX = cx + r0 * Math.cos(quad.a2);
      const tOutY = cy + r0 * Math.sin(quad.a2);

      if (quad.connected) {
        if (use(q, "in")) line(ctx, tInX, tInY, quad.mx, quad.my);
        if (use(q, "out")) line(ctx, quad.mx, quad.my, tOutX, tOutY);
      } else if (use(q, "in")) {
        let bulgeFactor = 0.055;
        if (connCount === 1 && quad.oppositeConn) bulgeFactor = 0.115;
        else if (connCount === 0) bulgeFactor = 0.04;
        const bulge = R * bulgeFactor;

        ctx.beginPath();
        const steps = 14;
        for (let s = 0; s <= steps; s++) {
          const theta = quad.a1 + (s / steps) * (quad.a2 - quad.a1);
          const sinTerm = Math.sin(2 * (theta - quad.a1));
          const rad = r0 + bulge * (sinTerm * sinTerm);
          const px = cx + rad * Math.cos(theta);
          const py = cy + rad * Math.sin(theta);
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    });
  };

  // Warm pigment under-glow beneath the rice-flour line (strand-inked
  // drawings use flat ink: per-segment translucent glow beads at the joins)
  if (!isGhost && !strandInk) {
    ctx.lineWidth = strokeW * 1.95;
    traceCellWeave((hex) => {
      const glow = hex ?? pigmentHex;
      return glow === RICE_FLOUR_HEX ? null : rgba(glow, alpha * 72);
    });
  }

  ctx.lineWidth = strokeW;
  traceCellWeave((hex) => rgba(hex ?? RICE_FLOUR_HEX, alpha * (isGhost ? 95 : 255)));

  const pulliDiameter = Math.max(2.4, size * (isGhost ? 0.15 : 0.22) * scale);
  ctx.fillStyle = rgba(RICE_FLOUR_HEX, alpha * (isGhost ? 105 : 255));
  circle(ctx, cx, cy, pulliDiameter);

  ctx.restore();
};

const getMatrixCellConn = (matrix: number[][], r: number, c: number): Conn => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  return {
    N: r - 1 >= 0 && matrix[r - 1][c] !== 0,
    E: c + 1 < cols && matrix[r][c + 1] !== 0,
    S: r + 1 < rows && matrix[r + 1][c] !== 0,
    W: c - 1 >= 0 && matrix[r][c - 1] !== 0,
  };
};

export const drawPulliGrid = (ctx: Ctx, grid: Grid) => {
  ctx.fillStyle = "rgba(246,239,226,0.2196)"; // fill(246, 239, 226, 56)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === null) {
        circle(ctx, BOARD_X + (c + 0.5) * CELL, BOARD_Y + (r + 0.5) * CELL, 2.5);
      }
    }
  }
};

export type BoardView = {
  grid: Grid;
  clearingRows: number[];
  clearProgress: number;
  piece: Piece | null;
  ghostY: number;
  playing: boolean;
};

export const drawBoardSikkuWeave = (ctx: Ctx, v: BoardView) => {
  const { grid, clearingRows, clearProgress } = v;
  const connected = (r1: number, c1: number, r2: number, c2: number) => {
    if (r2 < 0 || r2 >= ROWS || c2 < 0 || c2 >= COLS) return false;
    if (!grid[r1][c1] || !grid[r2][c2]) return false;
    // Tapestry weave: every adjacent locked cell interlaces, except across
    // the boundary of rows that are dissolving
    return clearingRows.includes(r1) === clearingRows.includes(r2);
  };

  for (let r = 0; r < ROWS; r++) {
    const isClearing = clearingRows.includes(r);
    for (let c = 0; c < COLS; c++) {
      const cellObj = grid[r][c];
      if (cellObj === null) continue;
      const cx = BOARD_X + (c + 0.5) * CELL;
      const cy = BOARD_Y + (r + 0.5) * CELL;
      const conn = {
        N: connected(r, c, r - 1, c),
        E: connected(r, c, r, c + 1),
        S: connected(r, c, r + 1, c),
        W: connected(r, c, r, c - 1),
      };
      if (isClearing) {
        const shrink = 1 - Math.pow(clearProgress, 1.6);
        drawSikkuKolamCell(ctx, cx, cy, CELL, conn, cellObj.color, Math.max(0.05, shrink), Math.max(0, shrink), false);
      } else {
        drawSikkuKolamCell(ctx, cx, cy, CELL, conn, cellObj.color, 1, 1, false);
      }
    }
  }

  if (v.piece && v.playing) {
    const { matrix, x, y, color } = v.piece;
    if (v.ghostY !== y) {
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] !== 0 && v.ghostY + r >= 0) {
            const gx = BOARD_X + (x + c + 0.5) * CELL;
            const gy = BOARD_Y + (v.ghostY + r + 0.5) * CELL;
            drawSikkuKolamCell(ctx, gx, gy, CELL, getMatrixCellConn(matrix, r, c), color, 1, 1, true);
          }
        }
      }
    }
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0 && y + r >= 0) {
          const cx = BOARD_X + (x + c + 0.5) * CELL;
          const cy = BOARD_Y + (y + r + 0.5) * CELL;
          drawSikkuKolamCell(ctx, cx, cy, CELL, getMatrixCellConn(matrix, r, c), color, 1, 1, false);
        }
      }
    }
  }
};

export const drawMiniSikkuPiece = (
  ctx: Ctx,
  cx: number,
  cy: number,
  type: PieceType,
  dotStep: number,
  dimmed: boolean,
) => {
  const matrix = SHAPES[type];
  const col = PALETTE[type];
  let minR = matrix.length, maxR = -1, minC = matrix[0].length, maxC = -1;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }
  const startX = cx - ((maxC - minC + 1) * dotStep) / 2;
  const startY = cy - ((maxR - minR + 1) * dotStep) / 2;
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (matrix[r][c]) {
        const dx = startX + (c - minC + 0.5) * dotStep;
        const dy = startY + (r - minR + 0.5) * dotStep;
        drawSikkuKolamCell(ctx, dx, dy, dotStep, getMatrixCellConn(matrix, r, c), col, 1, dimmed ? 0.42 : 1, false);
      }
    }
  }
};

export const drawKolamClearWave = (ctx: Ctx, rows: number[], progress: number) => {
  ctx.save();
  ctx.strokeStyle = rgba(RICE_FLOUR_HEX, Math.sin(progress * Math.PI) * 255);
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round"; // p5 defaults: ROUND cap, MITER join
  ctx.lineJoin = "miter";
  const waveSpan = CELL * COLS * Math.min(1, progress * 1.35);
  for (const r of rows) {
    const cy = BOARD_Y + (r + 0.5) * CELL;
    const amp = CELL * 0.36;
    for (const sign of [1, -1]) {
      ctx.beginPath();
      for (let x = 0; x <= waveSpan; x += 4) {
        const phase = (x / CELL) * Math.PI + progress * 6;
        const px = BOARD_X + x;
        const py = cy + sign * Math.sin(phase) * amp;
        if (x === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
};

// Closed form of the per-frame particle integrator in the original:
// x += vx; y += vy; vy += 0.04; alpha -= decay  (applied n times)
export const drawParticles = (ctx: Ctx, particles: ParticleSpawn[], frame: number) => {
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    if (pt.frame > frame) continue;
    const n = frame - pt.frame + 1;
    const alpha = 1 - n * pt.decay;
    if (alpha <= 0) continue;
    const x = BOARD_X + pt.col * CELL + n * pt.vx;
    const y = BOARD_Y + pt.row * CELL + n * pt.vy + (0.04 * n * (n - 1)) / 2;
    ctx.fillStyle = rgba(pt.color, alpha * 235);
    circle(ctx, x, y, pt.size);
  }
};
