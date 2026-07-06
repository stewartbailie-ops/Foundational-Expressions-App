---
name: shell pkill/pgrep self-match
description: Why kill commands in the bash tool exit 143 / kill their own shell, and how to avoid it.
---

# pkill/pgrep self-match kills the shell (exit 143)

`pkill -f <pattern>` / `pgrep -f <pattern>` match against the **full command line**, which includes the bash process the tool is running. If `<pattern>` (or any token in the same command) appears in that command line, pkill kills its own shell → the tool call ends with exit code 143 (SIGTERM) and no useful output.

Examples that self-killed: `pkill -f build_promo.mjs` (the `-c` bash line contained `build_promo.mjs`), and `for p in $(pgrep -f 'ffmpeg.*promo'); do kill $p; done` (the command line itself contained `ffmpeg` and `promo`).

**How to apply:**
- Kill background helpers by **exact process name**: `pkill -x ffmpeg`, `pkill -x node` (the shell is `bash`, so it won't self-match).
- Or kill by specific PID captured at launch (`echo $!`) in a command line that does NOT also reference the pattern.
- Don't run a `pkill -x <name>` and then launch a new process of `<name>` expecting both to coexist — sequence them so cleanup finishes first.

**Why:** cost several wasted turns chasing phantom "hangs" that were really the shell terminating itself before the real work ran.
