# Agent shell architecture and qualification contract

## Purpose

One reliable shell can host many independently released roles. A role contributes its system/append prompts, skills, playbooks, scripts, extra extensions and requirements. The shell supplies PiG, native TUI, the core extension suite, accounts, session lifecycle, CLI/RPC and peer messaging.

Each agent release pins **both** a shell version and a role package. It is independently installable. A new version replaces application code, not the installed instance's secrets or conversations. The shell is a maintained build composition, not a shared writable runtime process: installed agents must not depend on another app being updated in place.

## Operational boundaries

| Owner | Data or behavior | Lifetime |
|---|---|---|
| Maintained source | Shell core, role files, extension pins, build scripts, test evidence | Git/release |
| Native release | Compiled PiG, Node, full pinned extension trees, role assets, inventory | Immutable version |
| Installed home | Model credentials, personal settings/prompt, extension state, cached tools, chats | Survives upgrades |
| One session | Current brief, messages, tool activity, chosen project | New or explicit resume |
| Local pi-comms broker | Addressing/routing only; no general agent memory | Separate same-user transport process |
| Caller | Work instructions, deadlines, approval/acceptance, optional agent start | Parent or direct user |

Use `PIG_HOME`, `PIG_CODING_AGENT_DIR`, `PI_CODING_AGENT_DIR`, a native `--session-dir`, per-home npm cache/prefix, and the optional `PI_COMMS_BROKER_DIR`. Do not share `PI_CODING_AGENT_DIR` across installed agents merely to make pi-comms discover them. The host and three extensions require real tests of those paths.

The CLI launches **the installed PiG binary** for direct TUI, print and RPC. It does not emulate Pi's UI, translate model tools, or build another chat protocol. `new` does not pass prior transcript or selected case. `resume` passes the chosen exact session path. Distinct chats share declared standing rules but not their task histories.

## Compatibility matrix

| Surface | Source / current evidence | Required check before release-ready |
|---|---|---|
| PiG TUI | Upstream TUI and RPC present; B's native binary and live standalone consultation tested | Model picker, slash menus, modal rendering, resize, session and history on each target OS |
| pi-bro | Own [PiG compatibility notes](https://github.com/tranhoangnguyen03/pi-bro/blob/main/docs/pig-compatibility.md) call support experimental; current notes focus on 0.3.0 | Real `/bro`, config, simplify, remember-me, reloading, UI and backend process cleanup under PiG 0.5.3 |
| pi-flow-external | [Source](https://github.com/tranhoangnguyen03/pi-flow-external) targets native Pi; includes external CLI spawning and full modal UX | `/external` config, doctor, real CLI delegation, streaming, cancellation, persisted receipts, shutdown and resumption |
| pi-comms | [Source](https://github.com/tranhoangnguyen03/pi-comms) uses exact native session ID and local broker | Two live separate-home agents share broker, consent, exchange/reply, pause/revoke, disconnection and re-entry; no implicit grant |
| CLI/RPC | Native PiG RPC and B's verified Pi-to-specialist use | New session, exact resume, request/progress/abort, UI question forwarding, results and no content cross-contamination |
| Install/update | B's versioned-home installation proves a working pattern | Two releases, private state protection, conflict detection, rollback, multiple homes, damaged archive refusal |

The packaged app keeps **full extension sources and resources**, including `node_modules`, scripts, prompts, skill trees, assets and notices. Missing local CLI dependencies must be supplied in the install flow when essential, or the feature must be clearly marked as requiring setup. Any role-specific API or agent team is a consumer, not the owner of shell networking.

## Upstream strategy

PiG-Agent pins extension commits rather than copying and permanently forking their source. A failing compatibility probe goes to the owning repository with exact host version, reproduction, expected/observed behavior and a minimal proposed repair. The extension's normal release process produces the next pinned source. Pi-comms shared broker selection is an upstream pull request, not a private PiG-Agent patch.

Do not add a second peer messaging protocol, session database, approval framework or browser TUI merely to make the shell appear complete. If a shell feature cannot pass native evaluation, retain the test evidence and mark it unqualified instead of replacing the extension with a superficial mock.

## Release gate

A candidate must pass **two distinct checks**: native application and extension functional behavior. Unit tests for launcher and installation never substitute for the real extension's UI and tools. A CI script that merely loads a package proves loading, not its behavior. The release report should state which platform, exact source commit, build checkout, artifact digest, extension versions and functional scenarios were actually exercised.
