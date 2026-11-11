# Reference shell: hands-on acceptance

**Status:** Manual qualification steps, not a claim that they passed. The current preview bundles the real PiG runtime and all three extensions. Native CI checks the package, commands, some model tools, and separate sessions. These steps test the **interactive behavior that CI cannot establish**.

Build on your operating system from the exact tested head of [parent PR #1](https://github.com/tranhoangnguyen03/PiG-Agent/pull/1), which contains the previously merged shell PR #2 and the later Flow/Comms pin fixes. Or download **that exact head's** Linux x64/macOS ARM64 CI artifact. Do not use an earlier preview from PR #2 as evidence for the current shell. Record the source SHA, actual CI merge checkout, role build ID, archive SHA256, PiG/Node/extension versions and OS before testing. This guide does not claim that any human-approved three-TUI journey already passed.

## Start the standalone shell

1. Extract the platform archive and verify its adjacent SHA-256 file. The archive contains `bundle/` with `shell-reference`.
2. Use a **separate preview home**, not your main Pi directory:
   ```sh
   ./bundle/shell-reference install --home "$HOME/.pig-agent/shell-preview"
   "$HOME/.pig-agent/shell-preview/bin/shell-reference" doctor
   "$HOME/.pig-agent/shell-preview/bin/shell-reference" new
   ```
3. In the actual PiG TUI, connect a model using the native `/login` and `/model` flows. Check help, tool display, model selection, window resize, history and new-session behavior.
4. Exit, start another `new` session and confirm it has an independent conversation. The history files should appear under `~/.pig-agent/shell-preview/sessions/`. Explicitly resume one by passing its **absolute** JSONL file path:
   ```sh
   "$HOME/.pig-agent/shell-preview/bin/shell-reference" resume "/absolute/path/to/saved-session.jsonl"
   ```
5. If an installed extension selects an active task/case or recalls prior content, check that the new session does not inherit an old task verdict. Shared lessons may remain available only under the extension's chosen memory rules.

The shell provides a stable terminal launcher now. Signed/notarized click-to-install and a desktop icon are not yet part of this preview.

## Final parent-PR acceptance: main Pi ↔ two installed PiG agents

**Operator task — NOT RUN:** this requires real TUI terminals, working model access and a person responding to the Pi consent dialog. The [two-home RPC test](https://github.com/tranhoangnguyen03/PiG-Agent/pull/9) deliberately *cancels* first-contact approval; it cannot establish the real human-approved exchange. Complete this check on the **exact current parent PR #1 shell artifact**, not on a historical preview.

Use the same verified macOS ARM64 or Linux x64 archive for **two distinct installs**. The unpacked archive must contain `bundle/shell-reference`. Choose a temporary lab location and record the archive hash, shell build ID, source head and its embedded Comms source pin before starting.

```sh
export LAB="$(mktemp -d)"
export PI_COMMS_BROKER_DIR="$LAB/shared-comms"
# From the directory containing the *verified*, extracted release:
./bundle/shell-reference install --home "$LAB/pig-a"
./bundle/shell-reference install --home "$LAB/pig-b"
"$LAB/pig-a/bin/shell-reference" doctor
"$LAB/pig-b/bin/shell-reference" doctor
```

Then open **three separate interactive terminals**. Shell variables from the setup terminal do not automatically appear in other terminals: in **each** terminal first export the exact `LAB` path printed by `mktemp -d`, then `export PI_COMMS_BROKER_DIR="$LAB/shared-comms"`. Native main Pi must load `pi-comms 0.2.0` (not an older package) in the same absolute broker directory. Do not copy agent-home paths or credentials between installations.

```sh
# Terminal 1: existing native main Pi, with pi-comms 0.2.0 installed
PI_COMMS_BROKER_DIR="$PI_COMMS_BROKER_DIR" pi
# Terminal 2: installed specialist A
PI_COMMS_BROKER_DIR="$PI_COMMS_BROKER_DIR" "$LAB/pig-a/bin/shell-reference" new
# Terminal 3: installed specialist B
PI_COMMS_BROKER_DIR="$PI_COMMS_BROKER_DIR" "$LAB/pig-b/bin/shell-reference" new
```

With the three models signed in, run this owner journey:

1. In main Pi: **"Ask specialist A to review the retry code, read-only. Keep the request linked, answer a clarification if needed, and report the final finding."** Select the actual A session ID if there is ambiguity. Approve once in the *real* UI with **Allow & remember**. Confirm the **same send** continues, without a second prompt or resending the work.
2. In specialist A, have it ask a meaningful clarification, then answer it in main Pi. A must send a final `complete` report linked to the original request. Main Pi's `comms_inspect` must show the original request, return handles, clarification and final report; the peer's report must not be presented as requester acceptance.
3. In specialist A, repeat with specialist B. Its separate pair needs a separate owner approval; main Pi's A–B approval must not grant A–C permission by accident. Test an explicit **Decline/Esc** on a previously unapproved pair as a separate check.
4. Pause A; send an eligible message while its model is busy or a human draft is present; Resume and check that the draft was not overwritten. Revoke a pair, attempt another send, and verify no delivery. Check Stop against current work and a later incoming request.
5. Save the exact PiG A session; send approved asynchronous offline mail to its exact ID, restart the shared broker, and resume that **same saved** PiG session. Confirm the saved receipt, no same-name substitution, and no duplicate work. Keep `comms_ask` live-only. New sessions have new identities and no inherited grant.

**Record PASS/FAIL/NOT RUN**, tested OS/host versions, exact session IDs in **local private notes only**, package source/archives (SHA256), count of owner consent dialogs, original request/reply IDs, `comms_inspect` results, observed model wakeups and manual extra prompts. Redact transcripts before sharing GitHub evidence. A passing score requires zero unapproved sends, zero unintended duplicate work and no untruthful claims of completion. A build, command listing or synthetic RPC refusal does not meet this requirement.

For the detailed negative cases and evidence ledger use [pi-comms issue #35](https://github.com/tranhoangnguyen03/pi-comms/issues/35) and its [cross-home guide](https://github.com/tranhoangnguyen03/pi-comms/blob/main/docs/PIG-CROSS-HOME-QUALIFICATION.md).

## Test pi-bro on the actual PiG TUI

- Open `/bro config`; select a backend available on this machine. Bro's default is not guaranteed to be your PiG model.
- Try `/bro text` with a short paragraph, then the ordinary `/bro` on a completed assistant answer.
- Verify modal input, scrolling, Esc, resizing and preferences. If your Bro release offers `/bro simplify`, verify that exact command against its current help rather than assuming the command was registered.
- Try `/bro remember-me` on a synthetic lesson, then start a new shell session and check retention and privacy. Do not use a real secret as test content.
- Run a real backend operation, interrupt it, and check process cleanup. Note whether your backend uses its own host-global credentials or the shell's model account.

Record PiG version, Bro package version, OS, exact command, expected/actual results, and observed limitations. [Upstream compatibility issue](https://github.com/tranhoangnguyen03/pi-bro/issues/177).

## Test pi-flow-external

- Open `/external` and `/external config`; test the control center and modal navigation.
- Inspect roles, a real external CLI's availability, and any reported disabled backend. Unused backends should not demand login.
- Configure one available CLI you actually own. Run a small `external_delegate` task, inspect its final result and supervision history using `external_runs`.
- Run a long synthetic task to check progress and cancellation. A child started in background is **not** a durable task after its parent runtime shuts down; record the outcome accurately.
- Verify run records and settings stay under this agent home or explicitly declared external-tool homes. Do not claim all CLI accounts isolated simply because `PI_CODING_AGENT_DIR` is set.

[Upstream compatibility issue](https://github.com/tranhoangnguyen03/pi-flow-external/issues/112).

## Test pi-comms between main Pi and this specialist

**Prerequisite:** both participants use the **same reviewed pi-comms 0.2.0 candidate** from [pi-comms PR #40](https://github.com/tranhoangnguyen03/pi-comms/pull/40). It starts from merged **0.1.12 F10/F11/F12** and adds the shared broker root. The old stacked [#34](https://github.com/tranhoangnguyen03/pi-comms/pull/34) built against pre-F11/F12 code and is not the selected candidate. Check the exact Comms SHA in `shell/source-lock.json`; rebuild and install a new shell before acceptance. Do not mix the shell's Comms 0.2.0 with an older native Pi package on the same shared broker.

In the shell, the launcher selects `PI_COMMS_BROKER_DIR` from the environment or defaults to `$HOME/.pig-agent/_comms`. Start main Pi with exactly the same broker directory, while preserving its own normal Pi agent directory:

```sh
PI_COMMS_BROKER_DIR="$HOME/.pig-agent/_comms" pi
```

Leave both **distinct native sessions** running. In main Pi, use `comms_peers` or `/comms` to locate the specialist's actual session. Try one substantive `comms_message`, approve the **exact session-pair contact** in the native human dialog, and have the specialist answer via its own installed `comms_message` tool. Test `comms_ask` separately: first reply is not the same as completed work. Then test Pause/revoke and inspect what remains visible. Confirm neither home contains the other one's session files or model tokens.

Starting a new session changes its exact identity. The shared broker does **not** launch offline agents, silently restore old consent, or share prompts or credentials. **M4 in this 0.2.0 candidate** restores F10 saved-session records/links/Pause, F11 remembered pair approvals (session-only approval ends on either runtime or broker restart), and F12 broker-persisted exact offline async mail under current consent. `comms_ask` remains live-only; no local waiter resumes automatically. Review [the detailed cross-home acceptance recipe](https://github.com/tranhoangnguyen03/pi-comms/blob/feat/pig-shared-broker-m4-baseline-35/docs/PIG-CROSS-HOME-QUALIFICATION.md), including two independent PiG specialists, actual return handles and human-versus-agent evidence. No approval prompt should be bypassed or fabricated just to make a test pass.

## Test main Pi → shell RPC and upgrades

The stable command `~/.pig-agent/shell-preview/bin/shell-reference rpc --cwd /path/to/test-project` starts a PiG JSONL RPC server; the parent must provide an RPC client and preserve progress, cancellation, UI questions and the final assessment. `print "hello"` is suitable for simple CLI calls but not a substitute for an interactive approval flow. The same installation and private home serve both interfaces.

For an update, install a **different tested release** into the same preview home, verify settings, accounts, private prompt, sessions and extension state, then roll back to a compatible earlier build ID. A same-release reinstall alone is not update evidence. Never put account values, private prompts or client files into the public shell source or Actions artifacts.

## Report shape

Record **pass, fail or not-run** for each journey and name the actual binary/artifact. Include a short reproduction for every failure and route extension-specific fixes upstream. A successful `doctor` or command-list result proves files and registration, not complete interactive behavior.
