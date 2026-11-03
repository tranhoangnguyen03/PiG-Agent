# PiG-Agent

A curated catalogue of complete agents that you can install, open, and update as applications.

Each agent carries its chosen extension suite, runtime, skills and supporting files, system prompt, append prompts, and default settings. Install it once, connect its accounts once, then open new chats without rebuilding the setup.

**Status: design and catalogue foundation. This repository does not yet provide a PiG-Agent installer or desktop app.** [Engineering consultant B](catalogue/engineering/README.md) is the first reference entry. Its independent runtime already exists in `pi-consultants`; this project defines the next step: complete, curated packages and simple installation and launch.

## The experience we are building

1. Choose an agent from the catalogue and install its native application.
2. Supply missing account access, or import a private personal setup.
3. Click **New session**. The agent opens with its own tools, prompts, settings, and private home.
4. Choose **History** to reopen a particular conversation, or **Open project** to work in a folder.
5. Update the application while keeping your settings, accounts, chats, and agent data.

The first desktop version should keep PiG's terminal chat UI. A launcher handles installation, projects, accounts, and session selection. It does not need to replace the chat UI or coordinate teams.

## Three things with different lifetimes

| Thing | What it contains | When it changes |
|---|---|---|
| Agent release | Engine, extension suite, full assets, prompt layers, defaults, required runtimes, launchers | When its maintainer publishes a version |
| Installed agent | A selected release and its private settings, accounts, chats, and extension data | As you use and configure it |
| Session | One conversation and its tool activity, with a chosen working folder | When you start, continue, or branch a chat |

**One installed agent can have many separate sessions.** For an independent reviewer, each new review starts a fresh chat; continuing an old review requires an explicit Resume choice. The agent keeps its setup and selected reusable lessons without automatically loading past review transcripts, verdicts, or active-case state.

The [plain guide to files, edits, and sessions](docs/FILES-AND-SESSIONS.md) shows exactly where a generic agent's source, installed resources, private settings, and separate chat files should live. These paths are proposed conventions for the packager, not a claim that a new reviewer app already exists.

Public releases contain account requirements and login support. Actual credentials belong to a private installation. A personal encrypted setup pack can carry selected credentials and private settings between machines; it is separate from the public catalogue.

## Catalogue

| Agent | Source | Status |
|---|---|---|
| [Engineering consultant B](catalogue/engineering/README.md) | `pi-consultants` | Working independent prototype; desktop installation and full catalogue qualification remain |
| [Independent Reviewer: design and practice drafts](docs/reviewer/README.md) | Proposed PiG-Agent definition, drawing on B's review workbench | Design for review; prompt, skill and playbook samples available; no downloadable Reviewer yet |

Agents may be specialists, a personal daily driver, or a complete workflow suite. They need not use the consultant HQ or share a memory system. Each entry must name its own dependencies, accounts, state paths, and tested behavior.

## Read next

- [Where files live and how to edit them](docs/FILES-AND-SESSIONS.md): a concrete source/install/private-home map and the independent reviewer example.
- [Agent, home, and session contract](docs/AGENT-CONTRACT.md): what self-contained means, what gets packaged, credentials, prompt rules, and session behavior.
- [Build and release design](docs/BUILD-AND-RELEASE.md): curation, pinned dependencies, provenance, native apps, updates, and the catalogue.
- [Implementation plan](docs/IMPLEMENTATION-PLAN.md): the first full install-to-update journey and the evidence needed to call it ready.

The contract and plan describe intended behavior. The Engineering entry separately records behavior verified in the existing prototype. No proposed command, UI, or credential-transfer feature should be read as already implemented.
