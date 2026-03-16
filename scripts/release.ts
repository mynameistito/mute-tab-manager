import { $ } from "bun";
import pkg from "../package.json";

const version = pkg.version;
const tag = `v${version}`;

const existing = await $`gh release view ${tag}`.nothrow();
if (existing.exitCode === 0) {
  console.log(`Release ${tag} already exists — skipping.`);
  process.exit(0);
}

await $`bun run build`;
await $`rm -f chrome-mute-tab.zip`;
await $`cd dist && zip -r ../chrome-mute-tab.zip . && cd ..`;
await $`gh release create ${tag} chrome-mute-tab.zip --title ${tag} --generate-notes`;
