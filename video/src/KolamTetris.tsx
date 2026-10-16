import { Audio } from "@remotion/media";
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ClayGrain, HOLD_X, MINI_STEP, MINI_Y, NEXT_X, PageChrome } from "./Chrome";
import { END_AFTER_CLEARS, SEED } from "./game/config";
import { PAGE_SCALE } from "./game/constants";
import { END_HOLD, buildTimeline } from "./game/timeline";
import { getFrameView } from "./game/view";
import {
  drawBoardSikkuWeave,
  drawKolamClearWave,
  drawMiniSikkuPiece,
  drawParticles,
  drawPulliGrid,
} from "./render/kolam";

// Deterministic: every render tab rebuilds the identical game
export const timeline = buildTimeline(SEED, END_AFTER_CLEARS);

export const KolamTetris: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const view = getFrameView(timeline, frame);

  // Same draw order as the original p5 draw()
  useLayoutEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.setTransform(PAGE_SCALE, 0, 0, PAGE_SCALE, 0, 0);
    if (view.holdType) drawMiniSikkuPiece(ctx, HOLD_X, MINI_Y, view.holdType, MINI_STEP, !view.canHold);
    if (view.nextType) drawMiniSikkuPiece(ctx, NEXT_X, MINI_Y, view.nextType, MINI_STEP, false);
    drawPulliGrid(ctx, view.grid);
    drawBoardSikkuWeave(ctx, view);
    if (view.wave) drawKolamClearWave(ctx, view.clearingRows, view.clearProgress);
    drawParticles(ctx, timeline.particles, frame);
  }, [frame, view, width, height]);

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 46%, #B44332 0%, #9E3424 54%, #7A2316 100%)",
      }}
    >
      <canvas ref={canvasRef} width={width} height={height} style={{ position: "absolute", inset: 0 }} />
      <ClayGrain />
      <PageChrome frame={frame} score={view.score} level={view.level} lines={view.lines} />
      <AbsoluteFill
        style={{
          backgroundColor: "#000",
          opacity: interpolate(frame, [timeline.gameEnd + 1 + END_HOLD, durationInFrames - 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.45, 0, 0.55, 1),
          }),
        }}
      />
      <Audio src={staticFile("sfx.wav")} />
    </AbsoluteFill>
  );
};
