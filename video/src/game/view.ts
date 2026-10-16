import { DT, CLEAR_ANIM_DURATION, PieceType } from "./constants";
import { Grid, Piece, createEmptyGrid } from "./engine";
import { DISSOLVE_FRAMES, DISSOLVE_START, GAME_START, Timeline } from "./timeline";

export type FrameView = {
  grid: Grid;
  clearingRows: number[];
  clearProgress: number;
  piece: Piece | null;
  ghostY: number;
  playing: boolean;
  wave: boolean;
  holdType: PieceType | null;
  nextType: PieceType | null;
  canHold: boolean;
  score: number;
  lines: number;
  level: number;
};

const ALL_ROWS = Array.from({ length: 20 }, (_, i) => i);
const EMPTY = createEmptyGrid();

export const getFrameView = (tl: Timeline, frame: number): FrameView => {
  if (frame < GAME_START) {
    // Start screen: seeded mandala, then dissolves like a full-board clear
    const dissolving = frame >= DISSOLVE_START && frame < DISSOLVE_START + DISSOLVE_FRAMES;
    const gone = frame >= DISSOLVE_START + DISSOLVE_FRAMES;
    return {
      grid: gone ? EMPTY : tl.introGrid,
      clearingRows: dissolving ? ALL_ROWS : [],
      clearProgress: dissolving ? ((frame - DISSOLVE_START) * DT) / CLEAR_ANIM_DURATION : 0,
      piece: null,
      ghostY: 0,
      playing: false,
      wave: false,
      holdType: "I",
      nextType: "T",
      canHold: true,
      score: 0,
      lines: 0,
      level: 1,
    };
  }
  const snaps = tl.run.snapshots;
  const s = snaps[Math.min(frame - GAME_START, snaps.length - 1)];
  return {
    grid: s.grid,
    clearingRows: s.clearingRows,
    clearProgress: s.clearProgress,
    piece: s.piece,
    ghostY: s.ghostY,
    playing: s.state === "PLAYING",
    wave: s.state === "CLEARING" && s.clearingRows.length > 0,
    holdType: s.holdType,
    nextType: s.nextType,
    canHold: s.canHold,
    score: s.score,
    lines: s.lines,
    level: s.level,
  };
};
