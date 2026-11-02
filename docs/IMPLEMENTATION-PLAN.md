# First implementation plan

Status: plan, not completed implementation. Start with Engineering B because its independent runtime has already been built and exercised. Prove one whole installation journey before adding a shared catalogue app or several agents.

## 1. Qualify the existing runtime as a curated package

- Pin the Engineering source, PiG, Node, and package graph using the [reference entry](../catalogue/engineering/README.md).
- Keep expertise and HQ maintained in `pi-consultants`; have PiG-Agent consume a fixed source/release.
- Make the disabled-MCP launch path skip application connector registration. Test it without suppressing unrelated extension errors.
- Make diagnostics distinguish source head, build checkout, tree, and final artifact.
- Enforce the chosen project-settings and append-prompt policy. PiG 0.5.3 has project trust controls; verify that project instructions still load while an unrelated `.pi/settings.json` or `APPEND_SYSTEM.md` cannot replace the agent's runtime setup.
- Inventory all extension state paths and external dependencies. Preserve full asset trees. Identify any tool still using a global browser profile, cache, or account store.

Acceptance: the relocated package runs on a clean target without a preinstalled Pi or Node; its required accounts and remaining host tools are explicit; normal disabled features do not show startup failures.

## 2. Complete one desktop journey

Start with macOS and keep the existing terminal UI. Build a per-agent application launcher that installs into a stable home, opens a fresh chat, offers project selection and history, and exposes the data folder. Keep direct print/RPC invocation available for the main-Pi adapter. Add the Linux desktop entry using the same application contract.

First launch should create the home and help connect a model account. Later New session launches should open directly with the saved setup. Do not require package installation, path editing, copying config folders, or selecting an extension list for ordinary use.

Acceptance: download → install → first login → new chat → second new chat → explicit resume. Repeat in a path containing spaces. Check two chats have distinct transcripts and use the intended project. Handle a missing project folder with a useful choice rather than an unexplained startup error. Label unsigned previews honestly while production signing is arranged.

## 3. Exercise updates and collaboration

Build two distinct versions. Test an upgrade, preservation of settings/credentials/private prompt/session files, a changed default, a local managed-file conflict, and a compatible rollback. Same-release reinstall alone does not prove upgrades or rollback.

Test both main Pi → B and installation A → installation B. Keep the task, process, session, and home identities separate. Check cancellation and a real human question. Two installations must not share private case data merely because they use the same release.

Acceptance: evidence names the actual artifact tested and distinguishes automated checks, manual checks, and untested services. A reported walkthrough is useful evidence but does not imply untested paths passed.

## 4. Generalize with a second suite

Choose a second agent with a different extension suite and no dependency on HQ. Capture its maintained prompt, append prompts, package lock, defaults, external requirements, credential declarations, and state paths in a definition. Use that second agent to decide which parts of the Engineering builder truly belong in the shared packager.

Do not copy the whole daily-driver home into a release. A local import should first show what is software, what is personal configuration, what is secret, and what is session data. The selected suite must be supplied or inspected on its owner's machine; the catalogue cannot infer it from a list of repository names.

Acceptance: both agents use the same install/new-session/update rules while keeping their own tools, prompts, data, and release schedules.

## 5. Add optional private provisioning

Implement a selected, encrypted personal setup export/import if repeated account setup remains a real burden. Keep it separate from public release creation. Cover API keys, provider configuration, private prompt text, permissions, and token refresh behavior. Report which accounts require login again. Session backup is a separate choice.

This capability is not required to open new chats in an already configured installation. Its existing home already retains account access.

## What is deliberately outside the first version

No new chat renderer, background agent service, shared memory database, autonomous team scheduler, room coordinator, or automatic external-account copying. Keep the first result focused on a complete native agent that is easy to install, start, continue, and update.
