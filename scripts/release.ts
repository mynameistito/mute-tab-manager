import { $ } from "bun";
import chromePkg from "../apps/chrome/package.json";
import firefoxPkg from "../apps/firefox/package.json";
import sharedPkg from "../packages/shared/package.json";

const versions = [chromePkg.version, firefoxPkg.version, sharedPkg.version];
if (new Set(versions).size !== 1) {
  throw new Error(`Package versions are out of sync: ${versions.join(", ")}`);
}

const version = versions[0];
if (!version) {
  throw new Error(
    "Version is undefined — package.json may be missing a version field."
  );
}
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
