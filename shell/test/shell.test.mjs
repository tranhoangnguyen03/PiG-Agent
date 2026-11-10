import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { inventory, writeJSON, install, rollback, selected, sha256 } from "../installation.mjs";

async function setup(t, version, agentId="shell-reference") {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "pig-shell test "));
  t.after(() => fs.rm(tmp, { recursive: true, force: true }));
  const root = path.join(tmp, "bundle");
  await fs.mkdir(path.join(root, "app/role/prompts"), { recursive: true });
  await fs.mkdir(path.join(root, "app/role/defaults"), { recursive: true });
  await fs.mkdir(path.join(root, "app/extensions/bro"), { recursive: true });
  await fs.mkdir(path.join(root, "runtime/node/bin"), { recursive: true });
  await fs.mkdir(path.join(root, "runtime"), { recursive: true });
  await fs.copyFile(new URL("../app.mjs", import.meta.url), path.join(root, "app/app.mjs"));
  await fs.copyFile(new URL("../installation.mjs", import.meta.url), path.join(root, "app/installation.mjs"));
  await fs.writeFile(path.join(root, "runtime/node/bin/node"), "#!/bin/sh\nexec " + JSON.stringify(process.execPath) + " \"$@\"\n", { mode: 0o755 });
  await fs.writeFile(path.join(root, "runtime/pig"),
    '#!/bin/sh\nif [ "$1" = "--version" ]; then echo "pig mock"; exit 0; fi\nprintf "%s\\n" "$PI_CODING_AGENT_DIR" "$PIG_CODING_AGENT_DIR" "$PI_COMMS_BROKER_DIR" "$*" > "$TEST_CAPTURE"\n', { mode: 0o755 });
  await fs.writeFile(path.join(root, "app/role/prompts/append.md"), "SHELL_APPEND\n");
  await fs.writeFile(path.join(root, "app/role/defaults/settings.json"), JSON.stringify({ model: "default" }));
  await fs.writeFile(path.join(root, "app/extensions/bro/package.json"),
    JSON.stringify({ name: "pi-bro", version: "0.29.0", pi: { extensions: ["./extension.ts"] } }));
  await fs.writeFile(path.join(root, "app/extensions/bro/extension.ts"), "// synthetic extension fixture\n");
  const files = await inventory(root);
  await writeJSON(path.join(root, "release.json"), { schema: 1, stateSchema: 1, id: agentId, name: "Shell",
    version, buildId: version + "-" + sha256(JSON.stringify(files)).slice(0, 12),
    platform: process.platform, arch: process.arch, extensions: [{id:"bro",entry:"extension.ts",skills:[]}],
    roleSkills: [], files });
  return { root, tmp, home: path.join(tmp, "home") };
}
function call(bin, argv=[], env={}) {
  const r = spawnSync(bin, argv, { encoding: "utf8", env: { ...process.env, ...env } });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}
