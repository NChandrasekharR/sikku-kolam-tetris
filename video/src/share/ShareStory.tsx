// "Your kolam travels": a game ends, the score is shared, an ant carries it
// to Paati, she plays, and the share network blooms into a kolam.

import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { GameOverOverlay, SHARE_BTN_CENTER, StartOverlay } from "../Chrome";
import { CREAM, cream, jakarta, jakartaWithGlyphs, tenor } from "../fonts";
import { GameScreen } from "../GameScreen";
import { timeline } from "../KolamTetris";
import { PAGE_SCALE } from "../game/constants";
import { OVERLAY_FADE, PRESS } from "../game/timeline";
import { getFrameView } from "../game/view";
import { ANT_FEET_Y, ANT_NOTE_AT, ANT_W, Ant, KolamLoop, Note } from "./Ant";
import * as B from "./beats";
import { endgameView } from "./endgame";
import { Network } from "./Network";
import { ChatScreen, LockScreen, PREVIEW_CENTER } from "./PaatiScreen";
import { Phone, TapRipple } from "./Phone";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const inOut = Easing.bezier(0.45, 0, 0.55, 1);
const out = Easing.bezier(0.16, 1, 0.3, 1);

const ANT_SCALE = 0.9;
const PHONE_RADIUS = 112;
const PAATI_TETRIS = B.PAATI_TETRIS_FRAME(timeline);
// Paati's Start button (page px, from the measured layout) and when she taps it
const START_BTN = { x: 216 * PAGE_SCALE, y: 429.5 * PAGE_SCALE };
const PAATI_START_TAP = B.PAATI_MAP_IN[0] + 34;

const NET_TARGET = { x: (B.MY_PHONE_X + B.PAATI_PHONE_X) / 2, y: B.PHONE_Y + (960 - B.netCenter(4, 0).y) / 0.25 };

// Close-up on Paati's phone so the chat is readable (ant still in frame)
const PUSH = { cx: 2080, cy: B.PHONE_Y, z: 1.45 };

type Cam = { cx: number; cy: number; z: number };
const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({
  cx: a.cx + (b.cx - a.cx) * t,
  cy: a.cy + (b.cy - a.cy) * t,
  z: Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * t),
});

const camera = (f: number): Cam => {
  if (f < B.ZOOM_START) {
    const walk = { cx: B.MY_PHONE_X + B.camOffset(f), cy: 960, z: 1 };
    const push = interpolate(f, [B.NOTE_FLY + 10, B.PING + 16], [0, 1], { ...clamp, easing: inOut });
    return lerpCam(walk, PUSH, push);
  }
  const t = interpolate(f, [B.ZOOM_START, B.ZOOM_END], [0, 1], { ...clamp, easing: inOut });
  return lerpCam(PUSH, { cx: NET_TARGET.x, cy: NET_TARGET.y, z: 0.25 }, t);
};

const antPos = (f: number) => {
  const x = B.antX(f);
  return { left: x - (ANT_W * ANT_SCALE) / 2, top: B.ANT_Y - ANT_FEET_Y * ANT_SCALE };
};
const antBack = (f: number) => {
  const p = antPos(f);
  return { x: p.left + ANT_NOTE_AT.x * ANT_SCALE, y: p.top + ANT_NOTE_AT.y * ANT_SCALE };
};

