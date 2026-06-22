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
import { createHash, createPublicKey, generateKeyPairSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const here = import.meta.dirname;
const root = path.resolve(here, "..");
const keyPath = path.resolve(root, "key.pem");
const outPath = path.resolve(root, "extension-key.json");
const extensionIdAlphabetStart = "a".codePointAt(0) ?? 97;

const loadOrCreatePrivateKey = (): string => {
  if (existsSync(keyPath)) {
    return readFileSync(keyPath, "utf-8");
  }
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ format: "pem", type: "pkcs8" }).toString();
  writeFileSync(keyPath, pem, { mode: 0o600 });
  return pem;
};

const deriveExtensionId = (spkiDer: Buffer): string => {
  const hash = createHash("sha256").update(spkiDer).digest("hex").slice(0, 32);
  let id = "";
  for (const ch of hash) {
    id += String.fromCodePoint(
      extensionIdAlphabetStart + Number.parseInt(ch, 16)
    );
  }
  return id;
};

const privateKeyPem = loadOrCreatePrivateKey();
const publicKey = createPublicKey(privateKeyPem);
const spkiDer = publicKey.export({ format: "der", type: "spki" }) as Buffer;
const manifestKey = spkiDer.toString("base64");
const extensionId = deriveExtensionId(spkiDer);

const payload = {
  extensionId,
  generatedAt: new Date().toISOString(),
  manifestKey,
};

writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);

process.stdout.write(`Extension ID: ${extensionId}\n`);
process.stdout.write(`Wrote ${outPath}\n`);
