# Reusable agent shell — reference implementation

Status: **integration candidate**, not a fully qualified release. This is the common application around any role. The reference role is deliberately small; its role content is not the product.

The shell builds a complete **native PiG application**, bundles Node and three extension packages from exact source commits, creates a private home, and launches the native TUI, print mode or RPC. The extensions are **pi-bro, pi-flow-external and pi-comms**. Full runtime compatibility must be checked in the native host; bundling code is not proof it works.

## Layout

- `source-lock.json`: pinned PiG/Node binaries and exact upstream extension commits.
- `reference/`: small interchangeable role: base and append prompts, full skill trees.
- `build.mjs`: builds the native app and bundles extension source and installed dependencies.
- `app.mjs`: stable launch commands and private environment.
- `installation.mjs`: verifies content, installs versions and preserves state.
- `smoke.mjs`: package/session/host checks, separated from paid-provider testing.
- `../docs/SHELL-ARCHITECTURE.md`: boundaries and compatibility matrix.

After install, `~/.pig-agent/shell-reference/` holds `.agent/releases/` (immutable builds), `.agent/current` (selected build), `bin/shell-reference` (stable command), `.pi/` (provider keys and extension settings), `sessions/` (many separate transcripts), `state/` and `workspace/`.

Both direct and delegated use select the **same installed application**. The main Pi may launch its RPC command; the installed extension tools remain present. Cross-home pi-comms uses the same-user, opt-in broker root from [pi-comms PR #40](https://github.com/tranhoangnguyen03/pi-comms/pull/40); only that broker is shared.

## Flow version selected by this shell

The maintained `shell/source-lock.json` now selects **Flow 6.3.0-external.1** at merged source commit `8751fa24b9915c3201e23b4557df5a5fa593f9bc` ([upstream PR #114](https://github.com/tranhoangnguyen03/pi-flow-external/pull/114)). The shell builder checks out that exact commit and rejects package/version drift; `shell/smoke.mjs` additionally compares the built bundle's Flow source and package metadata to the lock.

This is the **installed specialist's Flow version**, not an automatic update of the main Pi installation. It preserves PiG **0.5.3**, Node **24.15.0**, Bro **0.36.1** and Comms **0.2.0**. Flow's prior Linux/macOS qualification used an equivalent test-only lock override; this PR carries the selected source into the maintained shell lock. The native shell CI rebuilds both platforms and runs a synthetic-model smoke. Real Claude/Codex subscription, billing and human terminal acceptance remain separate from build verification.

## Pinned release download reliability

The builder still downloads PiG and Node **only at the exact versions and SHA-256 values in `source-lock.json`**. For the PiG release archive, an optional `GH_TOKEN` lets it try GitHub's release-asset API when the browser download endpoint is unreliable. The API metadata's digest and the downloaded bytes must both match the source lock. When the API is unavailable, the original release URL remains the fallback. A digest mismatch is a hard build failure, never a reason to skip verification.

The shell CI passes a read-only GitHub Actions token and caches downloaded archives under `dist/shell/cache`. Every reused archive is rehashed by `build.mjs`; neither the token nor credentials enter the published agent bundle. The cache has no authority to change the source pins.

## Operations (after a native build)

```sh
# From the extracted download (proposed archive layout)
./bundle/shell-reference install
# Stable command installed in the private home:
~/.pig-agent/shell-reference/bin/shell-reference new
~/.pig-agent/shell-reference/bin/shell-reference new --cwd /path/to/project
~/.pig-agent/shell-reference/bin/shell-reference resume /absolute/path/to/saved-chat.jsonl
~/.pig-agent/shell-reference/bin/shell-reference rpc --cwd /path/to/project
~/.pig-agent/shell-reference/bin/shell-reference print "Inspect this system"
~/.pig-agent/shell-reference/bin/shell-reference doctor
```

These are reference-shell commands; they do not replace PiG slash commands. `new` always opens a fresh native session. `resume` requires an explicit saved file. On first use, connect the model with PiG's native login. External CLIs require their own sign-in only when chosen.

## Limits

The Comms pin now targets an M4-based 0.2.0 shared-broker candidate, not the stale pre-F11/F12 0.2.0 branch. The source pins are **inputs to qualify**, not claims of PiG support. Bro's PiG notes target an older release; Flow and Comms have no verified PiG 0.5.3 joint-host record. No live provider, external CLI authorization, macOS GUI review, or real peer handoff is claimed until the corresponding smoke/manual evidence passes. The broker option does not start stopped agents or remove session-specific contact approval. See the architecture document.

The reference shell is intentionally **not** a firm, department, room, memory store, workflow orchestrator, or reviewer practice. Those capabilities can use it without becoming part of its foundation.
