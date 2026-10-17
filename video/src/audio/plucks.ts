// Note events for the game's Raga Mohanam synth (RagaSoundEngine in the
// original). Pure data, shared by the compositions and the offline renderer.

export const NOTE = {
  Sa3: 130.81,
  Pa3: 196.0,
  Sa4: 261.63,
  Re4: 293.66,
  Ga4: 329.63,
  Pa4: 392.0,
  Dha4: 440.0,
  Sa5: 523.25,
  Re5: 587.33,
  Ga5: 659.25,
  Pa5: 783.99,
};

// One playPluck(): sine fundamental, optional triangle an octave up
export type Pluck = { t: number; freq: number; dur: number; vol: number; harmonic: boolean };

export const pluck = (t: number, freq: number, dur = 0.18, vol = 0.07, harmonic = true): Pluck => ({
  t,
  freq,
  dur,
  vol,
  harmonic,
});

export const CLEAR_PHRASE = [NOTE.Sa4, NOTE.Re4, NOTE.Ga4, NOTE.Pa4, NOTE.Dha4, NOTE.Sa5, NOTE.Ga5];
const GAME_OVER_DESCENT = [NOTE.Sa5, NOTE.Dha4, NOTE.Pa4, NOTE.Ga4, NOTE.Re4, NOTE.Sa4];

export type GameSound = "move" | "rotate" | "softDrop" | "lock" | "hardDrop" | "hold" | "clear" | "gameOver";

// The original's sound methods, including their setTimeout offsets
export const gamePlucks = (kind: GameSound, t: number, count = 1): Pluck[] => {
  switch (kind) {
    case "move":
      return [pluck(t, NOTE.Sa4, 0.08, 0.04, false)];
    case "rotate":
      return [pluck(t, NOTE.Ga4, 0.14, 0.055, true)];
    case "softDrop":
      return [pluck(t, NOTE.Re4, 0.06, 0.03, false)];
    case "lock":
      return [pluck(t, NOTE.Pa3, 0.16, 0.065, true)];
    case "hardDrop":
      return [pluck(t, NOTE.Sa4, 0.18, 0.08, true), pluck(t + 0.03, NOTE.Sa3, 0.24, 0.08, false)];
    case "hold":
      return [pluck(t, NOTE.Pa4, 0.12, 0.05, false), pluck(t + 0.055, NOTE.Ga4, 0.15, 0.05, false)];
    case "clear": {
      const n = Math.min(CLEAR_PHRASE.length, count + 3);
      return CLEAR_PHRASE.slice(0, n).map((f, i) => pluck(t + i * 0.065, f, 0.42, 0.075, true));
    }
    case "gameOver":
      return GAME_OVER_DESCENT.map((f, i) => pluck(t + i * 0.11, f, 0.36, 0.06, true));
  }
};
