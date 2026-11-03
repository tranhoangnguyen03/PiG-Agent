# Choose evidence that fits the target

These are ways to answer a question, not mandatory stages.

| Target | Start with | Follow the consequential claim | Useful pointer in the finding |
|---|---|---|---|
| Code change or pull request | Accepted behavior, exact base/head or local workspace state, actual implementation | Trace a caller, changed state or failure path, and the check that should protect it. Inspect staged, unstaged, and untracked changes separately where relevant. Tests can pass while the wrong behavior is tested. | Revision and path/symbol, plus the observed or predicted behavior |
| Proposed plan or specification | Intended result, accepted constraints, current system and consumers | Walk one real scenario through the proposal. Compare keeping the current approach, a smaller change, and the proposed one. Look for a missing decision or a guarantee only the expensive choice can keep. | Version and section, the underlying commitment, and whether the effect is predicted or observed |
| Guide, policy, or interface description | Intended audience, task, version, source of authority | Try following the instructions as written. Compare a promise with its example, another section, or the real interface. For an agent-facing interface, inspect what an actual caller sees for empty, failed, unavailable, and successful results. | Heading/step/table cell and the exact conflicting instruction or observed outcome |

For mixed work, combine the relevant evidence. A guide plus a CLI change often needs one user journey across both. Do not count three restatements of the same problem as three findings.

**Example: known defect versus missing decision.** A handoff guide tells an analyst to publish a corrected report. Its approval table reserves publication to Finance. If the accepted policy names Finance, request a correction at the conflicting step and describe the consequence. If no accepted source settles the owner, the contradiction is still a defect; report it and identify the ownership decision needed to fix it. If the guide is internally consistent and the only question is a still-undecided policy, withhold the affected recommendation instead of inventing a rule.

**Example: a justified safeguard.** For a proposed retry queue, distinguish best-effort notifications from a commitment to deliver after restart. Inspect the promise and the actual path. A smaller in-memory sender can be the right recommendation for the first case and an unacceptable loss of behavior for the second.