const ShareBubble: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  if (f < B.BUBBLE_IN || f >= B.NOTE_LAND) return null;
  const pop = spring({ frame: f - B.BUBBLE_IN, fps, config: { damping: 13, stiffness: 140 } });
  const m = interpolate(f, [B.BUBBLE_FOLD, B.NOTE_LAND], [0, 1], { ...clamp, easing: inOut });
  // the message shrinks into the folded note and drops to the floor in an arc
  const from = { x: 540, y: 520 };
  const to = { x: B.NOTE_X, y: B.ANT_Y - 32 };
  const x = from.x + (to.x - from.x) * m;
  const y = from.y + (to.y - from.y) * m - Math.sin(Math.PI * m) * 160;
  const w = 940 + (84 - 940) * m;
  const h = 300 + (84 * 0.72 - 300) * m;
  const text = interpolate(m, [0, 0.3], [1, 0], clamp);
  const loop = interpolate(m, [0.5, 1], [0, 1], clamp);
  const popScale = interpolate(pop, [0, 1], [0.4, 1]);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0 }}>
      <div
        style={{
          position: "absolute",
          left: -w / 2,
          top: -h / 2,
          width: w,
          height: h,
          transform: `translateY(${(1 - pop) * 80}px) scale(${popScale}) rotate(${-14 * m}deg)`,
          opacity: Math.min(1, pop * 1.5),
          borderRadius: 52 + (12 - 52) * m,
          background: CREAM,
          boxShadow: "0 30px 80px rgba(40, 8, 12, 0.35)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "#4A1219",
          fontFamily: jakartaWithGlyphs,
          overflow: "visible",
        }}
      >
        {text > 0 ? (
          <div style={{ opacity: text, width: 940 - 128, scale: String(w / 940) }}>
            {B.shareLines().map((l, i) => (
              <div key={i} style={{ fontSize: i === 0 ? 42 : 38, lineHeight: "62px", fontWeight: i === 0 ? 600 : 500, opacity: i === 2 ? 0.7 : 1 }}>
                {l}
              </div>
            ))}
          </div>
        ) : null}
        {loop > 0 ? (
          <div style={{ position: "absolute", opacity: loop }}>
            <KolamLoop size={w * 0.42} color="#9E3424" />
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            left: w / 2 - 26,
            bottom: -22,
            width: 52,
            height: 52,
            background: CREAM,
            transform: "rotate(45deg)",
            borderRadius: 8,
            opacity: text,
          }}
        />
      </div>
    </div>
  );
};

const MyScreen: React.FC<{ f: number }> = ({ f }) => (
  <>
    <GameScreen
      view={endgameView(B.endgame, f)}
      particles={B.endgame.particles}
      particleFrame={f}
      overlay={
        f >= B.CARD_IN ? (
          <GameOverOverlay
            opacity={interpolate(f, [B.CARD_IN, B.CARD_IN + 19], [0, 1], { ...clamp, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })}
            score={B.endgame.score}
            sharePress={interpolate(f, [B.TAP_SHARE, B.TAP_SHARE + 6, B.TAP_SHARE + 20], [0, 1, 0], clamp)}
          />
        ) : null
      }
    />
    <TapRipple x={SHARE_BTN_CENTER.x * PAGE_SCALE} y={SHARE_BTN_CENTER.y * PAGE_SCALE} t={f - B.TAP_SHARE} />
  </>
);

const PaatiScreen: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const chat = interpolate(f, [B.PING, B.PING + 10], [0, 1], clamp);
  const game = interpolate(f, [B.GAME_IN, B.GAME_IN + 8], [0, 1], clamp);
  const src = B.paatiSourceFrame(f);
  return (
    <>
      <LockScreen />
      {chat > 0 && game < 1 ? (
        <div style={{ position: "absolute", inset: 0, opacity: chat }}>
          <ChatScreen lines={B.shareLines()} sinceIn={f - B.CHAT_IN} fps={fps} />
          <TapRipple x={PREVIEW_CENTER.x} y={PREVIEW_CENTER.y} t={f - B.TAP_LINK} />
        </div>
      ) : null}
      {game > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: game }}>
          <GameScreen
            view={getFrameView(timeline, Math.floor(src))}
            particles={timeline.particles}
            particleFrame={src}
            overlay={src < PRESS + OVERLAY_FADE ? <StartOverlay frame={src} /> : null}
          />
          <TapRipple x={START_BTN.x} y={START_BTN.y} t={f - PAATI_START_TAP} />
        </div>
      ) : null}
    </>
  );
};