test("install and new/print/rpc use selected app and separated state", async t => {
  const a = await setup(t, "0.1.0");
  await install(a.root, a.home);
  const bin = path.join(a.home, "bin/shell-reference");
  const capture = path.join(a.tmp, "captured");
  const env = { TEST_CAPTURE: capture };
  call(bin, ["new"], env);
  let lines = (await fs.readFile(capture, "utf8")).trim().split("\n");
  // macOS exposes /var under its canonical /private/var mount. These
  // names refer to the same directory; verify the real directory identity.
  assert.equal(await fs.realpath(lines[0]), await fs.realpath(path.join(a.home, ".pi")));
  assert.equal(await fs.realpath(lines[1]), await fs.realpath(path.join(a.home, ".pi")));
  assert.ok(lines[2].endsWith("/.pig-agent/_comms"));
  assert.match(lines[3], /--session-dir/);
  assert.doesNotMatch(lines[3], /--continue|--session [^-\s]/);
  assert.match(lines[3], /-e /);
  assert.throws(() => call(bin, ["new", "--continue"], env), /This agent owns its session/);
  assert.throws(() => call(bin, ["new", "-c"], env), /This agent owns its session/);
  call(bin, ["rpc"], env);
  assert.match(await fs.readFile(capture, "utf8"), /--mode rpc/);
  call(bin, ["print", "hello"], env);
  assert.match(await fs.readFile(capture, "utf8"), /-p hello/);
  const transcript = path.join(a.home, "sessions/review-a.jsonl");
  await fs.writeFile(transcript, '{"type":"session"}\n');
  call(bin, ["resume", transcript], env);
  assert.ok((await fs.readFile(capture, "utf8")).includes("--session " + await fs.realpath(transcript)));
  assert.throws(() => call(bin, ["resume", "/tmp/not-this-agent.jsonl"], env));
  assert.ok((await fs.readdir(path.join(a.home, "sessions"))).includes("review-a.jsonl"));
});
test("resumes within a symlinked private home without accepting outside transcripts", async t => {
  const a = await setup(t, "0.1.0");
  await install(a.root, a.home);
  const linkedHome = path.join(a.tmp, "linked-home");
  await fs.symlink(a.home, linkedHome, "dir");
  const bin = path.join(a.home, "bin/shell-reference");
  const capture = path.join(a.tmp, "captured-linked-home");
  const transcript = path.join(linkedHome, "sessions/symlinked.jsonl");
  await fs.writeFile(transcript, '{"type":"session"}\n');
  call(bin, ["resume", transcript], { PIG_AGENT_HOME: linkedHome, TEST_CAPTURE: capture });
  const captured = await fs.readFile(capture, "utf8");
  assert.ok(captured.includes("--session " + await fs.realpath(transcript)));
  // The canonical-path fix must not loosen the private-home boundary.
  const outside = path.join(a.tmp, "outside.jsonl");
  await fs.writeFile(outside, '{"type":"session"}\n');
  assert.throws(() => call(bin, ["resume", outside], {
    PIG_AGENT_HOME: linkedHome,
    TEST_CAPTURE: capture,
  }), /Session must belong to this agent home/);
});

test("update and rollback leave secrets, sessions and private prompt intact", async t => {
  const a = await setup(t, "0.1.0");
  const one = await install(a.root, a.home);
  await fs.writeFile(path.join(a.home, ".pi/auth.json"), "SENSITIVE_SECRET\n", { mode: 0o600 });
  await fs.writeFile(path.join(a.home, ".pi/APPEND_SYSTEM.md"), "PRIVATE_GUIDANCE\n");
  await fs.writeFile(path.join(a.home, "sessions/review-a.jsonl"), "OLD_REVIEW\n");
  await fs.writeFile(path.join(a.home, ".pi/settings.json"), '{"custom":true}\n');
  const b = await setup(t, "0.2.0");
  const two = await install(b.root, a.home);
  assert.notEqual(one.release.buildId, two.release.buildId);
  assert.equal((await selected(a.home)).release.buildId, two.release.buildId);
  for(const [p,wanted] of [[".pi/auth.json","SENSITIVE_SECRET\n"],[".pi/APPEND_SYSTEM.md","PRIVATE_GUIDANCE\n"],
    ["sessions/review-a.jsonl","OLD_REVIEW\n"],[".pi/settings.json",'{"custom":true}\n']])
    assert.equal(await fs.readFile(path.join(a.home,p),"utf8"),wanted);
  await rollback(a.home, one.release.buildId);
  assert.equal((await selected(a.home)).release.buildId, one.release.buildId);
  const corrupt = await setup(t, "0.3.0", "another-agent");
  await assert.rejects(() => install(corrupt.root, a.home), /different agent/);
});
test("tampered bundle is rejected before installation changes private state", async t => {
  const a = await setup(t, "0.1.0");
  await fs.appendFile(path.join(a.root, "app/role/prompts/append.md"), "TAMPERED\n");
  await assert.rejects(() => install(a.root, a.home), /integrity/i);
});

test("installation lock rejects competing writer without changing the selected release", async t => {
  const a=await setup(t,"0.1.0");
  const first=await install(a.root,a.home);
  const lock=path.join(a.home,".agent/install.lock");
  await fs.writeFile(lock,JSON.stringify({pid:process.pid})+"\\n",{mode:0o600});
  await assert.rejects(() => install(a.root,a.home),/Another installation/);
  assert.equal((await selected(a.home)).release.buildId,first.release.buildId);
  await fs.rm(lock);
  await install(a.root,a.home);
});
