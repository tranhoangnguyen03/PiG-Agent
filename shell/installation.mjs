import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

export const sha256 = data => createHash("sha256").update(data).digest("hex");
export const exists = p => fs.lstat(p).then(() => true, e => {
  if (e.code === "ENOENT") return false;
  throw e;
});
export const readJSON = async p => JSON.parse(await fs.readFile(p, "utf8"));
export async function writeJSON(p, value) {
  await fs.mkdir(path.dirname(p), { recursive: true, mode: 0o700 });
  const temp = p + "." + randomUUID() + ".tmp";
  await fs.writeFile(temp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  await fs.rename(temp, p);
}
function relativeSafe(name) {
  return !!name && !path.isAbsolute(name) &&
    !name.split("/").some(part => !part || part === "." || part === ".." || part.includes("\\"));
}
export async function inventory(root, rel = "", out = {}) {
  const entries = await fs.readdir(path.join(root, rel), { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const name = rel ? rel + "/" + entry.name : entry.name;
    if (!relativeSafe(name)) throw new Error("Unsafe package entry: " + name);
    const file = path.join(root, name);
    if (entry.isDirectory()) await inventory(root, name, out);
    else if (entry.isSymbolicLink()) out[name] = { link: await fs.readlink(file) };
    else if (entry.isFile()) out[name] = { hash: sha256(await fs.readFile(file)), executable: !!((await fs.stat(file)).mode & 0o111) };
    else throw new Error("Unsupported release entry: " + name);
  }
  return out;
}
export async function verifyBundle(bundle) {
  const release = await readJSON(path.join(bundle, "release.json"));
  if (release.schema !== 1 || !/^[a-z][a-z0-9-]{1,63}$/.test(release.id) ||
      !/^[a-zA-Z0-9._-]{1,160}$/.test(release.buildId) ||
      !release.files || typeof release.files !== "object") throw new Error("Invalid release manifest");
  if (release.platform !== process.platform || release.arch !== process.arch)
    throw new Error("Package target " + release.platform + "-" + release.arch + " does not match this machine");
  const actual = await inventory(bundle);
  delete actual["release.json"];
  if (Object.keys(actual).length !== Object.keys(release.files).length) throw new Error("Release inventory differs");
  for (const [name, wanted] of Object.entries(release.files)) {
    if (!relativeSafe(name) || JSON.stringify(actual[name]) !== JSON.stringify(wanted))
      throw new Error("Release integrity failure: " + name);
    if (wanted.link !== undefined) {
      const target = path.resolve(bundle, path.dirname(name), wanted.link);
      if (!target.startsWith(bundle + path.sep)) throw new Error("Release link escapes the bundle: " + name);
    }
  }
  return release;
}
async function assertHomeDest(home, rel) {
  if (!relativeSafe(rel)) throw new Error("Invalid home destination: " + rel);
  let here = home;
  for (const part of rel.split("/")) {
    here = path.join(here, part);
    try {
      if ((await fs.lstat(here)).isSymbolicLink()) throw new Error("Private path cannot be a symlink: " + here);
    } catch (e) { if (e.code !== "ENOENT") throw e; }
  }
}
async function atomicCurrent(home, buildId) {
  const link = path.join(home, ".agent/current");
  const temp = link + "." + randomUUID();
  await fs.symlink("releases/" + buildId, temp);
  try { await fs.rename(temp, link); }
  finally { await fs.rm(temp, { force: true }); }
}

/** One writer selects an installed release. A crash leaves an explicit lock
 * rather than allowing a second installer to corrupt the selected home.
 */
async function withInstallLock(home, work) {
  const dir = path.join(home, ".agent");
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, "install.lock");
  try {
    await fs.writeFile(file, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }) + "\n",
      { flag: "wx", mode: 0o600 });
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
    throw new Error("Another installation is active or was interrupted: " + file +
      ". Confirm no installer remains before clearing the stale lock.");
  }
  try { return await work(); }
  finally { await fs.rm(file, { force: true }); }
}
export async function install(bundle, requestedHome) {
  bundle = await fs.realpath(bundle);
  const release = await verifyBundle(bundle);
  await fs.mkdir(requestedHome, { recursive: true, mode: 0o700 });
  const home = await fs.realpath(requestedHome);
  const releases = path.join(home, ".agent/releases");
  if (bundle === home || (bundle.startsWith(home + path.sep) && !bundle.startsWith(releases + path.sep)))
    throw new Error("Unpacked release must be outside the private home");
  return withInstallLock(home, async () => {
  for (const rel of [".agent/releases", ".pi/settings.json", ".pi/auth.json", "sessions", "state", "bin/" + release.id])
    await assertHomeDest(home, rel);
  await fs.mkdir(releases, { recursive: true, mode: 0o700 });
  const marker = path.join(home, ".agent/identity.json");
  const old = await exists(marker) ? await readJSON(marker) : null;
  if (old && (old.id !== release.id || old.stateSchema !== release.stateSchema))
    throw new Error("This home belongs to a different agent or state version");
  const destination = path.join(releases, release.buildId);
  if (!await exists(destination)) {
    const staging = path.join(releases, ".staging-" + randomUUID());
    try {
      await fs.cp(bundle, staging, { recursive: true, dereference: false, verbatimSymlinks: true });
      await verifyBundle(staging);
      await fs.rename(staging, destination);
    } finally { await fs.rm(staging, { recursive: true, force: true }); }
  } else await verifyBundle(destination);
  for (const rel of [".pi", "sessions", "state", "workspace", "bin"])
    await fs.mkdir(path.join(home, rel), { recursive: true, mode: 0o700 });
  if (!await exists(marker)) await writeJSON(marker, { id: release.id, stateSchema: release.stateSchema });
  const settings = path.join(home, ".pi/settings.json");
  if (!await exists(settings)) {
    const defaults = path.join(destination, "app/role/defaults/settings.json");
    await fs.writeFile(settings, await exists(defaults) ? await fs.readFile(defaults) : "{}\n", { mode: 0o600, flag: "wx" });
  }
  const stable = path.join(home, "bin", release.id);
  if (!await exists(stable)) {
    const script = '#!/bin/sh\nset -eu\napp_home=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd -P)\nexec "$app_home/.agent/current/runtime/node/bin/node" "$app_home/.agent/current/app/app.mjs" --home "$app_home" "$@"\n';
    await fs.writeFile(stable, script, { mode: 0o700, flag: "wx" });
  }
  await atomicCurrent(home, release.buildId);
  return { home, command: stable, release };
  });
}
export async function selected(home) {
  home = await fs.realpath(home);
  const current = path.join(home, ".agent/current");
  const target = await fs.realpath(current);
  if (!target.startsWith(path.join(home, ".agent/releases") + path.sep)) throw new Error("Invalid selected release");
  const release = await readJSON(path.join(target, "release.json"));
  return { home, target, release };
}
export async function rollback(home, buildId) {
  if (!/^[a-zA-Z0-9._-]{1,160}$/.test(buildId)) throw new Error("Invalid build ID");
  const info = await selected(home);
  const target = path.join(info.home, ".agent/releases", buildId);
  const release = await verifyBundle(target);
  if (release.id !== info.release.id || release.stateSchema !== info.release.stateSchema)
    throw new Error("Incompatible rollback target");
  await atomicCurrent(info.home, buildId);
  return release;
}
