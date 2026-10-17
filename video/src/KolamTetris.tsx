import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { StartOverlay } from "./Chrome";
import { GameScreen } from "./GameScreen";
import { END_AFTER_CLEARS, SEED } from "./game/config";
import { END_HOLD, OVERLAY_FADE, PRESS, buildTimeline } from "./game/timeline";
import { getFrameView } from "./game/view";

// Deterministic: every render tab rebuilds the identical game
export const timeline = buildTimeline(SEED, END_AFTER_CLEARS);

export const KolamTetris: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const view = getFrameView(timeline, frame);

  return (
    <AbsoluteFill>
      <GameScreen
        view={view}
        particles={timeline.particles}
        particleFrame={frame}
        overlay={frame < PRESS + OVERLAY_FADE ? <StartOverlay frame={frame} /> : null}
      />
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
