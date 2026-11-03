# Where files live, how to edit them, and how fresh chats work

Status: proposed general PiG-Agent design. The paths below are conventions for the packager we still need to build. They are not folders already supplied by this repository, and they do not require an agent to use consultant HQ.

**One installed agent can have many separate conversations. A session is one conversation, not the agent's entire lifetime.** An independent reviewer should start a new session for each new review task. It can keep its tools, settings, accounts, and selected reusable lessons while leaving past review transcripts out of the new conversation.

## 1. What PiG does

PiG runs the conversation and tools. A Piglet is PiG's definition of a named agent: it selects extensions, skills, prompts, tools, and other requirements. PiG can run that definition from source or compile an application from it. PiG-Agent adds the complete package, private home, catalogue, and simple launch/install experience. [PiG's definition and source-run documentation](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/docs/site/docs/piglets.md).

As an agent author, you edit ordinary text and code files. As an agent user, you open the installed app. You do not need to learn Go or rebuild PiG to change personal settings or add private instructions.

There are three physical places to understand:

| Place | Purpose | Who changes it |
|---|---|---|
| Source repository | The maintained definition used to make releases | The agent's author, including you or your coding agent |
| Installed application files | A built, tested copy of the runtime and its shipped resources | The installer and updater |
| Private files | This installation's settings, credentials, chats, and extension data | You, the runtime, and the chosen extensions |

The last two can live under one local agent folder. They still have different update rules.

## 2. Where to create the agent in the repository

For agents maintained here, use `agents/<agent-id>/`. Use `catalogue/<agent-id>/` for the catalogue entry that points to its source and downloads. The hypothetical independent reviewer has ID `reviewer`.

All paths in this table are relative to the PiG-Agent repository:

| Source path | What belongs there |
|---|---|
| `agents/reviewer/piglet.yaml` | PiG's agent definition: selected resources, baseline prompt, tools, and model preferences |
| `agents/reviewer/package.json` and `agents/reviewer/package-lock.json` | Third-party extension packages and their locked dependencies |
| `agents/reviewer/runtime-lock.json` | PiG, Node, and other supplied runtime versions and checksums |
| `agents/reviewer/extensions/` | Custom extension code written for this agent, with its local supporting files |
| `agents/reviewer/skills/` | Skill directories containing `SKILL.md`, scripts, references, and other assets |
| `agents/reviewer/prompts/system.md` | The maintained baseline instructions: what this reviewer is and how it works |
| `agents/reviewer/prompts/append.md` | Maintained additional instructions shipped with the agent |
| `agents/reviewer/templates/` and `agents/reviewer/themes/` | Reusable prompt templates and themes, when included |
| `agents/reviewer/defaults/settings.json` | Non-secret settings used to start a new installation |
| `agents/reviewer/defaults/models.json` | Non-secret custom-provider defaults, if needed |
| `catalogue/reviewer/agent.json` | Catalogue description, source pointer, platforms, version, requirements, and release links |

The build obtains third-party extension code from the locked package sources. You do not need to paste every package into `extensions/`. The final download must still contain the installed dependencies needed to run it.

PiG itself reads its declared Piglet resources; it does not automatically understand every proposed PiG-Agent folder. Our builder must map these files into the finished application, install the dependencies, and supply the correct launch arguments. The lock/defaults/desktop conventions above are part of that builder's job.

An agent maintained in another repository can keep its source there. Its catalogue entry pins that source and its build definition. We should not create a second editable copy of its expertise merely to list it here. Engineering B is one such external reference; this convention applies equally to agents unrelated to B.

## 3. Where the installed application lives

The proposed default installation folder for this reviewer is:

```text
~/.pig-agent/reviewer/
```

Here `~` means your operating-system user folder. An explicit alternate home creates another independent installation. Clicking its app icon starts its stable launcher; you do not have to browse these folders during ordinary use.

Downloading the archive alone does not create a chat or an account setup. Installation places its application files in the home and creates the private directories it needs. After a completed installation, the stable launcher uses those installed files; the original download can be removed. A source checkout is only needed for authoring and building changes, not for normal use.

