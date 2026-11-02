# Maintainer instructions

Read `README.md`, `docs/AGENT-CONTRACT.md`, and `docs/BUILD-AND-RELEASE.md` before implementation. Use `docs/IMPLEMENTATION-PLAN.md` to keep the first working path small.

- Treat a released agent, its installed private home, and one chat session as different things. Updates replace application code; they preserve private data.
- Keep this a generic catalogue and packaging project. Consultant HQ, case records, and any specialist memory belong to the agent that brings them. Do not add a shared memory or mission store here.
- Keep each agent's maintained expertise in its owning source. Pin and assemble that source instead of copying it into a second editable version.
- Reuse PiG's engine and native interfaces. Preserve terminal use, print/RPC access, and callers' human interaction and approval needs.
- Make normal opening mean a new conversation. Resume must choose a saved session explicitly; it must not silently reuse a directory-dependent session.
- Public files and build inputs must not contain real credentials, private prompts, client files, sessions, or personal configuration. Credential requirements are public; values and private imports stay local. Do not claim a personal export exists until it is implemented and tested.
- Do not promise that arbitrary Pi extensions work merely because compilation succeeds. Check the chosen suite's APIs, local imports, state paths, tool dependencies, and real behavior.
- Pin source and runtime inputs. Keep full skill and package assets and required license notices. Record source head, actual build checkout, tree, and final artifact identity separately.
- Distinguish implemented, tested, and planned behavior in the catalogue and docs. A download link is not evidence of a smooth install, a fully private suite, or an update that preserves state.
- Prefer a small native launcher around the current terminal UI. Do not add a daemon, account broker, custom chat frontend, or team scheduler without a demonstrated need.
- When behavior changes, update the contract and affected catalogue entry in the same change. Use focused tests for lifecycle and compatibility risks; do not add tests that merely repeat documentation.
