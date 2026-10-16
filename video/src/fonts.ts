import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Bundled from Google Fonts (latin subset); Plus Jakarta Sans is variable
export const jakarta = "Plus Jakarta Sans";
export const tenor = "Tenor Sans";
for (const weight of ["300", "400", "500"]) {
  loadFont({ family: jakarta, url: staticFile("fonts/PlusJakartaSans-latin.woff2"), weight });
}
loadFont({ family: tenor, url: staticFile("fonts/TenorSans-latin.woff2"), weight: "400" });

export const CREAM = "#F6EFE2";
export const cream = (a: number) => `rgba(246, 239, 226, ${a})`;
