/**
 * Build and publish both browser zips to a GitHub release tagged `v<version>`.
 * Runs on Node. Requires `gh` CLI to be authenticated.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

function run(cmd: string, args?: string[]): string {
  return execFileSync(cmd, args, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  })
    .toString()
    .trim();
}

function runInherit(cmd: string, args?: string[]): void {
  execFileSync(cmd, args, { cwd: root, stdio: "inherit" });
}

interface PackageJson {
  readonly version: string;
}

const pkg = JSON.parse(
  readFileSync(resolve(root, "package.json"), "utf8")
) as PackageJson;
const tag = `v${pkg.version}`;

try {
  run("gh", ["release", "view", tag]);
  process.stdout.write(`Release ${tag} already exists - skipping.\n`);
  process.exit(0);
} catch (error) {
  const err = error as Error & { stderr?: string };
  const isNotFound =
    typeof err.stderr === "string" &&
    (err.stderr.includes("no release found") ||
      err.stderr.includes("release not found"));
  if (!isNotFound) {
    throw error;
  }
}

runInherit("bun", ["run", "build"]);
runInherit("bun", ["run", "zip"]);

const chromeZip = resolve(
  root,
  ".output",
  `mute-tab-manager-${pkg.version}-chrome.zip`
);
const firefoxZip = resolve(
  root,
  ".output",
  `mute-tab-manager-${pkg.version}-firefox.zip`
);

for (const zip of [chromeZip, firefoxZip]) {
  if (!existsSync(zip)) {
    throw new Error(`Missing build artifact: ${zip}`);
  }
}

runInherit("gh", [
  "release",
  "create",
  tag,
  chromeZip,
  firefoxZip,
  "--title",
  tag,
  "--generate-notes",
]);
