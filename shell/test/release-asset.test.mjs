import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prefetchPinnedPiGRelease } from "../release-asset.mjs";

const source = "https://github.com/MichaelKinsy/PiG";
const assetUrl = "https://api.github.com/repos/MichaelKinsy/PiG/releases/assets/668083112";
const name = "pig-0.5.3-linux-amd64.tar.gz";
const bytes = Buffer.from("pinned test archive");
const digest = createHash("sha256").update(bytes).digest("hex");
const lock = { pig: { source, version: "0.5.3" } };
const item = { name, sha256: digest };
const metadata = (overrides = {}) => ({
  ok: true,
  json: async () => ({ assets: [{ name, url: assetUrl, digest: "sha256:" + digest, ...overrides }] }),
});
const payload = (data = bytes, contentType = "application/octet-stream") => ({
  ok: true,
  headers: { get: () => contentType },
  arrayBuffer: async () => data,
});

async function sandbox(run) {
  const cache = await mkdtemp(join(tmpdir(), "pig-api-asset-"));
  try { return await run(cache); }
  finally { await rm(cache, { recursive: true, force: true }); }
}

test("no token preserves the original direct-download behavior", async () => sandbox(async cache => {
  let calls = 0;
  const value = await prefetchPinnedPiGRelease({ lock, item, cache, token: "", fetcher: () => { calls++; throw Error("unexpected fetch"); } });
  assert.equal(value, false);
  assert.equal(calls, 0);
}));

test("authenticated API fallback uses one pinned asset, verifies SHA and writes cache atomically", async () => sandbox(async cache => {
  const urls = [];
  const fetcher = async (url, options) => {
    urls.push(url);
    assert.equal(options.headers.Authorization, "Bearer synthetic-token");
    return urls.length === 1 ? metadata() : payload();
  };
  const result = await prefetchPinnedPiGRelease({ lock, item, cache, token: "synthetic-token", fetcher });
  assert.equal(result, true);
  assert.deepEqual(urls, [
    "https://api.github.com/repos/MichaelKinsy/PiG/releases/tags/v0.5.3",
    assetUrl,
  ]);
  assert.deepEqual(await readFile(join(cache, name)), bytes);
}));

test("API outage or metadata instead of bytes returns to the original URL", async () => sandbox(async cache => {
  assert.equal(await prefetchPinnedPiGRelease({
    lock, item, cache, token: "synthetic",
    fetcher: async () => ({ ok: false, status: 503 }),
  }), false);
  assert.equal(await prefetchPinnedPiGRelease({
    lock, item, cache, token: "synthetic",
    fetcher: async url => url.endsWith("v0.5.3") ? metadata() : payload(Buffer.from("{}"), "application/json"),
  }), false);
  await assert.rejects(stat(join(cache, name)), { code: "ENOENT" });
}));

test("digest mismatch in release metadata fails closed without writing cache", async () => sandbox(async cache => {
  await assert.rejects(prefetchPinnedPiGRelease({
    lock, item, cache, token: "synthetic",
    fetcher: async () => metadata({ digest: "sha256:" + "0".repeat(64) }),
  }), /differs from upstream release asset digest/);
  await assert.rejects(stat(join(cache, name)), { code: "ENOENT" });
}));

test("downloaded archive checksum mismatch fails closed without writing cache", async () => sandbox(async cache => {
  await assert.rejects(prefetchPinnedPiGRelease({
    lock, item, cache, token: "synthetic",
    fetcher: async url => url.endsWith("v0.5.3") ? metadata() : payload(Buffer.from("tampered")),
  }), /Checksum mismatch/);
  await assert.rejects(stat(join(cache, name)), { code: "ENOENT" });
}));

test("untrusted asset URL and source cannot redirect the fallback", async () => sandbox(async cache => {
  assert.equal(await prefetchPinnedPiGRelease({
    lock, item, cache, token: "synthetic",
    fetcher: async () => metadata({ url: "https://evil.invalid/file" }),
  }), false);
  await assert.rejects(prefetchPinnedPiGRelease({
    lock: { pig: { ...lock.pig, source: "https://example.invalid/PiG" } },
    item, cache, token: "synthetic",
    fetcher: async () => { throw Error("should not call"); },
  }), /trusted upstream source/);
}));
