# Reference shell: hands-on acceptance

**Status:** Manual qualification steps, not a claim that they passed. The current preview bundles the real PiG runtime and all three extensions. Native CI checks the package, commands, some model tools, and separate sessions. These steps test the **interactive behavior that CI cannot establish**.

Build on your operating system using the exact pinned checkout in [PR #2](https://github.com/tranhoangnguyen03/PiG-Agent/pull/2) or download that commit's native GitHub Actions artifact. Do not use a passing artifact from a different commit as evidence.

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

## Test pi-comms between main Pi and PiG specialists

**Candidate:** pi-comms `0.2.0` from [PR #41](https://github.com/tranhoangnguyen03/pi-comms/pull/41), **based on merged M4 F10–F12 (0.1.12)**. The old [PR #34](https://github.com/tranhoangnguyen03/pi-comms/pull/34) and its Comms pin predate the current approval and durable-mailbox contract. Rebuild the shell with the updated exact `shell/source-lock.json` commit; using an earlier PiG preview is not valid evidence.

The PiG launcher uses `PI_COMMS_BROKER_DIR` from its environment, or defaults to `$HOME/.pig-agent/_comms`. Main Pi must use the **same absolute directory** while retaining its own `PI_CODING_AGENT_DIR`:

```sh
export PI_COMMS_BROKER_DIR="$HOME/.pig-agent/_comms"
PI_COMMS_BROKER_DIR="$PI_COMMS_BROKER_DIR" pi
PI_COMMS_BROKER_DIR="$PI_COMMS_BROKER_DIR" "$HOME/.pig-agent/shell-preview/bin/shell-reference" new
```

For a full cross-home check, install two distinct PiG shell homes and leave main Pi plus both specialists running. Each host retains its own private keys, transcripts and model choices. In the actual TUIs:

1. Use `/comms status` and `comms_peers` to record each **exact native ID** and shared broker PID. If two PiG specialists use the same display name, choose by ID; do not guess an alias.
2. Ask main Pi to assign a substantive read-only review to specialist A. The first genuine owner prompt grants one unordered exact pair for **both directions**. The original request continues. A asks a clarification, main Pi answers, and A sends a final report linked to the original message; `comms_ask` returns the first reply, not automatic work completion.
3. Repeat PiG A ↔ PiG B without sharing either private home. Test one first-contact No/Esc, Pause/Resume, revoke and a third peer who is **not** transitively approved.
4. Test saved-session resume, normal runtime restart, broker restart and F12 exact offline messages. **Allow this session** lasts through same-runtime socket drops but not Pi/broker restarts; **Allow & remember** survives those restarts until revoked. An accepted `queued` message survives broker restart on disk, but is not model admission or completed work. A fresh Pi session never inherits another session's ID, chats or approval.
5. Test human drafts and Stop with real keyboard input. If using RPC, preserve real human approval forwarding or return approval-required; never silently grant contact.

See [the full qualification ledger](https://github.com/tranhoangnguyen03/pi-comms/blob/feat/pig-cross-home-on-m4/docs/PIG-CROSS-HOME-QUALIFICATION.md). Protocol/client process tests and native smoke checks do **not** count as a real-model PiG assignment. Record exact host/Comms SHA, PiG/Node/OS, installed artifact digest, approval prompts, request/return handles, report links and result PASS / FAIL / NOT RUN.

## Test main Pi → shell RPC and upgrades

The stable command `~/.pig-agent/shell-preview/bin/shell-reference rpc --cwd /path/to/test-project` starts a PiG JSONL RPC server; the parent must provide an RPC client and preserve progress, cancellation, UI questions and the final assessment. `print "hello"` is suitable for simple CLI calls but not a substitute for an interactive approval flow. The same installation and private home serve both interfaces.

For an update, install a **different tested release** into the same preview home, verify settings, accounts, private prompt, sessions and extension state, then roll back to a compatible earlier build ID. A same-release reinstall alone is not update evidence. Never put account values, private prompts or client files into the public shell source or Actions artifacts.

## Report shape

Record **pass, fail or not-run** for each journey and name the actual binary/artifact. Include a short reproduction for every failure and route extension-specific fixes upstream. A successful `doctor` or command-list result proves files and registration, not complete interactive behavior.
