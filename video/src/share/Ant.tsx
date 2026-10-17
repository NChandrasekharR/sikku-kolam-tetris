// The courier: a small round-headed ant, facing right. Drawn in a 240x200
// box with its feet on y=190; `phase` advances one stride per 2π.

import React from "react";
import { CREAM } from "../fonts";

const BODY = "#3B0D15";
const BODY_FAR = "#5A1A22";
const MAROON = "#4A1219";

export const ANT_W = 240;
export const ANT_H = 200;
export const ANT_FEET_Y = 190;
// Where a carried note sits, in ant coordinates
export const ANT_NOTE_AT = { x: 78, y: 70 };

// Little kolam loop used on the note and in sparkles
export const KolamLoop: React.FC<{ size: number; color: string; stroke?: number }> = ({ size, color, stroke = 0.14 }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ display: "block", overflow: "visible" }}>
    <rect x={-30} y={-30} width={60} height={60} rx={22} transform="rotate(45)" fill="none" stroke={color} strokeWidth={100 * stroke} />
    <circle r={10} fill={color} />
  </svg>
);

// The folded share note: a cream card with a small kolam loop
export const Note: React.FC<{ width?: number; x?: number; y?: number }> = ({ width = 84, x, y }) => {
  const h = width * 0.72;
  return (
    <svg x={x} y={y} width={width} height={h + 6} viewBox={`0 0 ${width} ${h + 6}`} style={{ display: "block", overflow: "visible" }}>
      <rect x={0} y={5} width={width} height={h} rx={width * 0.14} fill="#2A0910" opacity={0.28} />
      <rect x={0} y={0} width={width} height={h} rx={width * 0.14} fill={CREAM} />
      <g transform={`translate(${width / 2} ${h / 2}) scale(${(width * 0.42) / 100})`}>
        <rect x={-30} y={-30} width={60} height={60} rx={22} transform="rotate(45)" fill="none" stroke="#9E3424" strokeWidth={14} />
        <circle r={10} fill="#9E3424" />
      </g>
    </svg>
  );
};

type Leg = { hipX: number; footX: number; far: boolean; group: 0 | 1 };
// Tripod gait: near-front, far-middle and near-back step together
const LEGS: Leg[] = [
  { hipX: 148, footX: 182, far: true, group: 1 },
  { hipX: 136, footX: 142, far: false, group: 1 },
  { hipX: 124, footX: 100, far: true, group: 1 },
  { hipX: 148, footX: 176, far: false, group: 0 },
  { hipX: 136, footX: 136, far: true, group: 0 },
  { hipX: 124, footX: 94, far: false, group: 0 },
];

export const Ant: React.FC<{
  phase: number;
  walking: boolean;
  carry?: "note" | "grain" | null;
  hop?: number; // 0..1 jump height
  blink?: boolean;
}> = ({ phase, walking, carry = null, hop = 0, blink = false }) => {
  const bob = walking ? -3 * Math.abs(Math.sin(phase)) : 0;
  const lift = -hop * 46;
  const wiggle = Math.sin(phase * 0.5) * 3;

  const leg = (l: Leg, i: number) => {
    const swing = walking ? Math.sin(phase + (l.group ? Math.PI : 0)) : 0;
    const footX = l.footX + swing * 14;
    const raise = walking ? Math.max(0, Math.cos(phase + (l.group ? Math.PI : 0))) * 9 : 0;
    const footY = ANT_FEET_Y - raise + (hop > 0 ? -hop * 8 : 0);
    const hipY = 126;
    const kneeX = (l.hipX + footX) / 2 + (footX > l.hipX ? 6 : -6);
    const kneeY = Math.min(hipY, footY) - 22;
    return (
      <path
        key={i}
        d={`M ${l.hipX} ${hipY} L ${kneeX} ${kneeY} L ${footX} ${footY}`}
        fill="none"
        stroke={l.far ? BODY_FAR : BODY}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  };

  return (
    <svg width={ANT_W} height={ANT_H} viewBox={`0 0 ${ANT_W} ${ANT_H}`} style={{ overflow: "visible", display: "block" }}>
      <g transform={`translate(0 ${bob + lift})`}>
        {LEGS.filter((l) => l.far).map(leg)}
        {/* abdomen with a glossy highlight */}
        <ellipse cx={72} cy={126} rx={46} ry={35} fill={BODY} transform="rotate(-8 72 126)" />
        <ellipse cx={58} cy={110} rx={17} ry={8} fill={CREAM} opacity={0.22} transform="rotate(-18 58 110)" />
        <circle cx={113} cy={124} r={8} fill={BODY} />
        <ellipse cx={137} cy={118} rx={23} ry={17} fill={BODY} />
        {LEGS.filter((l) => !l.far).map(leg)}
        {/* antennae with bobbles */}
        <path d={`M 172 74 Q 176 44 ${190 + wiggle} 30`} fill="none" stroke={BODY} strokeWidth={5} strokeLinecap="round" />
        <path d={`M 186 72 Q 204 46 ${222 - wiggle} 42`} fill="none" stroke={BODY} strokeWidth={5} strokeLinecap="round" />
        <circle cx={190 + wiggle} cy={30} r={6.5} fill={BODY} />
        <circle cx={222 - wiggle} cy={42} r={6.5} fill={BODY} />
        {/* head */}
        <circle cx={180} cy={100} r={33} fill={BODY} />
        <ellipse cx={170} cy={84} rx={10} ry={5} fill={CREAM} opacity={0.18} transform="rotate(-25 170 84)" />
        {blink ? (
          <path d="M 182 95 Q 191 100 200 95" fill="none" stroke={CREAM} strokeWidth={3.5} strokeLinecap="round" />
        ) : (
          <>
            <circle cx={191} cy={94} r={11.5} fill={CREAM} />
            <circle cx={194} cy={95.5} r={6.8} fill="#22070C" />
            <circle cx={197} cy={92} r={2.6} fill={CREAM} />
          </>
        )}
        <ellipse cx={197} cy={115} rx={7.5} ry={4.2} fill="#FF857A" opacity={0.6} />
        <path d="M 199 120 Q 205.5 125 212 119" fill="none" stroke={CREAM} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
        {carry === "note" ? (
          <g transform={`rotate(-7 ${ANT_NOTE_AT.x} ${ANT_NOTE_AT.y})`}>
            <Note width={84} x={ANT_NOTE_AT.x - 42} y={ANT_NOTE_AT.y - 30} />
          </g>
        ) : null}
        {carry === "grain" ? (
          <ellipse cx={80} cy={84} rx={17} ry={10} fill={CREAM} stroke={MAROON} strokeOpacity={0.15} strokeWidth={2} transform="rotate(-12 80 84)" />
        ) : null}
      </g>
    </svg>
  );
};
