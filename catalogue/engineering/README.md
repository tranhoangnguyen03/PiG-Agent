# Engineering consultant B

Status: **reference prototype**, not yet a ready-to-install PiG-Agent catalogue release.

B is an independent Engineering consultant with its own HQ, tools, private case history, and sessions. It supports direct terminal use, consultation from a main Pi through an opt-in adapter, and bounded local peer requests. Its maintained expertise remains in `pi-consultants`.

## Verified source and build

- [Implementation PR #27](https://github.com/tranhoangnguyen03/pi-consultants/pull/27)
- Source head: [`752a579af69ac9e8020450e72704fefabfe0c674`](https://github.com/tranhoangnguyen03/pi-consultants/commit/752a579af69ac9e8020450e72704fefabfe0c674)
- Actual CI build checkout: [`df5ee250e93266a04c34b2352218071e77c94dbc`](https://github.com/tranhoangnguyen03/pi-consultants/commit/df5ee250e93266a04c34b2352218071e77c94dbc)
- Both commits have tree `31860ddf1dfa2dd92e388a5fbe1bbe54a10d2afe`. The build checkout is GitHub's synthetic PR merge; this case has no file difference between that merge and the source head.
- [Native build and smoke run](https://github.com/tranhoangnguyen03/pi-consultants/actions/runs/41391266169): Linux x64, macOS Apple Silicon, and macOS Intel passed 11 application checks each.
- [Repository verification](https://github.com/tranhoangnguyen03/pi-consultants/actions/runs/41391266336): 155 tests plus repository checks passed.

The existing CI downloads are previews retained until 2026-11-16. They are useful for studying the current agent; they are not durable PiG-Agent release assets. [Existing installation runbook](https://github.com/tranhoangnguyen03/pi-consultants/blob/752a579af69ac9e8020450e72704fefabfe0c674/firm/docs/INDEPENDENT-ENGINEERING.md).

## User-reported walkthrough — 2026-11-02

The user reported six successful checks against the downloaded **df5ee25** build: installation and local health checks, a live standalone consultation, finding a known code defect, saving and retrieving a finding after restart, main Pi delegation to B, and same-release reinstall preserving private state. These are reported manual results, not a new run performed by PiG-Agent.

The report leaves two-installation cooperation, upgrade to a different release, rollback, and external connectors untested. It also reports misleading startup errors with `--no-mcp`. Keep those limits attached to this evidence; a passed reinstall does not prove an upgrade, and a passed main-Pi request does not prove the full two-installation journey.

## What the prototype carries

PiG 0.5.3, Node 24.15.0, the Engineering role prompt, HQ and collaboration tools, all shared/Engineering skill trees, diagram-design assets, and the locked shared packages for directory changes, web access, document parsing, and browser use. It preserves full resource trees and production package dependencies. [Assembly source](https://github.com/tranhoangnguyen03/pi-consultants/blob/752a579af69ac9e8020450e72704fefabfe0c674/firm/independent/build.mjs), [runtime pins](https://github.com/tranhoangnguyen03/pi-consultants/blob/752a579af69ac9e8020450e72704fefabfe0c674/firm/independent/runtime-lock.json), [package lock](https://github.com/tranhoangnguyen03/pi-consultants/blob/752a579af69ac9e8020450e72704fefabfe0c674/firm/independent/packages/package-lock.json).

A model account is needed. Git and optional external programs remain machine requirements; browser use, external connectors, and some document/media tasks have their own programs or accounts. The package is not an operating-system sandbox.

## Where current B chats live

The existing default home is `~/.pi-consultants/engineering`. Its native chat files live in:

```text
~/.pi-consultants/engineering/.hq/sessions/<timestamp>_<session-id>.jsonl
```

If installed with `--home ~/.pi-consultants/engineering-preview`, the same relative path is under that preview home. A new chat shares the home's settings, credentials, playbooks, and case store; it starts a new transcript. Changing the project folder does not move normal session storage. Advanced explicit session-path arguments can override the default.

The current runbook's description of `-c` is too broad: PiG selects the latest session matching the launch working directory, not simply the latest session in the whole home. Prefer an explicit saved session when choosing among projects. [Launcher](https://github.com/tranhoangnguyen03/pi-consultants/blob/752a579af69ac9e8020450e72704fefabfe0c674/firm/independent/launcher.mjs), [PiG continuation implementation](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/internal/codingagent/session_resume.go).

## Gaps before catalogue promotion

1. Native desktop install and New session launch are not provided by this prototype.
2. A private Pi home does not prevent every project setting or external tool from using host state. Enforce and test the catalogue's project configuration policy and inventory the suite's state paths.
3. The disabled-MCP path still lets HQ register connector servers after PiG removes the MCP handler. Source inspection explains the reported misleading startup errors; the exact user log has not been reproduced here. Skip those registrations when MCP is disabled instead of hiding stderr. [HQ registration](https://github.com/tranhoangnguyen03/pi-consultants/blob/752a579af69ac9e8020450e72704fefabfe0c674/firm/src/pi-extension.mjs), [PiG handler selection](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/coding/cli/extension_set.go), [registration error contract](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/coding/extension/api.go).
4. Give source and build identities separate labels in diagnostics and handoffs.
5. Complete manual two-installation cooperation, a different-version upgrade, rollback, and each external integration before claiming them as manually verified. Automated peer and reinstall checks do not substitute for those journeys.

The adjacent `agent.json` is catalogue metadata for this reference. It is not an executable build recipe or a promise that a PiG-Agent installer already exists.