export const ShareStory: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = camera(f);

  // My phone: full-bleed game, then the camera pulls back to the phone
  const pull = interpolate(f, [B.PULL_START, B.PULL_END], [0, 1], { ...clamp, easing: inOut });
  const collapse = interpolate(f, [B.ZOOM_END, B.COLLAPSE_END], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  const phoneScale = interpolate(pull, [0, 1], [1, B.PHONE_SCALE]) * collapse;
  const floorFade = interpolate(f, [B.ZOOM_START, B.ZOOM_START + 45], [1, 0], clamp);

  // Ant: trots in, picks up the note, carries it to Paati, celebrates
  const ant = antPos(f);
  const walking = (f > B.ANT_ENTER && f < B.ANT_AT_NOTE) || (f > B.PICKUP_END && f < B.ANT_ARRIVE - 2);
  const phase = (B.antX(f) / 70) * Math.PI * 2;
  const pickedUp = f >= B.ANT_AT_NOTE + 20 && f < B.NOTE_FLY;
  const hopT = (f - (PAATI_TETRIS + 4)) / 18;
  const hop = hopT > 0 && hopT < 2 ? Math.abs(Math.sin(Math.PI * hopT)) * (hopT < 1 ? 1 : 0.55) : 0;
  const blink = f > B.ANT_ARRIVE && (f - B.ANT_ARRIVE) % 150 > 142;

  // The note on its journey: floor -> ant's back -> into Paati's phone
  let note: { x: number; y: number; s: number; r: number; o: number } | null = null;
  const floorNote = { x: B.NOTE_X, y: B.ANT_Y - 32 };
  if (f >= B.NOTE_LAND && f < B.ANT_AT_NOTE + 6) note = { ...floorNote, s: 1, r: -14, o: 1 };
  else if (f >= B.ANT_AT_NOTE + 6 && f < B.ANT_AT_NOTE + 20) {
    const t = (f - B.ANT_AT_NOTE - 6) / 14;
    const b = antBack(f);
    note = { x: floorNote.x + (b.x - floorNote.x) * t, y: floorNote.y + (b.y - floorNote.y) * t - Math.sin(Math.PI * t) * 70, s: 1, r: -14 + 7 * t, o: 1 };
  } else if (f >= B.NOTE_FLY && f < B.PING + 4) {
    const t = interpolate(f, [B.NOTE_FLY, B.PING], [0, 1], { ...clamp, easing: inOut });
    const b = antBack(B.NOTE_FLY);
    const dst = { x: B.PAATI_PHONE_X, y: 960 };
    note = { x: b.x + (dst.x - b.x) * t, y: b.y + (dst.y - b.y) * t - Math.sin(Math.PI * t) * 260, s: 1 - 0.5 * t, r: -7 + 20 * t, o: f > B.PING ? 0 : 1 };
  }

  const sparkle = f - (PAATI_TETRIS + 6);
  const captionO = interpolate(f, [B.CAPTION_IN, B.CAPTION_IN + 30, B.CAPTION_OUT, B.CAPTION_OUT + 25], [0, 1, 1, 0], clamp);
  const titleT = interpolate(f, [B.TITLE_IN, B.TITLE_IN + 36], [0, 1], { ...clamp, easing: out });
  const antsOpacity = floorFade;

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 46%, #B44332 0%, #9E3424 54%, #7A2316 100%)" }}>
      <AbsoluteFill
        style={{
          opacity: 0.34,
          backgroundImage: `radial-gradient(${cream(0.08)} 2.5px, transparent 0), radial-gradient(rgba(30, 5, 12, 0.15) 2.5px, transparent 0)`,
          backgroundSize: "55px 55px, 37.5px 37.5px",
          backgroundPosition: "0 0, 17.5px 27.5px",
        }}
      />

      {/* the world, seen through the camera */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          transformOrigin: "0 0",
          transform: `translate(540px, 960px) scale(${cam.z}) translate(${-cam.cx}px, ${-cam.cy}px)`,
        }}
      >
        {/* floor: a threshold with faint pulli */}
        <div
          style={{
            position: "absolute",
            left: -2000,
            top: B.FLOOR_Y,
            width: 7000,
            height: 1500,
            opacity: floorFade,
            background: "#8A2A1C",
            backgroundImage: `radial-gradient(${cream(0.09)} 4px, transparent 0)`,
            backgroundSize: "90px 90px",
            borderTop: `3px solid ${cream(0.12)}`,
          }}
        />
        {B.TRAIL_DOTS.map((d, i) => {
          const t = (f - d.at) / 10;
          if (t < 0) return null;
          const s = t >= 1 ? 1 : 1 + 0.4 * Math.sin(Math.PI * t);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: d.x - 9,
                top: B.ANT_Y + 14,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: CREAM,
                opacity: 0.85 * floorFade,
                scale: String(s),
              }}
            />
          );
        })}

        <Phone x={B.MY_PHONE_X} y={interpolate(pull, [0, 1], [960, B.PHONE_Y])} scale={phoneScale} radius={PHONE_RADIUS * pull} opacity={collapse > 0 ? 1 : 0}>
          <MyScreen f={f} />
        </Phone>
        {f >= B.PICKUP_END ? (
          <Phone x={B.PAATI_PHONE_X} y={B.PHONE_Y} scale={B.PHONE_SCALE * collapse} radius={PHONE_RADIUS} opacity={collapse > 0 ? 1 : 0}>
            <PaatiScreen f={f} fps={fps} />
          </Phone>
        ) : null}

        {f >= B.ANT_ENTER ? (
          <div style={{ position: "absolute", left: ant.left, top: ant.top, transformOrigin: "0 0", scale: String(ANT_SCALE), opacity: antsOpacity }}>
            <Ant phase={phase} walking={walking} carry={pickedUp ? "note" : null} hop={hop} blink={blink} />
          </div>
        ) : null}
        {note ? (
          <div style={{ position: "absolute", left: note.x - 42, top: note.y - 30, transform: `scale(${note.s}) rotate(${note.r}deg)`, opacity: note.o }}>
            <Note width={84} />
          </div>
        ) : null}

        {/* Paati's Tetris: the ant hops and little loops float up */}
        {sparkle > 0 && sparkle < 50
          ? [-70, 10, 90].map((dx, i) => {
              const t = (sparkle - i * 5) / 40;
              if (t < 0 || t > 1) return null;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: B.ANT_STOP_X + dx - 22,
                    top: B.ANT_Y - 230 - 120 * t - (i === 1 ? 40 : 0),
                    opacity: Math.sin(Math.PI * t),
                    scale: String(0.6 + 0.6 * t),
                  }}
                >
                  <KolamLoop size={44} color={CREAM} />
                </div>
              );
            })
          : null}

        <ShareBubble f={f} fps={fps} />
      </div>

      {/* 5. the share network, woven as a kolam */}
      {f >= B.ZOOM_END - 10 ? (
        <Network
          frame={f}
          gridOpacity={interpolate(f, [B.ZOOM_END - 10, B.COLLAPSE_END + 10], [0, 1], clamp)}
          seedDot={interpolate(f, [B.ZOOM_END + 8, B.COLLAPSE_END], [0, 1], clamp)}
        />
      ) : null}

      {/* 3. caption while the ant walks */}
      {captionO > 0 ? (
        <div style={{ position: "absolute", top: 200, width: "100%", textAlign: "center", color: CREAM, opacity: captionO }}>
          <div style={{ fontFamily: tenor, fontSize: 72, lineHeight: "88px", letterSpacing: "0.02em" }}>
            A kolam was always
            <br />
            meant to be shared
          </div>
          <div style={{ marginTop: 26, fontFamily: jakarta, fontSize: 40, color: cream(0.75) }}>
            Drawn in rice flour, so the ants could eat.
          </div>
        </div>
      ) : null}

      {/* 5. title */}
      {titleT > 0 ? (
        <>
          <div
            style={{
              position: "absolute",
              top: 300,
              width: "100%",
              textAlign: "center",
              fontFamily: jakarta,
              fontSize: 30,
              letterSpacing: "0.34em",
              textIndent: "0.34em",
              color: cream(0.65),
              opacity: titleT,
            }}
          >
            SIKKU KOLAM TETRIS
          </div>
          <div style={{ position: "absolute", top: 1450, width: "100%", textAlign: "center", color: CREAM, opacity: titleT, translate: `0px ${(1 - titleT) * 40}px` }}>
            <div style={{ fontFamily: tenor, fontSize: 124, lineHeight: 1, letterSpacing: "0.03em" }}>Pass it on</div>
            <div style={{ marginTop: 40, fontFamily: jakarta, fontSize: 44, letterSpacing: "0.06em", color: cream(0.85) }}>
              kolam-tetris.vercel.app
            </div>
          </div>
        </>
      ) : null}

      {/* a little procession across the bottom to close */}
      {f >= B.ANTS_MARCH
        ? [0, 1, 2].map((i) => {
            const x = -200 + (f - B.ANTS_MARCH) * 6 - i * 190;
            if (x < -260 || x > 1200) return null;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: 1850 - ANT_FEET_Y * 0.58, transformOrigin: "0 0", scale: "0.58" }}>
                <Ant phase={(x / 70) * Math.PI * 2 + i} walking carry="grain" />
              </div>
            );
          })
        : null}

      <Audio src={staticFile("share-sfx.wav")} />
    </AbsoluteFill>
  );
};
