/**
 * Optional authenticated GitHub API route for the exact pinned PiG release.
 * This is used only to avoid flaky browser-release HTTP 504 responses.
 * It never changes a source pin, trusts API metadata over the lock, or
 * changes the original direct-download fallback.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const ALLOWED_PIG_SOURCE = "https://github.com/MichaelKinsy/PiG";

export async function prefetchPinnedPiGRelease({
  lock, item, cache, token = process.env.GH_TOKEN,
  fetcher = fetch,
}) {
  if (!token) return false;
  if (lock.pig.source !== ALLOWED_PIG_SOURCE) {
    throw new Error("PiG asset API fallback requires the explicitly trusted upstream source");
  }
  if (!/^[0-9a-f]{64}$/.test(item.sha256) ||
      !/^[a-z0-9.-]+\.tar\.gz$/.test(item.name) ||
      !/^\d+\.\d+\.\d+$/.test(lock.pig.version)) {
    throw new Error("Invalid pinned PiG asset metadata");
  }
  const headers = {
    "Authorization": "Bearer " + token,
    "Accept": "application/vnd.github+json",
    "User-Agent": "pig-agent-pinned-builder",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  let metadata;
  try {
    const reply = await fetcher("https://api.github.com/repos/MichaelKinsy/PiG/releases/tags/v" + lock.pig.version, { headers, signal: AbortSignal.timeout(45_000) });
    if (!reply.ok) return false;
    metadata = await reply.json();
  } catch {
    return false;
  }
  const asset = Array.isArray(metadata?.assets) ? metadata.assets.find(entry => entry.name === item.name) : undefined;
  if (!asset || typeof asset.url !== "string" ||
      !/^https:\/\/api\.github\.com\/repos\/MichaelKinsy\/PiG\/releases\/assets\/\d+$/.test(asset.url)) {
    return false;
  }
  if (asset.digest !== "sha256:" + item.sha256) {
    throw new Error("Pinned PiG SHA-256 differs from upstream release asset digest for " + item.name);
  }

  let bytes;
  try {
    const reply = await fetcher(asset.url, { headers: { ...headers, "Accept": "application/octet-stream" }, signal: AbortSignal.timeout(90_000) });
    if (!reply.ok || (reply.headers.get("content-type") ?? "").includes("json")) return false;
    bytes = Buffer.from(await reply.arrayBuffer());
  } catch {
    return false;
  }
  if (hash(bytes) !== item.sha256) {
    throw new Error("Checksum mismatch for " + item.name + " from the GitHub API");
  }
  const target = path.join(cache, item.name);
  const staged = target + ".api-prefetch-" + process.pid;
  await fs.mkdir(cache, { recursive: true });
  try {
    await fs.writeFile(staged, bytes);
    await fs.rename(staged, target);
  } finally {
    await fs.rm(staged, { force: true }).catch(() => {});
  }
  return true;
}
