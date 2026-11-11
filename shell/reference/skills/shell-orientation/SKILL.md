---
name: shell-orientation
description: Inspect the installed agent shell, explain its three access modes and locate its own private state without reading account secrets.
---
# Shell orientation

The current app is a full PiG agent. Check the native model tools, `/bro`, `/external` and `/comms` commands as actually loaded. Separate local extension availability from external CLI account access. Never print credentials, tokens or unrelated private sessions. For other agents, use the installed peer-messaging rules; no auto-consent.