| Path relative to that folder | Purpose |
|---|---|
| `.agent/releases/<release-id>/` | A complete installed application version; the release ID identifies its exact build |
| `.agent/current` | A pointer to the selected version |
| `bin/reviewer` | The stable launch command used by the desktop shortcut and other agents |

For new agents built with the generic packager, the selected release should have this readable layout:

| Path beneath `.agent/current/` | Contents |
|---|---|
| `runtime/` | The compiled reviewer and required runtime programs such as Node |
| `app/extensions/` | Shipped custom extension trees |
| `app/packages/` | Installed third-party packages and their dependencies |
| `app/skills/` | Complete shipped skill trees |
| `app/prompts/` | Shipped append prompts and readable copies of prompt source |
| `app/templates/` and `app/themes/` | Shipped prompt templates and themes |
| `app/defaults/` | Release settings and provider defaults |
| `release.json` | Version, source/build identities, resource paths, and file inventory |

Some code and instructions may also be embedded in the compiled program. In particular, PiG 0.5.3 compiles the selected baseline system prompt into a Piglet binary and rejects replacing it with `--system-prompt`. A readable packaged copy of `system.md` is for inspection; changing that copy alone does not change the compiled baseline. [PiG's compiled-prompt rule](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/coding/cli/main.go).

Existing third-party agents may have a different internal payload layout. The build record must identify their paths. Preserve their required relative file structure instead of forcing a cosmetic rearrangement. The catalogue still exposes one stable command and a known private home.

## 4. Where private settings, credentials, and chats live

These paths are under the same proposed `~/.pig-agent/reviewer/` home, outside the replaceable release:

| Private path | Contents | How it is changed |
|---|---|---|
| `.pi/settings.json` | Your settings and model preferences | Supported settings UI or a text editor |
| `.pi/models.json` | Your custom-provider configuration, if used | The provider setup flow or a text editor |
| `.pi/auth.json` | Engine-managed model account credentials where supported | The login/account flow |
| `.pi/APPEND_SYSTEM.md` | Your private extra instructions | A text editor or an agent you ask to edit it |
| `sessions/` | A separate saved transcript for each chat | The runtime; selected through History |
| `state/<extension-id>/` | Declared extension data, such as lessons, task records, or caches | That extension's tools and supported files |
| `workspace/` | A stable working folder when you have not selected a project | You and the agent's normal file tools |

For example, your private extra instructions could live in:

```text
~/.pig-agent/reviewer/.pi/APPEND_SYSTEM.md
```

They might say: "In reviews, give special attention to consistency, coherence, and cohesion. Challenge needless complexity and explain the effect on users."

The launcher must load this private append file explicitly along with the shipped append prompt. Merely putting a file in an arbitrary directory will not make it active.

On first installation, the installer starts the private settings file from the release defaults. After that it is your settings file. Updates preserve it and make new defaults available separately. Do not promise an automatic merge of every new default into existing settings; a later settings migration needs defined behavior.

The default location for new generic session files is therefore:

```text
~/.pig-agent/reviewer/sessions/<timestamp>_<session-id>.jsonl
```

PiG supports an explicit session directory and distinct native session files. This path is our proposed launch convention, not PiG's built-in default. The launcher must select it. [Session creation](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/internal/codingagent/session_manager.go).

The state folder is a place for extension-owned data, not a new shared memory database. Each extension must actually be configured or adapted to use its declared private paths. Existing supported native layouts may remain in place. Browser profiles, external command-line accounts, and other tool state require the same explicit inventory; changing the Pi config root does not relocate them automatically.

None of these private files are part of a public release. A personal private export is a separate, explicit feature. Updating the application must preserve them.

## 5. How you create or change things

### Before installation: author an agent

Create its source directory, write the system and append prompts, add skills and custom extensions, choose package versions, and set non-secret defaults. Develop and test the source setup. Then build a native package and test that package outside the checkout. Publish it when ready, or keep it as a private local build.

The build should produce the complete application and its record. The installer supplies the stable command and private home. The user of that download should not assemble the suite again.

### After installation: choose the right edit location

| Desired change | Edit here | How it takes effect |
|---|---|---|
| Change your model or personal settings | The home's `.pi/settings.json` or settings UI | Supported setting action or the next new session |
| Add personal review guidance | The home's `.pi/APPEND_SYSTEM.md` | The next new session loads it |
| Connect an account | The installed agent's login flow | The agent retains its account setup |
| Save or revise a reusable lesson | The chosen memory extension | That extension's normal memory behavior |
| Change the maintained baseline system prompt | Source `prompts/system.md` | Build and install a new version |
| Change the shipped append prompt or a shared skill | Its maintained source file | Build and install a new tested version |
| Add, remove, or upgrade a packaged extension | Source package and Piglet definitions | Build and test a new version |
| Change defaults for future installations | Source `defaults/` | Build a new version; existing private settings remain owned by their users |

You can change an installed agent's application by building a private version and installing it into the same home. You do not have to publish that build or lose your chats. For larger customizations to someone else's agent, keep your source as a maintained personal variant based on a pinned upstream version.

Use private prompt additions for quick personal instruction changes. Use a new build for changes to the baseline or released suite. Directly editing `.agent/current/app/` would change a managed download, can break its integrity record, and can conflict with updates. The source/private-home split gives those edits a place where they can be maintained.

The first general contract supports packaged extensions and skills through new builds. Ad hoc private extension/skill overlays would need a defined loading and compatibility policy; we should not imply that such a feature already exists. This does not prevent personal variants or ordinary private settings/prompt edits.

After editing a private file, start a new session for predictable behavior. A selected runtime or extension may offer an explicit reload, but we do not promise that every running chat reloads every file immediately.

## 6. Your independent reviewer: one task, one fresh session

| Action | Conversation | Prior task material loaded automatically? |
|---|---|---|
| Review change A | New session A | No |
| Review change B | New session B | No |
| Reassess A independently | New session C | No; provide the new brief and evidence |
| Continue the unfinished review of A | Explicitly resume session A | Yes, because continuation was selected |

These chats use the same installed reviewer. They may be open at the same time if the selected suite supports concurrent use of shared state.

For the catalogue's New session action, start a fresh process and native session. Do not supply resume/fork state or a previous transcript. Native `/new` also creates a new session; PiG 0.5.3 rebuilds its ordinary extension host and extension processes for a session replacement. The fresh-process launcher is a simple way to support separate windows, not a claim that native `/new` fails to clear a conversation. [Runtime build behavior](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/coding/cli/cli_runtime_build.go).

The selected extensions must also honor the fresh-task rule. Do not automatically restore the previous review's selected case, brief, verdict, compaction summary, or queued work. A new session file alone cannot prevent an extension from deliberately loading old task material.

Keep three kinds of retained material distinct:

| Material | Example | Role in a new review |
|---|---|---|
| Standing standards | Check consistency, coherence, and cohesion | Maintained or private prompt instructions |
| Reusable lessons | Check whether retries can repeat a side effect | Small, selected memory; details can be read when useful |
| Task records | Findings, assumptions, and verdict about change A | Kept with A; retrieve when this task calls for them |

Saved transcript files can remain on disk without entering the next chat's model context. A memory extension may extract useful general lessons from past work; it need not replay the old reviews. Keep those lessons short, with links to supporting records where useful. The package must declare the extension's loading behavior.

`/bro remember-me`, consultant case tools, or another memory extension could own that behavior once the selected package version is checked. PiG-Agent should not create a parallel memory store or promise those extensions already satisfy the clean-start contract.

The same default applies to delegation: a new review request starts a new review session and receives the bounded brief and evidence. Resuming an existing review is an explicit choice. A new chat also does not reset the project filesystem; it can still read the selected project's current files.

## 7. What needs proving in implementation

Use a generic reviewer to test the contract. Put a distinctive task-only fact into review A. Start review B through both the desktop launcher and a delegated request. Check that A's transcript, active case, task summary, and verdict are absent from B's initial context while a deliberately retained general lesson remains available. Then explicitly resume A and check that its history returns.

Also edit a private append file and settings, open a new chat, and verify the changes take effect. Build a changed application, install it into the same home, and verify that its new resources load while private settings, lessons, and all separate chats remain. These checks should use the actual packaged suite.
