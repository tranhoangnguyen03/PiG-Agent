#!/usr/bin/env node
/** The same release supplies terminal TUI, print and RPC. This is not another chat UI. */
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { exists, install, readJSON, rollback, selected } from "./installation.mjs";

const extracted = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRelease = await readJSON(path.join(extracted, "release.json"));
let home = process.env.PIG_AGENT_HOME || path.join(os.homedir(), ".pig-agent", sourceRelease.id);
let cwd;
const raw = [];
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--home" || process.argv[i] === "--cwd") {
    const key = process.argv[i], value = process.argv[++i];
    if (!value) throw new Error("Missing value for " + key);
    if (key === "--home") home = value; else cwd = value;
  } else raw.push(process.argv[i]);
}
home = path.resolve(home);
let action = ["new", "resume", "rpc", "print", "install", "doctor", "info", "rollback", "help"].includes(raw[0]) ? raw.shift() : "new";
const extra = raw;

async function run(executable, argv, opts = {}) {
  const child = spawn(executable, argv, { ...opts, stdio: "inherit" });
  const onSignal = sig => { if (!child.killed) child.kill(sig); };
  for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, onSignal);
  try {
    return await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", (code, signal) => resolve(code ?? (signal === "SIGINT" ? 130 : 1)));
    });
  } finally {
    for (const sig of ["SIGINT", "SIGTERM"]) process.off(sig, onSignal);
  }
}
function help() {
  process.stdout.write(
    "Self-contained PiG agent shell: " + sourceRelease.name + "\n" +
    "  shell-reference install [--home DIR]       Install/update this release\n" +
    "  shell-reference new [--cwd PROJECT]        Open fresh PiG TUI session\n" +
    "  shell-reference resume SESSION.jsonl       Resume this exact saved chat\n" +
    "  shell-reference rpc [--cwd PROJECT]        Start PiG RPC (stdio JSONL)\n" +
    "  shell-reference print PROMPT               Make a noninteractive request\n" +
    "  shell-reference doctor | info              Show local package and setup\n" +
    "  shell-reference rollback BUILD_ID          Select an earlier installed release\n" +
    "  shell-reference --help                      Show this help\n" +
    "Advanced PiG arguments may follow new/rpc/print; model credentials are configured on first use.\n"
  );
}
if (action === "help" || extra.includes("--help")) {
  help();
} else if (action === "install") {
  const output = await install(extracted, home);
  console.log("Installed " + output.release.name + " " + output.release.version +
    "\nHome: " + output.home + "\nCommand: " + output.command);
} else {
  if (!await exists(path.join(home, ".agent/current"))) {
    if (action === "rollback") throw new Error("No installed release to roll back");
    await install(extracted, home);
  }
  if (action === "rollback") {
    if (extra.length !== 1) throw new Error("rollback requires one exact build ID");
    const result = await rollback(home, extra[0]);
    console.log("Selected " + result.id + " " + result.version + " (" + result.buildId + ")");
  } else {
    const { target, release } = await selected(home);
    if (action === "info") {
      console.log(JSON.stringify({ id: release.id, version: release.version, buildId: release.buildId,
        home, selectedRelease: target, extensions: release.extensions, commands: ["new", "resume", "rpc", "print"] }, null, 2));
    } else {
      const agentDir = path.join(home, ".pi");
      const npmPrefix = path.join(home, "state/npm");
      const env = {
        ...process.env,
        PIG_HOME: path.join(home, ".pig"),
        PIG_USE_PI_DIRS: "1",
        PIG_TS_RUNTIME: "node",
        PIG_CODING_AGENT_DIR: agentDir,
        PI_CODING_AGENT_DIR: agentDir,
        PI_COMMS_BROKER_DIR: process.env.PI_COMMS_BROKER_DIR || path.join(os.homedir(), ".pig-agent/_comms"),
        NPM_CONFIG_PREFIX: npmPrefix,
        npm_config_prefix: npmPrefix,
        NPM_CONFIG_CACHE: path.join(home, "state/npm-cache"),
        npm_config_cache: path.join(home, "state/npm-cache"),
        PATH: [path.join(target, "runtime/node/bin"), path.join(npmPrefix, "bin"), process.env.PATH || ""].join(path.delimiter),
      };
      delete env.PIG_PIGLET_NAME;
      delete env.PIG_PIGLET_PATH;
      delete env.PI_PACKAGE_DIR;
      delete env.PIG_PACKAGE_DIR;
      const node = path.join(target, "runtime/node/bin/node");
      const pig = path.join(target, "runtime/pig");
      if (action === "doctor") {
        const extensions = [];
        for (const item of release.extensions) {
          const dir = path.join(target, "app/extensions", item.id);
          const pkg = await readJSON(path.join(dir, "package.json"));
          const entries = pkg.pi?.extensions || [item.entry];
          extensions.push({ name: item.id, version: pkg.version, installed: (await Promise.all(entries.map(async e => exists(path.join(dir, e))))).every(Boolean), entries });
        }
        const [nodeVersion, pigVersion] = await Promise.all([
          new Promise((resolve, reject) => { const child=spawn(node,["--version"],{env});let out="";child.stdout.on("data",x=>out+=x);child.on("error",reject);child.on("close",code=>code===0?resolve(out.trim()):reject(new Error("Node failed"))); }),
          new Promise((resolve, reject) => { const child=spawn(pig,["--version"],{env});let out="";child.stdout.on("data",x=>out+=x);child.on("error",reject);child.on("close",code=>code===0?resolve(out.trim()):reject(new Error("PiG failed"))); }),
        ]);
        const ok=extensions.every(x=>x.installed);
        console.log(JSON.stringify({ verdict: ok ? "installed" : "missing_package_file", scope: "files and executables, not live TUI/transport behavior", home, release: release.buildId, nodeVersion, pigVersion, extensions }, null, 2));
        if (!ok) process.exitCode = 1;
      } else {
        const args = [];
        // PiG's built-in Piglet supplies the role's baseline system prompt.
        // Complete Pi source packages stay together so relative imports and assets work.
        for (const item of release.extensions) {
          const dir = path.join(target, "app/extensions", item.id);
          args.push("-e", dir);
          for (const skill of item.skills || []) args.push("--skill", path.join(dir, skill));
        }
        for (const skill of release.roleSkills || []) args.push("--skill", path.join(target, "app/role", skill));
        const prompts = [
          path.join(target, "app/role/prompts/append.md"),
          path.join(home, ".pi/APPEND_SYSTEM.md"),
        ];
        for (const p of prompts) if (await exists(p)) args.push("--append-system-prompt", p);
        args.push("--session-dir", path.join(home, "sessions"));
        if (action === "rpc") args.push("--mode", "rpc");
        if (action === "resume") {
          const file = extra.shift();
          if (!file || !path.isAbsolute(file) || path.extname(file) !== ".jsonl")
            throw new Error("resume requires the absolute path to a saved .jsonl conversation");
          const resolved = await fs.realpath(file);
          if (!resolved.startsWith(path.join(home, "sessions") + path.sep))
            throw new Error("Session must belong to this agent home");
          args.push("--session", resolved);
        }
        if (action === "print") {
          if (!extra.length) throw new Error("print requires a prompt");
          args.push("-p", extra.shift());
        }
        // No -c or --resume on new: each launch gets an empty conversation.
        args.push(...extra);
        const working = cwd ? path.resolve(cwd) : path.join(home, "workspace");
        await fs.access(working);
        process.exitCode = await run(pig, args, { cwd: working, env });
      }
    }
  }
}
