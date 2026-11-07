#!/usr/bin/env node
/** Build a complete native reference shell from pinned source, never from a working home. */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { sha256, exists, inventory, readJSON, writeJSON } from "./installation.mjs";

const source = path.dirname(fileURLToPath(import.meta.url));
const repo = path.dirname(source);
const roleRoot = path.join(source, "reference");
const lock = await readJSON(path.join(source, "source-lock.json"));
const role = await readJSON(path.join(roleRoot, "role.json"));
const out = path.resolve(process.argv[2] || path.join(repo, "dist/shell"));
const target = process.platform + "-" + process.arch;
if (!lock.pig.archives[target] || !lock.node.archives[target]) throw new Error("Unsupported native build target: " + target);
if (!/^[a-z][a-z0-9-]+$/.test(role.id) || !/^[0-9A-Za-z._-]+$/.test(role.version))
  throw new Error("Invalid role identity or release version");
const cache = path.join(out, "cache");
const bundle = path.join(out, "bundle");
const work = path.join(out, "work");
for (const dir of [cache, bundle, work]) await fs.mkdir(dir, { recursive: true });
await fs.rm(bundle, { recursive: true, force: true }); await fs.mkdir(bundle, { recursive: true });
await fs.rm(work, { recursive: true, force: true }); await fs.mkdir(work, { recursive: true });

