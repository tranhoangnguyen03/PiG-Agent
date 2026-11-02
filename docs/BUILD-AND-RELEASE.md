# Build and release design

Status: proposed workflow. The existing Engineering builder is the tested reference; a general PiG-Agent packager and desktop installer are still to be built.

## Curate the whole suite

An agent definition must identify its full setup: extensions and exact sources, package lock, skills and companion assets, system and append prompts, settings defaults, model options, connectors, runtime programs, and private state paths. A list of npm package names is not enough.

An import from a personal Pi setup should produce a reviewable definition. It should classify each item as public release content, private setup, runtime state, or an unresolved machine dependency. It must identify absolute local paths and install hooks. Do not publish private values as a side effect of discovering the setup. A local importer is planned, not implemented here.

Use the maintained upstream source for expertise. For Engineering, keep `pi-consultants` as the source of its profiles, skills, and HQ behavior. Pin that source in this catalogue; do not maintain a second edited copy of B's practice.

## Build the application

PiG supplies Piglet definitions, native compilation, release identity, and a signed binary publication/pull/update flow. It supports separate agent release namespaces in one repository. Reuse those concepts; keep PiG-Agent's additional work focused on the complete dependency bundle, private home, desktop launcher, and catalogue. [Sources: Piglets](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/docs/site/docs/piglets.md), [binary releases](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/docs/site/docs/piglet-binaries.md).

A native PiG binary does not include Node. TypeScript/JavaScript extensions still require a supported runtime. A single-file extension also does not automatically bring all of its sibling files. Supply required runtimes and preserve full package and skill trees, including local imports, scripts, templates, references, native dependencies, and license notices. The current Engineering build demonstrates this assembly with PiG 0.5.3 and Node 24.15.0.

The build must use fixed source commits, runtime checksums, and package locks. It should fail with a clear unmet dependency instead of quietly relying on the builder's global Pi, Node, Python packages, or account files. A core local dependency must be bundled or supplied by the supported install flow before the entry is called ready. Model services remain explicit account requirements; extra manually installed tools belong to clearly optional features or an entry labeled requires setup.

Build natively for each supported operating system and processor when the package graph contains native code. A successful compile is only the first check; exercise the actual assembled application outside its checkout and ordinary developer setup.

## Desktop installation and opening

The product goal is one install action after any operating-system approval, followed by one action to open each new session. Account setup belongs to first use. A web catalogue can offer downloads; it cannot silently install a native application by itself.

| Surface | First version |
|---|---|
| macOS | A per-agent `.app`, distributed in a native download, that opens the bundled agent in Terminal |
| Linux | A per-agent application-menu entry that starts the bundled agent in a terminal |
| Command line and callers | Stable executable with native print/RPC support and an explicit home |
| Shared catalogue desktop app | Later, only if choosing/installing/updating many agents needs a common local UI |

The launcher resolves its own release and private home. It must not depend on Finder's working directory, a shell profile, or a global `pi` command. Clicking the agent icon means **New session**: open a fresh terminal session directly, even when another chat is already running. Do not require a launcher menu on every start. **Open project** is a separate action that picks a folder; a user may choose to remember it as the default. Without a chosen project, use the installation's stable workspace. **History** and **Open data folder** are secondary actions that expose continuity without making users remember paths.

macOS public distribution needs a tested Developer ID signing and notarization process for a smooth normal download. Unsigned previews can be useful, but must be labeled as such and may need extra operating-system approval. Apple's supported packaging formats include ZIP, DMG, and installer packages. Linux desktop entries support executable, working directory, terminal mode, and extra actions. [Apple distribution](https://developer.apple.com/documentation/xcode/packaging-mac-software-for-distribution), [Apple notarization](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution), [desktop entry specification](https://specifications.freedesktop.org/desktop-entry/latest-single/).

PiG's appended Ed25519 binary signature and Apple's code signature are distinct. Do not assume signing a Mach-O file afterward preserves PiG's byte-level signature. Verify a supported order or sign and verify the final application package through a suitable release path. [PiG signature implementation](https://github.com/MichaelKinsy/PiG/blob/v0.5.3/coding/piglet/signature/signature.go).

## Catalogue and release identity

Each entry should show purpose, included suite, supported platforms, required accounts, external requirements, state paths, source, release version, download integrity information, and verification status. Agent versions are independent of the catalogue's own changes. Per-agent tags such as `engineering/v0.1.0` are a suitable naming model; final tag spelling follows the chosen publisher.

Keep these identities distinct:

- **Source head:** the maintainer's branch commit.
- **Build checkout:** the exact commit the build used, which may be a CI test merge.
- **Source tree:** the file tree that was assembled.
- **Artifact identity:** the final target-specific package and digest, with its build run.

User-facing diagnostics and test reports should show the actual artifact identity. Do not label a build tested merely because a nearby commit passed. A PR merge and its head may share the same tree; record that fact instead of treating the hashes as interchangeable.

CI artifacts are useful previews and expire. A curated ready-to-install release should have durable versioned release assets. A checksum detects damaged or changed bytes; a trusted signed publication provides a separate authenticity check. Verify the final downloaded package, not only an earlier intermediate binary.

## Updates, rollback, and removal

An update downloads and verifies a new release, checks compatibility, waits until the affected installation can switch safely, then selects it. It preserves credentials, settings, private prompts, sessions, and declared extension data. Keep a previous release available for compatible rollback.

Do not overwrite a locally changed managed file without surfacing the conflict. Local customization should either live in a supported home layer or return to the maintained definition and become a new release. A user installing arbitrary packages into the immutable release changes what was tested.

Rollback selects compatible application code; it does not undo external actions or rewind case history. State-format changes need an explicit migration and rollback policy. Removing the app should keep its private home by default. Deleting private data is a separate explicit action.
