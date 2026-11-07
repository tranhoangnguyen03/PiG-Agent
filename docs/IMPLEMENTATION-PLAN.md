# Shell-first implementation and acceptance plan

Status: reference shell implemented in [PR #2](https://github.com/tranhoangnguyen03/PiG-Agent/pull/2), native joint-host compatibility still being qualified. The compiled Reviewer is **not** a prerequisite for shell readiness.

## 1. Establish the complete reference shell

The build selects pinned PiG/Node releases and exact source commits of pi-bro, pi-flow-external and pi-comms. It carries the full extension code, dependencies and assets. A neutral role proves that shell features do not depend on consultant HQ, a review skill, or another domain.

Qualify these paths in a clean installed application without a developer's global Pi, Node, or extension setup:

- Native TUI, model selection, slash commands and multiple fresh sessions.
- Pi-bro explanation UI, config, remember-me and a real backend call.
- Pi-flow-external control center, run/inspect/cancel, and a real external CLI.
- Pi-comms separate-home peer discovery, first contact, consent, replies, Pause and revocation.
- CLI print and native RPC start/stop/request/progress, UI requests and exact session resume.
- Installed settings, credentials, prompts, package data and sessions retained across versions.

The first smoke covers **installation, registration and headless sessions** only. Do not call a command-functional merely because PiG reports it. Keep a date and artifact ID for each manual test.

## 2. Adapt at the owning extension

- [pi-bro compatibility issue](https://github.com/tranhoangnguyen03/pi-bro/issues/177): PiG 0.5.3 real TUI and backends
- [pi-flow-external compatibility issue](https://github.com/tranhoangnguyen03/pi-flow-external/issues/112): real delegation, UI, supervision and external auth
- [pi-comms shared broker PR](https://github.com/tranhoangnguyen03/pi-comms/pull/34): one opt-in same-user broker for separate private agent homes

Keep main Pi/agent messaging independent of pi-flow's external CLI delegation. Do not copy or fork extensions inside this repo for a workaround. Update pinned commits only after running the relevant host checks.

## 3. Make the install/open/update path pleasant

A selected agent installs one full, signed, platform-specific package with a stable command and a private home. Clicking its native shortcut opens a **fresh** PiG terminal session. History resumes a chosen session; it cannot silently continue the latest from a different working directory.

At present the shell has **terminal install and launch**, not a signed/notarized one-click desktop application. Qualify the native runtime first, then add signed macOS app and Linux desktop entry without replacing the TUI.

Test two real versions, a corrupt archive, concurrent installation, edited private files, unchanged credentials, prior sessions, compatible rollback, and two separate installation homes. Distinguish source head, actual CI checkout, source tree and final artifact SHA.

## 4. Check the hidden state and credential paths

The shell chooses `PIG_HOME`, `PIG_CODING_AGENT_DIR`, `PI_CODING_AGENT_DIR`, session directory and npm prefix/cache. Each installed agent retains its own model auth and extension settings. The broker override is deliberately **transport only**.

Audit each external CLI backend separately: it may still use `~/.claude`, `~/.codex`, OS keychains, or other host-scoped state. Do not call an entire agent credential-isolated until the actual backend supports a scoped home/account. A packaged CLI binary cannot make OAuth portable.

## 5. Compose and release roles

After the shell passes its own acceptance, compose a real Reviewer, Engineer or other role by supplying prompts, playbooks, skills, scripts and role-specific extras. Use the shell's native TUI and control interfaces unchanged. Produce independent agent releases; do not create a second maintenance copy of B's expertise.

Then let `pi-consultants`, `pi-teams` and `pi-rooms` consume these installed agents without becoming core shell dependencies. Each caller owns its task policy and acceptance; pi-comms owns session communication.

Do not add a new chat frontend, session store, peer consent layer or scheduler to the shell unless actual native tests show it is necessary.