function exec(command, args, opts = {}) {
  const r = spawnSync(command, args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
  if (r.error || r.status !== 0) throw new Error(command + " " + args.slice(0, 2).join(" ") + ": " + (r.error?.message || r.stderr || "exit " + r.status));
  return r.stdout?.trim() || "";
}
async function download(url, item) {
  const file = path.join(cache, item.name);
  if (!await exists(file) || sha256(await fs.readFile(file)) !== item.sha256) {
    const tmp = file + ".download";
    exec("curl", ["--fail", "--location", "--retry", "3", "--silent", "--show-error", "--output", tmp, url]);
    if (sha256(await fs.readFile(tmp)) !== item.sha256) throw new Error("Checksum mismatch for " + item.name);
    await fs.rename(tmp, file);
  }
  return file;
}
const pigInfo = lock.pig.archives[target];
const nodeInfo = lock.node.archives[target];
const pigTar = await download(lock.pig.source + "/releases/download/v" + lock.pig.version + "/" + pigInfo.name, pigInfo);
const nodeTar = await download("https://nodejs.org/dist/v" + lock.node.version + "/" + nodeInfo.name, nodeInfo);
const pigDir = path.join(cache, "pig-" + lock.pig.version + "-" + target);
await fs.mkdir(pigDir, { recursive: true });
exec("tar", ["-xzf", pigTar, "-C", pigDir, "--strip-components=1"]);
const nodeDir = path.join(bundle, "runtime/node");
await fs.mkdir(nodeDir, { recursive: true });
exec("tar", ["-xzf", nodeTar, "-C", nodeDir, "--strip-components=1"]);
const node = path.join(nodeDir, "bin/node");
const npmCli = path.join(nodeDir, "lib/node_modules/npm/bin/npm-cli.js");
const pig = path.join(pigDir, "pig");
const env = { ...process.env, PIG_HOME: path.join(cache, "pig-home"), PIG_USE_PI_DIRS: "0" };
if (!await exists(path.join(env.PIG_HOME, "toolchains/go/bin/go"))) exec(pig, ["setup", "go"], { env, stdio: "inherit" });
env.PATH = [path.join(env.PIG_HOME, "toolchains/go/bin"), path.join(nodeDir, "bin"), process.env.PATH].join(path.delimiter);
const extsDir = path.join(bundle, "app/extensions");
await fs.mkdir(extsDir, { recursive: true });
const versions = [];
for (const ext of lock.extensions) {
  if (!/^[a-z][a-z0-9-]+$/.test(ext.id) || !/^[a-f0-9]{40}$/.test(ext.commit))
    throw new Error("Extension source must have a safe ID and exact Git commit");
  const dest = path.join(extsDir, ext.id);
  exec("git", ["clone", "--quiet", "--no-checkout", ext.repository, dest]);
  exec("git", ["-C", dest, "checkout", "--quiet", "--detach", ext.commit]);
  if (exec("git", ["-C", dest, "rev-parse", "HEAD"]) !== ext.commit)
    throw new Error("Extension checkout drift: " + ext.id);
  const pkg = await readJSON(path.join(dest, "package.json"));
  if (pkg.name !== ext.package || pkg.version !== ext.version) throw new Error("Extension name/version drift: " + ext.id);
  if (ext.devBuild) {
    exec(node, [npmCli, "ci", "--ignore-scripts", "--no-audit", "--no-fund"], { cwd: dest, env, stdio: "inherit" });
    exec(node, [npmCli, "run", "build"], { cwd: dest, env, stdio: "inherit" });
    exec(node, [npmCli, "prune", "--omit=dev", "--omit=peer", "--ignore-scripts", "--no-audit", "--no-fund"], { cwd: dest, env, stdio: "inherit" });
  } else exec(node, [npmCli, "ci", "--omit=dev", "--omit=peer", "--ignore-scripts", "--no-audit", "--no-fund"], { cwd: dest, env, stdio: "inherit" });
  if (!await exists(path.join(dest, ext.entry))) throw new Error("Missing extension entry after install: " + ext.id + "/" + ext.entry);
  for (const skill of ext.skills) if (!await exists(path.join(dest, skill))) throw new Error("Missing extension skill: " + ext.id + "/" + skill);
  await fs.rm(path.join(dest, ".git"), { recursive: true, force: true });
  // Keep the whole extension tree: files, sibling imports, companion skills and notices.
  versions.push({ id: ext.id, package: pkg.name, version: pkg.version, sourceCommit: ext.commit, entry: ext.entry, skills: ext.skills });
}
await fs.cp(roleRoot, path.join(bundle, "app/role"), { recursive: true });
const generatedSettings = path.join(bundle, "app/role/defaults/settings.json");
await fs.mkdir(path.dirname(generatedSettings), { recursive: true });
if (!await exists(generatedSettings)) await writeJSON(generatedSettings, {
  defaultTools: ["read", "bash", "edit", "write", "grep", "find", "ls"], packages: [],
});
const skillsDir = path.join(roleRoot, "skills");
const roleSkills = [];
for (const dir of await fs.readdir(skillsDir, { withFileTypes: true }).catch(e => { if (e.code === "ENOENT") return []; throw e; })) {
  if (dir.isDirectory() && await exists(path.join(skillsDir, dir.name, "SKILL.md"))) roleSkills.push("skills/" + dir.name);
}
const pigletDir = path.join(work, "piglet");
await fs.mkdir(pigletDir);
await fs.copyFile(path.join(roleRoot, "prompts/system.md"), path.join(pigletDir, "system.md"));
const manifest = [
  "name: " + role.id,
  "description: " + JSON.stringify(role.description),
  "systemPrompt:", "  file: ./system.md",
  "discovery:", "  extensions: []", "  skills: []",
  "release:", "  version: " + role.version,
].join("\n") + "\n";
await fs.writeFile(path.join(pigletDir, "piglet.yaml"), manifest);
const pigBinary = path.join(bundle, "runtime/pig");
exec(pig, ["piglet", "validate", path.join(pigletDir, "piglet.yaml")], { env });
exec(pig, ["piglet", "build", path.join(pigletDir, "piglet.yaml"), "--format", "binary", "--out", pigBinary], { env, stdio: "inherit" });
await fs.chmod(pigBinary, 0o755);
for (const f of ["app.mjs", "installation.mjs"]) await fs.copyFile(path.join(source, f), path.join(bundle, "app", f));
const executable = "#!/bin/sh\nset -eu\nrelease_dir=$(CDPATH= cd -- \"$(dirname -- \"$0\")\" && pwd -P)\nexec \"$release_dir/runtime/node/bin/node\" \"$release_dir/app/app.mjs\" \"$@\"\n";
await fs.writeFile(path.join(bundle, role.id), executable, { mode: 0o755 });
await fs.copyFile(path.join(source, "source-lock.json"), path.join(bundle, "source-lock.json"));
await fs.copyFile(path.join(source, "README.md"), path.join(bundle, "README.md"));
await fs.copyFile(path.join(pigletDir, "piglet.yaml"), path.join(bundle, "piglet.yaml"));
if (await exists(path.join(pigDir, "LICENSE"))) {
  await fs.mkdir(path.join(bundle, "licenses"), { recursive: true });
  await fs.copyFile(path.join(pigDir, "LICENSE"), path.join(bundle, "licenses/PiG-LICENSE"));
} else throw new Error("PiG distribution license not found");
for (const filename of ["NOTICE", "THIRD_PARTY_NOTICES.md"]) {
  if (await exists(path.join(pigDir, filename))) await fs.copyFile(path.join(pigDir, filename), path.join(bundle, "licenses", filename));
}
const sourceHead = exec("git", ["rev-parse", "HEAD"]);
const sourceTree = exec("git", ["rev-parse", "HEAD^{tree}"]);
const dirty = !!exec("git", ["status", "--porcelain"]);
if (dirty) throw new Error("Build release from a clean checkout, not uncommitted files");
const files = await inventory(bundle);
const buildId = role.version + "-" + target + "-" + sha256(JSON.stringify(files)).slice(0, 16);
const release = { schema: 1, stateSchema: 1, id: role.id, name: role.name, version: role.version,
  platform: process.platform, arch: process.arch, buildId, source: { commit: sourceHead, tree: sourceTree, repository: "tranhoangnguyen03/PiG-Agent" },
  runtime: { pig: lock.pig.version, node: lock.node.version },
  extensions: versions, roleSkills, files };
await writeJSON(path.join(bundle, "release.json"), release);
const archive = path.join(out, role.id + "-" + buildId + ".tar.gz");
exec("tar", ["-czf", archive, "-C", out, "bundle"]);
await fs.writeFile(archive + ".sha256", sha256(await fs.readFile(archive)) + "  " + path.basename(archive) + "\n");
console.log("Built " + archive + "\nBuild ID: " + buildId);
