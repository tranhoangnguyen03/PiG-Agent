# PiG-Agent

**Package and distribute complete PiG agents.** The reusable product is the agent shell: PiG's terminal UI and runtime, a working extension suite, direct and programmatic interfaces, independent homes, and a release lifecycle. A role supplies the specific instructions, skills, playbooks, scripts and extra tools.

The Reviewer is only an example role. The shell must work unchanged for a reviewer, engineer, researcher, daily driver or any other independently released specialist.

## Two layers

| Reusable shell | Interchangeable role |
|---|---|
| PiG runtime and native terminal | Base and append prompts |
| pi-bro: explanation and side interactions | Skills and reference files |
| pi-flow-external: external delegation | Playbooks and scripts |
| pi-comms: authorized peer messaging | Extra extensions and dependencies |
| CLI, print and RPC entry points | Role defaults and tests |
| Install, sessions, private state, updates | Agent-specific release identity |

**Each distributed agent includes both layers at tested versions.** Shell source is shared across builds, but installed agents do not depend on one mutable common runtime.

## Working reference shell

[Shell reference implementation](shell/README.md) provides a native PiG build from pinned source with **pi-bro, pi-flow-external and pi-comms**, its own versioned installation, and commands to open a fresh TUI session, resume a specific chat, use print/RPC, inspect installation health and roll back.

[Architecture and compatibility](docs/SHELL-ARCHITECTURE.md) names the exact split between shipped code, private settings and conversations, and the shared pi-comms transport. CI verifies package/command registration and separate sessions under a synthetic local model. **Functional pi-bro modals, external CLI delegation, and consent-based peer exchange remain separate native/manual acceptance requirements.** This is an integration candidate, not a qualified production release.

## Concept documents

- [Agent shell architecture](docs/SHELL-ARCHITECTURE.md): ownership boundaries, test expectations, upstream compatibility strategy
- [Hands-on shell acceptance](docs/SHELL-MANUAL-TEST.md): native TUI, functional pi-bro, Flow delegation and cross-home messaging
- [Agent contract](docs/AGENT-CONTRACT.md): release, installed instance, home, sessions and forms of access
- [Where files live and how to edit them](docs/FILES-AND-SESSIONS.md): maintained source, installed resources and private state
- [Build and release design](docs/BUILD-AND-RELEASE.md): versioned agent applications and package provenance
- [Implementation plan](docs/IMPLEMENTATION-PLAN.md): shell-first acceptance path
- [Independent Reviewer](docs/reviewer/README.md): example role design, **not** the core platform
- [Engineering B reference](catalogue/engineering/README.md): earlier tested independent application

## Boundaries

This repo does not replace PiG's TUI, implement another peer transport, own a shared memory system or coordinate firms/teams/rooms. Those higher layers **consume** independently released agents.

The catalogue and native desktop installers are still in progress. Actual credentials are never public release content. Connect model access in each installed home; external CLI accounts may still be managed by their own host tools until explicitly scoped and qualified.

The full shell and catalogue foundation are tracked in [parent PR #1](https://github.com/tranhoangnguyen03/PiG-Agent/pull/1). The native shell uses pinned [pi-comms 0.2.0](https://github.com/tranhoangnguyen03/pi-comms/releases/tag/v0.2.0) and the merged Flow and Bro sources. The remaining owner-approved cross-home Pi↔PiG↔PiG test is tracked in [pi-comms issue #35](https://github.com/tranhoangnguyen03/pi-comms/issues/35). A passing package smoke test does not imply that interactive handoff, actual account identity or external CLI billing has been qualified.

**Release status:** this is a source-backed native preview, not a signed desktop distribution. Merging the shell foundation does not certify the real-model/human-approval journey, account selection or paid external CLI delegation. See [manual acceptance](docs/SHELL-MANUAL-TEST.md) before describing a specific downloaded artifact as ready for normal users.
