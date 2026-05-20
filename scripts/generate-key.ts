/**
 * Generate (or re-derive) an RSA private key used to give the Chrome extension
 * a stable, persistent extension ID across machines and reloads.
 *
 * - Writes `key.pem` (PEM-encoded PKCS#8 RSA-2048 private key) if missing.
 * - Derives the SPKI public key (DER), base64-encodes it for the manifest `key`
 *   field, computes the deterministic extension ID (SHA-256 of DER pubkey →
 *   first 32 hex chars → mapped 0-f → a-p), and writes both to
 *   `extension-key.json` for `wxt.config.ts` to consume at build time.
 *
 * Runs on Node (uses `node:crypto` + `node:fs`).
 */
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
} from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const keyPath = resolve(root, "key.pem");
const outPath = resolve(root, "extension-key.json");

function loadOrCreatePrivateKey(): string {
  if (existsSync(keyPath)) {
    return readFileSync(keyPath, "utf8");
  }
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ format: "pem", type: "pkcs8" }).toString();
  writeFileSync(keyPath, pem, { mode: 0o600 });
  return pem;
}

function deriveExtensionId(spkiDer: Buffer): string {
  const hash = createHash("sha256").update(spkiDer).digest("hex").slice(0, 32);
  let id = "";
  for (const ch of hash) {
    id += String.fromCharCode("a".charCodeAt(0) + Number.parseInt(ch, 16));
  }
  return id;
}

const privateKeyPem = loadOrCreatePrivateKey();
const publicKey = createPublicKey(createPrivateKey(privateKeyPem));
const spkiDer = publicKey.export({ format: "der", type: "spki" }) as Buffer;
const manifestKey = spkiDer.toString("base64");
const extensionId = deriveExtensionId(spkiDer);

const payload = {
  manifestKey,
  extensionId,
};

writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);

process.stdout.write(`Extension ID: ${extensionId}\n`);
process.stdout.write(`Wrote ${outPath}\n`);
