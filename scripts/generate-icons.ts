/**
 * Re-render `public/icons/sound-off-filled-svgrepo-com.svg` into 16/48/128 PNGs
 * (white-filled for dark backgrounds). Runs on Node via `--experimental-strip-types`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { Resvg } from "@resvg/resvg-js";

const here = import.meta.dirname;
const iconsDir = path.resolve(here, "..", "public", "icons");
const svgPath = path.resolve(iconsDir, "sound-off-filled-svgrepo-com.svg");
const svgSource = readFileSync(svgPath, "utf-8");

// Switch the fill so the icon shows up on dark Chrome toolbars.
const svgWhite = svgSource.replaceAll('fill="#000000"', 'fill="#ffffff"');

for (const size of [16, 48, 128]) {
  const resvg = new Resvg(svgWhite, {
    fitTo: { mode: "width", value: size },
  });
  const png = resvg.render().asPng();
  const outPath = path.resolve(iconsDir, `icon-${size}.png`);
  writeFileSync(outPath, png);
  process.stdout.write(`Created ${outPath} (${size}x${size})\n`);
}
