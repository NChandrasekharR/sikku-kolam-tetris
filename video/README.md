# Sikku Kolam Tetris — video and images

A Remotion project that renders the gameplay video (1080×1920, 60fps) and
the thread images. The game is re-implemented as a deterministic
simulation played by a bot, so every frame is a pure function of the
frame number.

- `src/game/` — engine (faithful port of the original rules), bot, timeline
- `src/render/kolam.ts` — Canvas2D port of the p5 sikku kolam renderer
- `src/Chrome.tsx` — header, stats and start overlay at the original's phone layout
- `src/WeaveDiagram.tsx` — "how the pieces weave" image for the thread
- `src/OgCard.tsx` — 1200×630 link-preview card (`site/og-card.png` is downscaled from it)
- `scripts/render-audio.ts` — renders the Raga Mohanam pluck synth offline to `public/sfx.wav`
- `scripts/search-seeds.ts` — finds seeds that play clean and end on a Tetris

```bash
npm install
npm run dev       # Remotion Studio (run `npm run audio` first for sound)
npm run render    # synthesizes audio, then renders out/kolam-tetris.mp4
npm run diagram   # out/weave-diagram.png (3200×1800)
npm run card      # out/og-card@2x.png (2400×1260)
```

The game played in the video is fixed by `SEED` in `src/game/config.ts`.
Any change to the seed or to `src/game/bot.ts` changes the game, so the
audio has to be regenerated (`npm run render` does this automatically).
