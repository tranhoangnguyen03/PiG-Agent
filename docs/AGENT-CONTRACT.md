# Agent, home, and session contract

Status: proposed product contract, grounded in PiG 0.5.3 and the independent Engineering prototype. This document defines the target; it does not claim that PiG-Agent already implements it.

## 1. Product goal

Curate complete agents that people can download and use with little setup. An agent may be a specialist, a daily driver, or a full extension suite. A ready-to-install agent must supply the runtimes and local tools needed for its core functions, either in the download or through its supported install flow. Account access and remote services remain explicit requirements. Features needing extra manual setup must be marked optional, or the entry must be labeled **requires setup**.

Self-contained means the application chooses and supplies its runtime, extensions, prompt layers, defaults, and private-state roots. It does not mean that model services run offline, that every external service is bundled, or that the process is an operating-system sandbox.

The normal path is **install once, connect accounts once, open many sessions**. An independent reviewer starts a new conversation for every new review task. One session means one conversation; it does not limit an agent to one permanent conversation.

The [files and sessions guide](FILES-AND-SESSIONS.md) defines the proposed generic source, release, and private-home paths and explains which edits need a build. These conventions apply to agents beyond the Engineering prototype.

## 2. Definitions and ownership

| Term | Meaning |
|---|---|
| Agent definition | Maintained source describing the agent's purpose, suite, prompts, defaults, requirements, and build inputs |
| Release | One version of that definition, assembled and tested for a target operating system and processor |
| Installation | A selected release, stable launcher, and one private home |
| Home | The installation's settings, credentials, sessions, extension data, and working defaults |
| Workspace | The folder where this conversation works; it may be a project or the agent's own empty workspace |
| Session | One saved conversation, including messages and tool activity |
| Run | One live process, which may start a new session or resume one |
| Personal setup | Selected private settings, prompt additions, and account access used to provision an installation |

A release may serve several installations. A single installation may have many sessions. A project folder does not own the agent's account files or chat storage.

The catalogue owns packaging and lifecycle metadata. Each agent owns its expertise and its own persistent tools. For B, that includes HQ. PiG-Agent does not make every agent adopt HQ or add another memory store. A saved conversation is evidence of a conversation, not automatically an accepted mission decision.

## 3. Package contents

| Item | Released application | Private home |
|---|---|---|
| Engine and required runtimes | Pinned, bundled native builds | Optional runtime cache only |
| Extensions and dependencies | Exact tested suite, with local imports and production dependencies | A changed suite uses a new public or private build; ad hoc overlays need a later defined policy |
| Skills, scripts, references, templates, themes | Complete trees and assets | Maintained additions use a new build; supported personal prompt additions live in the home |
| Baseline system prompt | Maintained and compiled into the agent | A changed baseline requires a new release |
| Maintained append prompts | Explicit ordered release files | Private append prompt additions |
| Settings and provider configuration | Non-secret defaults and supported options | Model choice, local overrides, account setup |
| MCP and other connectors | Code, default configuration, declared requirements | Account tokens and local endpoints |
| Credentials | Names, purpose, and setup method; no real values | Actual secrets or references to a local secret store |
| Chats and agent records | Never taken from a working home | Persistent private data |

An agent should not depend on a global Pi installation. An extension that calls `pi`, Python, a browser, or another program must have that dependency supplied for core use. Optional functions may declare extra setup. An extension that writes to a global browser profile, cache, or account directory must be redirected where supported or declared as a shared host dependency. Changing Pi's config directory alone does not make every tool private.

## 4. Prompt and settings rules

The product must make the effective setup inspectable:

1. The release supplies the baseline system prompt.
2. It adds maintained append prompts in a declared order.
3. The home may add private prompt text and user settings.
4. The selected project contributes project instructions through a defined context channel.
5. The session contributes conversation history.

This is a composition order, not a promise that later prompt text has higher authority. The launcher must not let an unrelated global Pi setup or a project's runtime settings silently change the curated suite.

PiG 0.5.3 rejects `--system-prompt` replacement for a compiled Piglet but permits repeatable `--append-system-prompt`. Therefore the build owns the baseline; launch should pass append files explicitly instead of relying on folder discovery. [Sources: Piglet contract](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/docs/site/docs/piglets.md), [CLI rules](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/coding/cli/main.go), [prompt discovery](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/coding/cli/resource_prompts.go).

For the curated launch path, use PiG's supported project-trust controls to exclude project runtime configuration while retaining project context files. In PiG 0.5.3, `--no-approve` means that the project configuration is not trusted; it is not a switch that rejects every tool action. This policy still needs an integration test with the exact packaged suite. Advanced CLI changes must be explicit and reported as a customized run. [Sources: argument handling](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/coding/cli/args.go), [startup trust and context](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/coding/cli/cli_runtime_build.go), [settings loading](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/internal/codingagent/settings.go).

