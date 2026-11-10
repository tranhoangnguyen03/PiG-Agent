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
