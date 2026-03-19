import { cpSync, mkdirSync, rmSync } from "node:fs";

// 1. Clean and recreate dist
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/icons", { recursive: true });

// 2. Build TypeScript sources
const result = await Bun.build({
  entrypoints: [
    "src/service-worker.ts",
    "../../packages/shared/src/content-youtube.ts",
  ],
  outdir: "dist",
  target: "browser",
  format: "esm",
  splitting: false,
  minify: true,
  naming: "[name].js",
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log(`Built ${result.outputs.length} files to dist/`);

// 3. Copy public/ → dist/
cpSync("public", "dist", { recursive: true });
console.log("Copied public/ → dist/");
