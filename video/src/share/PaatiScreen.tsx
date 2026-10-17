// Paati's phone: the lock screen at dawn, then the chat where the share
// arrives with the link preview. Laid out at 1080x1920 screen px.

import React from "react";
import { Img, interpolate, spring, staticFile } from "remotion";
import { CREAM, cream, jakarta, jakartaWithGlyphs, tenor } from "../fonts";
import { KolamLoop } from "./Ant";

const MAROON = "#4A1219";
const SCREEN_BG = "linear-gradient(180deg, #3A0E16 0%, #2A0910 100%)";

export const LockScreen: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: SCREEN_BG, textAlign: "center", color: CREAM }}>
    <div style={{ position: "absolute", top: 380, width: "100%", fontFamily: tenor, fontSize: 240, lineHeight: 1 }}>6:00</div>
    <div style={{ position: "absolute", top: 650, width: "100%", fontFamily: jakarta, fontSize: 46, color: cream(0.6) }}>
      good morning
    </div>
    <div style={{ position: "absolute", top: 1600, left: 0, width: "100%", display: "flex", justifyContent: "center", gap: 60, opacity: 0.25 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <KolamLoop key={i} size={70} color={CREAM} />
      ))}
    </div>
  </div>
);

// Chat bubble geometry, so the tap can land on the preview
export const BUBBLE = { left: 60, top: 400, width: 900, pad: 44 };
export const PREVIEW_CENTER = { x: BUBBLE.left + BUBBLE.width / 2, y: 868 };

export const ChatScreen: React.FC<{ lines: string[]; sinceIn: number; fps: number }> = ({ lines, sinceIn, fps }) => {
  const pop = spring({ frame: sinceIn, fps, config: { damping: 14, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", inset: 0, background: SCREEN_BG, color: CREAM, fontFamily: jakartaWithGlyphs }}>
      <div style={{ position: "absolute", top: 50, left: 70, fontSize: 40, fontWeight: 500, color: cream(0.9) }}>6:01</div>
      {/* header */}
      <div style={{ position: "absolute", top: 150, left: 60, fontSize: 90, lineHeight: 1, color: cream(0.85) }}>‹</div>
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 150,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: CREAM,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <KolamLoop size={76} color="#9E3424" />
      </div>
      <div style={{ position: "absolute", top: 150, left: 330, fontFamily: tenor, fontSize: 72, lineHeight: 1.1 }}>Paati</div>
      <div style={{ position: "absolute", top: 238, left: 332, fontSize: 38, color: cream(0.55) }}>online</div>
      <div style={{ position: "absolute", top: 330, left: 0, width: "100%", height: 2, background: cream(0.1) }} />

      {/* the incoming share */}
      <div
        style={{
          position: "absolute",
          left: BUBBLE.left,
          top: BUBBLE.top,
          width: BUBBLE.width,
          boxSizing: "border-box",
          padding: BUBBLE.pad,
          borderRadius: "14px 48px 48px 48px",
          background: CREAM,
          color: MAROON,
          transformOrigin: "top left",
          scale: String(interpolate(pop, [0, 1], [0.6, 1])),
          opacity: Math.min(1, pop * 1.4),
        }}
      >
        {lines.map((l) => (
          <div key={l} style={{ fontSize: 42, lineHeight: "60px", fontWeight: 500 }}>
            {l}
          </div>
        ))}
        <Img
          src={staticFile("og-card.png")}
          style={{ display: "block", marginTop: 28, width: BUBBLE.width - BUBBLE.pad * 2, borderRadius: 26 }}
        />
        <div style={{ marginTop: 22, fontSize: 40, fontWeight: 500 }}>Sikku Kolam Tetris</div>
        <div style={{ marginTop: 6, fontSize: 34, opacity: 0.6 }}>kolam-tetris.vercel.app</div>
        <div style={{ marginTop: 8, fontSize: 30, opacity: 0.45, textAlign: "right" }}>6:01</div>
      </div>

      {/* composer */}
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 1740,
          height: 110,
          borderRadius: 55,
          background: cream(0.08),
          border: `2px solid ${cream(0.12)}`,
          boxSizing: "border-box",
          padding: "0 44px",
          display: "flex",
          alignItems: "center",
          fontSize: 40,
          color: cream(0.35),
        }}
      >
        Message
      </div>
    </div>
  );
};
