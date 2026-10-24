// Home-screen / PWA icon: the O-piece woven as a kolam (two interlocking
// loops) on terracotta, inside a faint pulli grid. Rendered at 1024 and
// downscaled to 512 / 192 / 180. The motif stays inside the maskable safe zone.

import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { PALETTE, RICE_FLOUR_HEX } from "./game/constants";
import { drawSikkuKolamCell } from "./render/kolam";

const S = 1024;
const CELL = 280;

export const AppIcon: React.FC<{ glow: boolean }> = ({ glow }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const at = (i: number) => S / 2 + (i - 1.5) * CELL;
    // faint pulli around the piece
    ctx.fillStyle = "rgba(246,239,226,0.22)";
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (r >= 1 && r <= 2 && c >= 1 && c <= 2) continue;
        ctx.beginPath();
        ctx.arc(at(c), at(r), CELL * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const cells = [
      [1, 1],
      [1, 2],
      [2, 1],
      [2, 2],
    ];
    for (const [r, c] of cells) {
      const conn = { N: r === 2, S: r === 1, W: c === 2, E: c === 1 };
      drawSikkuKolamCell(ctx, at(c), at(r), CELL, conn, glow ? PALETTE.O : RICE_FLOUR_HEX);
    }
  }, [glow]);

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 44%, #B44332 0%, #9E3424 58%, #7A2316 100%)" }}>
      <canvas ref={ref} width={S} height={S} style={{ position: "absolute", inset: 0 }} />
    </AbsoluteFill>
  );
};
