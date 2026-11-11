# Maintainer instructions

Read `README.md`, `docs/SHELL-ARCHITECTURE.md`, `docs/AGENT-CONTRACT.md`, and `docs/FILES-AND-SESSIONS.md` before implementation. Use `docs/IMPLEMENTATION-PLAN.md` to keep the first working path small.

- Treat a released agent, its installed private home, and one chat session as different things. Updates replace application code; they preserve private data.
- Keep this a generic catalogue and packaging project. Consultant HQ, case records, and any specialist memory belong to the agent that brings them. Do not add a shared memory or mission store here.
- Keep each agent's maintained expertise in its owning source. Pin and assemble that source instead of copying it into a second editable version.
- Reuse PiG's engine and native interfaces. Preserve terminal use, print/RPC access, and callers' human interaction and approval needs.
- Make normal opening mean a new conversation. Resume must choose a saved session explicitly; it must not silently reuse a directory-dependent session.
- New tasks must also start without stale selected cases, task summaries, or verdicts loaded by extensions. Keep selected reusable lessons separate from task records. A private home may hold many conversations; retained files do not imply that every chat loads them.
- Public source and public-release build inputs must not contain real credentials, private prompts, client files, sessions, or personal configuration. A private application build may include intentionally selected private instructions. Credential requirements are public; account values and private provisioning stay local. Do not claim a personal export exists until it is implemented and tested.
- Do not promise that arbitrary Pi extensions work merely because compilation succeeds. Check the chosen suite's APIs, local imports, state paths, tool dependencies, and real behavior.
- Pin source and runtime inputs. Keep full skill and package assets and required license notices. Record source head, actual build checkout, tree, and final artifact identity separately.
- Distinguish implemented, tested, and planned behavior in the catalogue and docs. A download link is not evidence of a smooth install, a fully private suite, or an update that preserves state.
- Prefer a small native launcher around the current terminal UI. Do not add a daemon, account broker, custom chat frontend, or team scheduler without a demonstrated need.
- When behavior changes, update the contract and affected catalogue entry in the same change. Use focused tests for lifecycle and compatibility risks; do not add tests that merely repeat documentation.

- **Shell first:** a functional PiG TUI, pi-bro, pi-flow-external, pi-comms, CLI/RPC, agent-private state and lifecycle are the reusable product. Reviewer and Engineering are role examples.
- Prefer pi-bro/pi-flow-external/pi-comms compatibility changes in their owning repositories with native PiG reproduction. Do not add a parallel implementation of their behavior here.
- Shared local broker is a transport address, never a shared agent home, consent grant, or task manager. Do not mark interactive behavior tested based on RPC command registration alone.
