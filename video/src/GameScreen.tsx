// The game as it looks on a phone: a fixed 1080x1920 box (432x768 CSS px at
// 2.5x) with the canvas weave, clay grain, header/stats and an optional
// overlay card. Rendered full-frame or scaled down inside a phone.

import React, { useLayoutEffect, useRef } from "react";
import { ClayGrain, HOLD_X, MINI_STEP, MINI_Y, NEXT_X, PageChrome } from "./Chrome";
import { PAGE_H, PAGE_SCALE, PAGE_W } from "./game/constants";
import type { ParticleSpawn } from "./game/engine";
import type { FrameView } from "./game/view";
import {
  drawBoardSikkuWeave,
  drawKolamClearWave,
  drawMiniSikkuPiece,
  drawParticles,
  drawPulliGrid,
} from "./render/kolam";

export const SCREEN_W = PAGE_W * PAGE_SCALE;
export const SCREEN_H = PAGE_H * PAGE_SCALE;

export const GameScreen: React.FC<{
  view: FrameView;
  particles: ParticleSpawn[];
  // frame on the particles' own clock
  particleFrame: number;
  overlay?: React.ReactNode;
}> = ({ view, particles, particleFrame, overlay }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Same draw order as the original p5 draw()
  useLayoutEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.setTransform(PAGE_SCALE, 0, 0, PAGE_SCALE, 0, 0);
    if (view.holdType) drawMiniSikkuPiece(ctx, HOLD_X, MINI_Y, view.holdType, MINI_STEP, !view.canHold);
    if (view.nextType) drawMiniSikkuPiece(ctx, NEXT_X, MINI_Y, view.nextType, MINI_STEP, false);
    drawPulliGrid(ctx, view.grid);
    drawBoardSikkuWeave(ctx, view);
    if (view.wave) drawKolamClearWave(ctx, view.clearingRows, view.clearProgress);
    drawParticles(ctx, particles, particleFrame);
  }, [view, particles, particleFrame]);

  return (
    <div
      style={{
        position: "relative",
        width: SCREEN_W,
        height: SCREEN_H,
        overflow: "hidden",
        background: "radial-gradient(circle at 50% 46%, #B44332 0%, #9E3424 54%, #7A2316 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        width={SCREEN_W}
        height={SCREEN_H}
        style={{ position: "absolute", inset: 0 }}
      />
      <ClayGrain />
      <PageChrome score={view.score} level={view.level} lines={view.lines} overlay={overlay} />
    </div>
  );
};