On first installation, the installer starts the private settings file from release defaults. After that it is the user's settings file and survives updates. New release defaults remain visible separately; automatic default/override merging is not an implemented promise. Changes that need a migration must say so and provide a tested path. Private file edits should take effect on the next new session, with any supported live reload documented by the selected suite.

Validate explicit prompt paths before launch. PiG may treat a missing prompt-file argument as literal prompt text. Inspect the effective context sources too: its native project context search includes ancestor instruction files. That is useful project context, but must not be mistaken for a promise that only files inside the selected folder can affect the conversation.

## 5. New sessions, resume, and storage

**New session** starts a fresh conversation using the same installed release, credentials, settings, tools, and private home. It creates a unique native session file once there is conversation content. Closing a session does not delete it. Starting another session does not automatically inject every old conversation. Any extension that recalls or injects past knowledge must be identified in that agent's entry.

The catalogue launcher starts a fresh process and native session for each New session action. A new task must also avoid stale task context loaded by extensions: selected cases, old briefs, prior verdicts, queued work, and task summaries. Standing instructions and selected reusable lessons may remain available. Prior task records are retrieved when the current task calls for them; they are not automatically treated as fresh-review context. The same default applies to new delegated requests. See the [reviewer example](FILES-AND-SESSIONS.md#6-your-independent-reviewer-one-task-one-fresh-session).

The launcher selects the session directory under the home explicitly. Changing the working folder must not change where chats are stored. The default proposed home for new catalogue installations is `~/.pig-agent/<agent-id>`; an explicit alternate home creates another installation. This is a proposed PiG-Agent path, not PiG's default and not a migration instruction for existing B users.

| Path under the proposed home | Purpose |
|---|---|
| `.agent/releases/` and `.agent/current` | Retained application versions and the selected version |
| `bin/` | Stable command used by shortcuts and calling agents |
| `.pi/` | Agent settings, models, accounts, and private prompt configuration |
| `sessions/` | Default session location for a new generic agent |
| `state/` | Declared private extension data |
| `workspace/` | Stable working folder when no project is selected |

An existing agent may keep its native state layout. Its entry must declare it. B already uses `.hq/sessions`, `.hq` records, and organization playbooks. Adopting the catalogue should not move those paths merely for cosmetic consistency.

**History** lists this installation's saved sessions and lets the user select one. Resume passes the selected session's exact identity/path. Display the saved project and the release used when the session ran; resuming under a newer release does not pretend the old run used the new code.

Do not implement a vague Continue button by blindly passing `-c`. In PiG 0.5.3, continuation with a custom session directory chooses the latest session whose header matches the launch working directory. An explicit history selection avoids that hidden rule. [Sources: session files](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/internal/codingagent/session_manager.go), [continuation](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/internal/codingagent/session_resume.go).

Several new chats may share one home. They need distinct transcript files. Shared extension state and token refresh must be checked for concurrent use; a tool that cannot support it needs a clear limit. Do not open the same saved session for writing in two processes. An update must not replace a release being used by a live process.

## 6. Accounts and a personal prepared agent

The public catalogue carries credential requirements, never live account values. During first launch, connect the selected model provider and any required services. Missing optional accounts should leave optional features clearly unavailable, without making ordinary chat fail.

A separate **private personal setup pack** is a planned way to carry selected credentials, private settings, and private prompt additions. Encrypt it, keep it outside public release assets and source, and import it into the home. It should not silently include chat history, client files, every browser profile, or an entire Pi directory. The user chooses the included items.

Personal provisioning follows the release lifecycle; it does not turn an installed home into the source for the next public release. OAuth tokens may expire, rotate, depend on an operating-system credential store, or require a fresh login. Do not promise that copying them always preserves access. First version account support can use the engine's existing per-home login, with private import implemented as a separate capability.

## 7. Three forms of access

The same selected application and home must work through direct terminal use, a main-agent adapter, or another agent's request. Direct use opens the terminal UI. Programmatic use uses native print/RPC interfaces, without opening a desktop window.

The caller supplies the task, context, working folder, and deadline. The child retains its declared tools and its own home. Progress, questions requiring a person, cancellation, final output, and the saved session must remain available to the caller. Never turn a missing human dialog into an automatic approval.

Firm rosters, same-domain departments, rooms, shared mission records, and scheduling are consumers of this primitive. They do not belong in the installer or catalogue.
