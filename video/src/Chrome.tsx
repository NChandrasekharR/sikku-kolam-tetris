// The page around the canvas (header, stats bar, HOLD/NEXT labels, start
// overlay, clay grain), laid out in the original's CSS pixels at a 432x768
// phone viewport and scaled up as one layer.

import React from "react";
import { Easing, interpolate, interpolateColors } from "remotion";
import { CREAM, cream, jakarta, tenor } from "./fonts";
import { BOARD_Y, CELL, PAGE_H, PAGE_SCALE, PAGE_W } from "./game/constants";
import { HOVER_START, OVERLAY_FADE, PRESS } from "./game/timeline";

// Gutter centres for the HOLD / NEXT minis (page px)
export const HOLD_X = 40.5;
export const NEXT_X = 391.5;
export const MINI_Y = BOARD_Y + CELL * 2.4;
export const MINI_STEP = 15;

const ScaledPage: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: PAGE_W,
      height: PAGE_H,
      scale: String(PAGE_SCALE),
      transformOrigin: "0 0",
      ...style,
    }}
  >
    {children}
  </div>
);

const kolamBtn: React.CSSProperties = {
  position: "absolute",
  top: 8,
  height: 28,
  boxSizing: "border-box",
  borderRadius: 9999,
  border: `1px solid ${cream(0.38)}`,
  background: "rgba(60, 12, 22, 0.32)",
  backdropFilter: "blur(4px)",
  color: CREAM,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const Header: React.FC = () => (
  <>
    <div style={{ ...kolamBtn, left: 18, width: 28 }}>
      <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"
        />
      </svg>
    </div>
    <div style={{ ...kolamBtn, left: 52, width: 28 }}>
      <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <circle cx={12} cy={12} r={6.5} strokeDasharray="2.5 2.5" />
      </svg>
    </div>
    <div
      style={{
        ...kolamBtn,
        left: 86,
        width: 73.81,
        fontSize: 10,
        lineHeight: "15px",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      Tapestry
    </div>
    <div style={{ ...kolamBtn, left: 165.81, width: 30 }}>
      <span style={{ width: 8, height: 8, borderRadius: 9999, background: CREAM }} />
    </div>
    <div style={{ ...kolamBtn, left: 201.81, width: 30 }}>
      <span
        style={{
          width: 8,
          height: 8,
          boxSizing: "border-box",
          borderRadius: 9999,
          background: "#9E1352",
          border: `1px solid ${cream(0.7)}`,
        }}
      />
    </div>
    <div
      style={{
        position: "absolute",
        left: 260.39,
        top: 8,
        height: 28,
        fontFamily: tenor,
        fontSize: 18,
        lineHeight: "28px",
        letterSpacing: "0.34em",
        color: cream(0.8),
        whiteSpace: "nowrap",
      }}
    >
      TETRIS
    </div>
    <div style={{ ...kolamBtn, left: 386, width: 28 }}>
      <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
      </svg>
    </div>
  </>
);

const statLabel: React.CSSProperties = {
  fontSize: 8,
  lineHeight: "12px",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: cream(0.6),
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ textAlign: "center" }}>
    <div style={statLabel}>{label}</div>
    <div
      style={{
        fontFamily: tenor,
        fontSize: 14,
        lineHeight: "20px",
        color: CREAM,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </div>
  </div>
);

const StatsBar: React.FC<{ score: number; level: number; lines: number }> = ({ score, level, lines }) => (
  <div
    style={{
      position: "absolute",
      left: 66,
      top: 36,
      width: 300,
      height: 40,
      boxSizing: "border-box",
      padding: "4px 12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <Stat label="Score" value={String(score)} />
    <Stat label="Level" value={String(level).padStart(2, "0")} />
    <Stat label="Lines" value={String(lines)} />
  </div>
);

const MiniLabel: React.FC<{ x: number; children: string }> = ({ x, children }) => (
  <div
    style={{
      ...statLabel,
      position: "absolute",
      left: x - 40,
      width: 80,
      top: BOARD_Y + CELL * 0.6 - 12,
      textAlign: "center",
      textIndent: "0.22em", // balance trailing letter-spacing
    }}
  >
    {children}
  </div>
);

// #overlay: the centred card used for Start / Pause / Game Over
const OverlayCard: React.FC<{ opacity: number; children: React.ReactNode }> = ({ opacity, children }) => (
  <div
    style={{
      position: "absolute",
      left: 71,
      top: 269.98,
      width: 290,
      height: 300,
      boxSizing: "border-box",
      padding: 24,
      borderRadius: 12,
      border: `1px solid ${cream(0.2)}`,
      background: "rgba(74, 18, 25, 0.8)",
      backdropFilter: "blur(4px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      opacity,
    }}
  >
    {children}
  </div>
);

const OverlayHeading: React.FC<{ subtitle: string }> = ({ subtitle }) => (
  <>
    <p
      style={{
        margin: "0 0 6px",
        fontSize: 10,
        lineHeight: "15px",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: cream(0.65),
      }}
    >
      {subtitle}
    </p>
    <h2
      style={{
        margin: "0 0 20px",
        fontFamily: tenor,
        fontWeight: 400,
        fontSize: 24,
        lineHeight: "32px",
        letterSpacing: "0.1em",
        color: CREAM,
      }}
    >
      TETRIS
    </h2>
  </>
);

// Centre of the Share Score button in page px (layout below is fixed-height,
// so this holds for the Game Over card)
export const SHARE_BTN_CENTER = { x: 216, y: 512.2 };

export const GameOverOverlay: React.FC<{ opacity: number; score: number; sharePress: number }> = ({
  opacity,
  score,
  sharePress,
}) => (
  <OverlayCard opacity={opacity}>
    <OverlayHeading subtitle="Game Over" />
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 9, lineHeight: "13.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: cream(0.65) }}>
        Score
      </div>
      <div
        style={{
          marginTop: 2,
          fontFamily: tenor,
          fontSize: 24,
          lineHeight: "32px",
          color: CREAM,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {score}
      </div>
    </div>
    <div
      style={{
        padding: "8px 28px",
        borderRadius: 9999,
        border: `1px solid ${cream(0.8)}`,
        background: CREAM,
        color: "#6E1423",
        fontWeight: 500,
        fontSize: 12,
        lineHeight: "16px",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      Play Again
    </div>
    {/* .share-btn from the shipped game */}
    <div
      style={{
        marginTop: 10,
        padding: "7px 22px",
        borderRadius: 9999,
        border: `1px solid ${cream(0.6)}`,
        background: cream(0.15 * sharePress),
        color: CREAM,
        fontSize: 11,
        lineHeight: "16.5px",
        fontWeight: 500,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        scale: String(1 - 0.05 * sharePress),
      }}
    >
      Share Score
    </div>
  </OverlayCard>
);

export const StartOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  // Tailwind: transition-all duration-200 (cubic-bezier(.4,0,.2,1)) on hover
  const hover = interpolate(frame, [HOVER_START, HOVER_START + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  return (
    <OverlayCard
      // .overlay-fade: opacity 0.32s ease
      opacity={interpolate(frame, [PRESS, PRESS + OVERLAY_FADE], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })}
    >
      <OverlayHeading subtitle="Sikku Kolam" />
      <div
        style={{
          padding: "8px 28px",
          borderRadius: 9999,
          border: `1px solid ${cream(0.8)}`,
          background: cream(1 - hover),
          color: interpolateColors(hover, [0, 1], ["#6E1423", CREAM]),
          fontWeight: 500,
          fontSize: 12,
          lineHeight: "16px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        Start
      </div>
      <div style={{ marginTop: 20, fontSize: 10, lineHeight: "15px", fontWeight: 300, color: cream(0.65) }}>
        <p style={{ margin: 0 }}>Arrows / WASD to Move &amp; Rotate</p>
        <p style={{ margin: "4px 0 0" }}>Space to Drop &middot; C to Hold</p>
      </div>
    </OverlayCard>
  );
};

export const ClayGrain: React.FC = () => (
  <ScaledPage>
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.34,
        backgroundImage: `radial-gradient(${cream(0.08)} 1px, transparent 0), radial-gradient(rgba(30, 5, 12, 0.15) 1px, transparent 0)`,
        backgroundSize: "22px 22px, 15px 15px",
        backgroundPosition: "0 0, 7px 11px",
      }}
    />
  </ScaledPage>
);

export const PageChrome: React.FC<{
  score: number;
  level: number;
  lines: number;
  overlay?: React.ReactNode;
}> = ({ score, level, lines, overlay }) => (
  <ScaledPage style={{ fontFamily: jakarta, color: CREAM }}>
    <StatsBar score={score} level={level} lines={lines} />
    <MiniLabel x={HOLD_X}>Hold</MiniLabel>
    <MiniLabel x={NEXT_X}>Next</MiniLabel>
    <Header />
    {overlay}
  </ScaledPage>
);
