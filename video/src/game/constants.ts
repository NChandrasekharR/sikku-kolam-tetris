// Ported verbatim from kolam_polka_dot_tetris.html

export const COLS = 10;
export const ROWS = 20;
export const RICE_FLOUR_HEX = "#F6EFE2";

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export const PALETTE: Record<PieceType, string> = {
  I: "#F6EFE2", // Chandan / Ivory Rice Flour
  O: "#F2C14E", // Haldi / Turmeric Gold
  T: "#FF857A", // Kumkum Coral / Soft Vermilion
  S: "#88C48B", // Mehendi / Fresh Henna Leaf
  Z: "#F79D5C", // Kesari / Marigold Saffron
  J: "#7AB8D6", // Neel / Mysore Sky Indigo
  L: "#C8B8DB", // Mallika / Jasmine Lavender
};

export const SHAPES: Record<PieceType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

export const CLEAR_ANIM_DURATION = 430;

export const getDropInterval = (lvl: number) =>
  Math.max(95, 840 - (lvl - 1) * 65);

// Simulation runs at the browser's native rAF rate so per-frame particle
// physics behaves exactly as in the original p5 draw loop.
export const FPS = 60;
export const DT = 1000 / FPS;

// Page layout measured from the original at a 432x768 CSS viewport (phone
// layout), rendered at 2.5x to fill 1080x1920.
export const PAGE_W = 432;
export const PAGE_H = 768;
export const PAGE_SCALE = 2.5;
export const CELL = 27;
export const BOARD_X = 81; // page px (canvas x 10 + boardX 71)
export const BOARD_Y = 149.98; // page px (canvas y 129.98 + boardY 20)
export const BOARD_W = CELL * COLS;
export const BOARD_H = CELL * ROWS;
