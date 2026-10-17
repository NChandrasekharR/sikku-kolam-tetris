// The share network as a kolam: each pulli is a player, and the weave
// blooms outward ring by ring from the two phones.

import React, { useLayoutEffect, useRef } from "react";
import { RICE_FLOUR_HEX } from "../game/constants";
import { drawSikkuKolamCell } from "../render/kolam";
import { NET_CELL, NET_CELLS, netCenter } from "./beats";

const W = 1080;
const H = 1920;
const POP = 16; // frames for a cell to bloom

// easeOutBack: a little overshoot as each loop opens
const back = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const Network: React.FC<{ frame: number; gridOpacity: number; seedDot: number }> = ({
  frame,
  gridOpacity,
  seedDot,
}) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const open = (r: number, c: number) => NET_CELLS.some((n) => n.r === r && n.c === c && frame >= n.at);

    for (const n of NET_CELLS) {
      const { x, y } = netCenter(n.r, n.c);
      const t = (frame - n.at) / POP;
      if (t < 0) {
        // not reached yet: faint guide dot (seeds show the collapsing phones' dot)
        const seed = n.ring === 0;
        const alpha = seed ? seedDot : 0.24 * gridOpacity;
        if (alpha <= 0) continue;
        ctx.fillStyle = `rgba(246,239,226,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, seed ? NET_CELL * 0.11 : NET_CELL * 0.05, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      const s = t >= 1 ? 1 : Math.max(0.05, back(t));
      const conn = { N: open(n.r - 1, n.c), E: open(n.r, n.c + 1), S: open(n.r + 1, n.c), W: open(n.r, n.c - 1) };
      drawSikkuKolamCell(ctx, x, y, NET_CELL, conn, RICE_FLOUR_HEX, s, Math.min(1, t * 2.5 + 0.2));
    }
  }, [frame, gridOpacity, seedDot]);

  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0 }} />;
};
