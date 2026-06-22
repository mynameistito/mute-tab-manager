/**
 * Build and publish both browser zips to a GitHub release tagged `v<version>`.
 * Runs on Node. Requires `gh` CLI to be authenticated.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const here = import.meta.dirname;
const root = path.resolve(here, "..");

const run = (cmd: string, args?: string[]): string =>
  execFileSync(cmd, args ?? [], {
    cwd: root,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

const runInherit = (cmd: string, args?: string[]): void => {
  execFileSync(cmd, args, { cwd: root, stdio: "inherit" });
};

interface PackageJson {
  readonly version: string;
}

const pkg = JSON.parse(
  readFileSync(path.resolve(root, "package.json"), "utf-8")
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

const chromeZip = path.resolve(
  root,
  ".output",
  `mute-tab-manager-${pkg.version}-chrome.zip`
);
const firefoxZip = path.resolve(
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
