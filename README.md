# Sikku Kolam Tetris

A Tetris where every block is a sikku kolam loop. Each side of a block's
loop checks one neighbour: an empty side curves back around the pulli
(dot), a filled side runs out at 45° and crosses the neighbour's line.
Stack the pieces and they weave into one rice-flour pattern. Every move
plays a note from Raga Mohanam.

**Play it: https://kolam-tetris.vercel.app**

| Folder | What it is |
| --- | --- |
| [`site/`](site) | The game. Static files, no build step. This is what deploys. |
| [`video/`](video) | Remotion project for the gameplay video, the thread diagram and the link-preview card. |

## Deploy (Vercel)

Import the repo and set **Root Directory** to `site`, framework preset
**Other**, no build command. Or from a checkout: `cd site && npx vercel --prod`.

Link previews (Open Graph and X card tags in `site/index.html`) point at
`https://kolam-tetris.vercel.app`. If the domain changes, update the
`canonical`, `og:url`, `og:image` and `twitter:image` URLs to match.

## Controls

Keyboard: arrows or WASD to move and rotate, Space to hard drop, C or Shift
to hold, P to pause. G ghost, T weave mode, I ink, B background, M sound.

Touch: tap to rotate, swipe to move, drag down to soft drop, flick down to
hard drop, flick up (or tap the HOLD piece) to hold.
