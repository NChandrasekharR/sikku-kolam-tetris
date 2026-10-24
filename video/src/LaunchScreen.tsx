// iOS launch image (apple-touch-startup-image): the splash animation's first
// frame, i.e. terracotta with a faint 4x4 pulli grid. Geometry mirrors the
// page's .splash-kolam (64vmin square centred at 50% / 42%). Rendered per
// iPhone size, then palette-quantized (they ship in site/splash/):
//   npx remotion still LaunchScreen out/l.png --width=1170 --height=2532
//   ffmpeg -i out/l.png -vf "split[a][b];[a]palettegen=max_colors=256[p];[b][p]paletteuse=dither=sierra2_4a" \
//     ../site/splash/launch-1170x2532.png

import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

export const LaunchScreen: React.FC = () => {
  const { width, height } = useVideoConfig();
  const k = (0.64 * Math.min(width, height)) / 400; // viewBox unit in px
  const left = width / 2 - 200 * k;
  const top = 0.42 * height - 200 * k;
  const dots: [number, number][] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) dots.push([left + (50 + 100 * c) * k, top + (50 + 100 * r) * k]);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 46%, #B44332 0%, #9E3424 54%, #7A2316 100%)" }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={5 * k} fill="rgba(246,239,226,0.22)" />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
