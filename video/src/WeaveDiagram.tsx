// Static explainer for the thread: how cells weave, drawn with the game's own
// renderer. Laid out at 1600x900 and rendered at 2x.

import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { CREAM, cream, jakarta, tenor } from "./fonts";
import { PALETTE, RICE_FLOUR_HEX } from "./game/constants";
import { StrandInk, drawSikkuKolamCell } from "./render/kolam";

const W = 1600;
const H = 900;
const SCALE = 2;
const CELL = 104;
const GRID_COLS = 15;
const GRID_ROWS = 4;
const gx = (c: number) => 72 + CELL * c;
const gy = (r: number) => 270 + CELL * r;

type Corner = "NE" | "SE" | "SW" | "NW";
type Group = { cells: [number, number][]; inks?: string[] }; // inks: one per strand

const GROUPS: Group[] = [
  { cells: [[2, 1]] },
  { cells: [[2, 4], [2, 5]] },
  { cells: [[1, 9], [2, 8], [2, 9], [2, 10]], inks: [PALETTE.T] },
  { cells: [[1, 12], [1, 13], [2, 12], [2, 13]], inks: [PALETTE.O, RICE_FLOUR_HEX] },
];

// Tangent points each quadrant (N, E, S, W) runs between, as [in, out]
const QUAD_CORNERS: [Corner, Corner][] = [
  ["NW", "NE"],
  ["NE", "SE"],
  ["SE", "SW"],
  ["SW", "NW"],
];

// Union-find over tangent points: free sides join a cell's own corners; shared
// sides pass straight through to the neighbour's opposite corners
const strandsOf = (cells: [number, number][]) => {
  const has = (r: number, c: number) => cells.some(([a, b]) => a === r && b === c);
  const parent = new Map<string, string>();
  const find = (k: string): string => {
    if (!parent.has(k)) parent.set(k, k);
    const p = parent.get(k)!;
    if (p === k) return k;
    const root = find(p);
    parent.set(k, root);
    return root;
  };
  const key = (r: number, c: number, t: Corner) => `${r},${c},${t}`;
  const join = (a: string, b: string) => parent.set(find(a), find(b));
  for (const [r, c] of cells) {
    if (!has(r - 1, c)) join(key(r, c, "NW"), key(r, c, "NE"));
    if (!has(r, c - 1)) join(key(r, c, "NW"), key(r, c, "SW"));
    if (has(r, c + 1)) {
      join(key(r, c, "NE"), key(r, c + 1, "SW"));
      join(key(r, c, "SE"), key(r, c + 1, "NW"));
    } else join(key(r, c, "NE"), key(r, c, "SE"));
    if (has(r + 1, c)) {
      join(key(r, c, "SE"), key(r + 1, c, "NW"));
      join(key(r, c, "SW"), key(r + 1, c, "NE"));
    } else join(key(r, c, "SW"), key(r, c, "SE"));
  }
  const ids = new Map<string, number>();
  return (r: number, c: number, t: Corner) => {
    const root = find(key(r, c, t));
    if (!ids.has(root)) ids.set(root, ids.size);
    return ids.get(root)!;
  };
};

const drawDiagram = (ctx: CanvasRenderingContext2D) => {
  const occupied = new Set(GROUPS.flatMap((g) => g.cells.map(([r, c]) => `${r},${c}`)));

  // Empty pulli guide dots, same proportions as the game board
  ctx.fillStyle = "rgba(246,239,226,0.2196)";
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (occupied.has(`${r},${c}`)) continue;
      ctx.beginPath();
      ctx.arc(gx(c), gy(r), (CELL * (2.5 / 27)) / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const group of GROUPS) {
    const has = (r: number, c: number) => group.cells.some(([a, b]) => a === r && b === c);
    const strand = strandsOf(group.cells);
    for (const [r, c] of group.cells) {
      const conn = { N: has(r - 1, c), E: has(r, c + 1), S: has(r + 1, c), W: has(r, c - 1) };
      const inks = group.inks;
      const strandInk: StrandInk | undefined = inks
        ? (q, end) => inks[strand(r, c, QUAD_CORNERS[q][end === "in" ? 0 : 1])]
        : undefined;
      drawSikkuKolamCell(ctx, gx(c), gy(r), CELL, conn, RICE_FLOUR_HEX, 1, 1, false, strandInk);
    }
  }

  // Call out the crossing on the shared side in panel 2
  ctx.save();
  ctx.strokeStyle = cream(0.55);
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.arc((gx(4) + gx(5)) / 2, gy(2), CELL * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

const Label: React.FC<{ x: number; title: string; children: React.ReactNode }> = ({ x, title, children }) => (
  <div style={{ position: "absolute", left: x - 260, width: 520, top: 648, textAlign: "center" }}>
    <div style={{ fontFamily: tenor, fontSize: 40, lineHeight: "48px", letterSpacing: "0.04em", color: CREAM }}>
      {title}
    </div>
    <div style={{ marginTop: 8, fontSize: 21, lineHeight: "30px", fontWeight: 400, color: cream(0.72) }}>
      {children}
    </div>
  </div>
);

export const WeaveDiagram: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    drawDiagram(ctx);
  }, []);

  return (
    <AbsoluteFill
      style={{ background: "radial-gradient(circle at 50% 46%, #B44332 0%, #9E3424 54%, #7A2316 100%)" }}
    >
      <canvas ref={canvasRef} width={W * SCALE} height={H * SCALE} style={{ position: "absolute", inset: 0 }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          scale: String(SCALE),
          transformOrigin: "0 0",
          fontFamily: jakarta,
          color: CREAM,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.34,
            backgroundImage: `radial-gradient(${cream(0.08)} 1.4px, transparent 0), radial-gradient(rgba(30, 5, 12, 0.15) 1.4px, transparent 0)`,
            backgroundSize: "30px 30px, 20px 20px",
            backgroundPosition: "0 0, 10px 15px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 112,
            width: W,
            textAlign: "center",
            fontSize: 18,
            letterSpacing: "0.3em",
            textIndent: "0.3em",
            textTransform: "uppercase",
            color: cream(0.62),
          }}
        >
          Sikku Kolam Tetris &nbsp;·&nbsp; How the pieces weave
        </div>
        <Label x={gx(1)} title="Alone">
          the line loops its dot
        </Label>
        <Label x={(gx(4) + gx(5)) / 2} title="Touching">
          facing sides cross in an X
        </Label>
        <Label x={(gx(8) + gx(13)) / 2} title="Together">
          T: <span style={{ color: PALETTE.T }}>one line</span> &nbsp;·&nbsp; O:{" "}
          <span style={{ color: PALETTE.O }}>two loops</span>
        </Label>
      </div>
    </AbsoluteFill>
  );
};
