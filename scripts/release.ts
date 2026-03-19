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

const chromeZip = `mute-tab-chrome-v${version}.zip`;
const firefoxZip = `mute-tab-firefox-v${version}.zip`;

await $`rm -f ${chromeZip} ${firefoxZip}`;
await $`cd apps/chrome/dist && zip -r ../../../${chromeZip} . && cd ../../..`;
await $`cd apps/firefox/dist && zip -r ../../../${firefoxZip} . && cd ../../..`;

await $`gh release create ${tag} ${chromeZip} ${firefoxZip} --title ${tag} --generate-notes`;
