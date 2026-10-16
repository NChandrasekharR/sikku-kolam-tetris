// Link-preview card (Open Graph / X summary_large_image) for the deployed
// game. Laid out at 1200x630 and rendered at 2x for a clean downscale.

import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { CREAM, cream, jakarta, tenor } from "./fonts";
import { PALETTE, PieceType } from "./game/constants";
import { drawSikkuKolamCell } from "./render/kolam";

const W = 1200;
const H = 630;
const SCALE = 2;
const CELL = 50;
const GRID = 8;
const gx = (c: number) => 725 + CELL * c;
const gy = (r: number) => 140 + CELL * r;

// A settled, tapestry-woven stack; the falling T's ghost completes two rows
const STACK: [number, number, PieceType][] = [
  [5, 0, "I"], [5, 6, "L"], [5, 7, "L"],
  [6, 0, "J"], [6, 1, "S"], [6, 5, "Z"], [6, 6, "Z"], [6, 7, "L"],
  [7, 0, "J"], [7, 1, "J"], [7, 2, "J"], [7, 4, "I"], [7, 5, "I"], [7, 6, "I"], [7, 7, "I"],
];
const FALLING: [number, number][] = [[1, 2], [1, 3], [1, 4], [2, 3]];
const GHOST: [number, number][] = [[6, 2], [6, 3], [6, 4], [7, 3]];

const connIn = (cells: [number, number][], r: number, c: number) => {
  const has = (a: number, b: number) => cells.some(([x, y]) => x === a && y === b);
  return { N: has(r - 1, c), E: has(r, c + 1), S: has(r + 1, c), W: has(r, c - 1) };
};

const drawScene = (ctx: CanvasRenderingContext2D) => {
  const stackCells = STACK.map(([r, c]) => [r, c] as [number, number]);
  const locked = new Set(stackCells.map(([r, c]) => `${r},${c}`));

  // Same draw order as the game: pulli guide dots, locked weave, ghost, piece
  ctx.fillStyle = "rgba(246,239,226,0.2196)";
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (locked.has(`${r},${c}`)) continue;
      ctx.beginPath();
      ctx.arc(gx(c), gy(r), (CELL * (2.5 / 27)) / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const [r, c, t] of STACK) {
    drawSikkuKolamCell(ctx, gx(c), gy(r), CELL, connIn(stackCells, r, c), PALETTE[t]);
  }
  for (const [r, c] of GHOST) {
    drawSikkuKolamCell(ctx, gx(c), gy(r), CELL, connIn(GHOST, r, c), PALETTE.T, 1, 1, true);
  }
  for (const [r, c] of FALLING) {
    drawSikkuKolamCell(ctx, gx(c), gy(r), CELL, connIn(FALLING, r, c), PALETTE.T);
  }
};

export const OgCard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    drawScene(ctx);
  }, []);

  return (
    <AbsoluteFill
      style={{ background: "radial-gradient(circle at 72% 50%, #B44332 0%, #9E3424 54%, #7A2316 100%)" }}
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
            backgroundImage: `radial-gradient(${cream(0.08)} 1.2px, transparent 0), radial-gradient(rgba(30, 5, 12, 0.15) 1.2px, transparent 0)`,
            backgroundSize: "26px 26px, 18px 18px",
            backgroundPosition: "0 0, 9px 13px",
          }}
        />
        <div style={{ position: "absolute", left: 88, top: 186, width: 520 }}>
          <div style={{ fontSize: 16, letterSpacing: "0.34em", textTransform: "uppercase", color: cream(0.68) }}>
            Sikku Kolam
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: tenor,
              fontSize: 92,
              lineHeight: 1,
              letterSpacing: "0.14em",
              color: CREAM,
            }}
          >
            TETRIS
          </div>
          <div style={{ marginTop: 30, width: 430, fontSize: 22, lineHeight: "33px", color: cream(0.8) }}>
            Every block is a kolam loop. Stack them and they weave into one pattern.
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: 34,
              padding: "12px 26px",
              borderRadius: 9999,
              background: CREAM,
              color: "#6E1423",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            Play in your browser
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
