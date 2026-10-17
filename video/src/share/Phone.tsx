import React from "react";
import { CREAM, cream } from "../fonts";
import { SCREEN_H, SCREEN_W } from "../GameScreen";

const BEZEL = 64;

// A stylised cream phone around a 1080x1920 screen, centred on (x, y).
// `radius` lets the screen start full-bleed (0) and round off as it shrinks.
export const Phone: React.FC<{
  x: number;
  y: number;
  scale: number;
  radius: number;
  opacity?: number;
  children: React.ReactNode;
}> = ({ x, y, scale, radius, opacity = 1, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: SCREEN_W + BEZEL * 2,
      height: SCREEN_H + BEZEL * 2,
      boxSizing: "border-box",
      padding: BEZEL,
      borderRadius: radius + BEZEL,
      background: CREAM,
      boxShadow: "0 50px 140px rgba(40, 8, 12, 0.45)",
      transform: `translate(-50%, -50%) scale(${scale})`,
      transformOrigin: "center",
      opacity,
    }}
  >
    <div
      style={{
        position: "relative",
        width: SCREEN_W,
        height: SCREEN_H,
        borderRadius: radius,
        overflow: "hidden",
        background: "#2A0910",
      }}
    >
      {children}
    </div>
    <div
      style={{
        position: "absolute",
        top: BEZEL * 0.36,
        left: "50%",
        width: 200,
        height: 18,
        marginLeft: -100,
        borderRadius: 9,
        background: "rgba(74, 18, 25, 0.16)",
      }}
    />
  </div>
);

// A finger tap: soft dot plus an expanding ring, `t` frames after the tap
export const TapRipple: React.FC<{ x: number; y: number; t: number; size?: number }> = ({ x, y, t, size = 1 }) => {
  if (t < 0 || t > 30) return null;
  const dot = t < 14 ? Math.min(1, t / 4) : Math.max(0, 1 - (t - 14) / 10);
  const ring = Math.min(1, t / 26);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0 }}>
      <div
        style={{
          position: "absolute",
          left: -60 * size,
          top: -60 * size,
          width: 120 * size,
          height: 120 * size,
          borderRadius: "50%",
          background: cream(0.42 * dot),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -(60 + 110 * ring) * size,
          top: -(60 + 110 * ring) * size,
          width: (120 + 220 * ring) * size,
          height: (120 + 220 * ring) * size,
          borderRadius: "50%",
          border: `${6 * size}px solid ${cream(0.6 * (1 - ring))}`,
          boxSizing: "border-box",
        }}
      />
    </div>
  );
};
