#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -f "$ROOT/.local/run.pid" ]]; then
    printf 'No local launcher PID file found.\n'
    exit 0
fi
read -r pid < "$ROOT/.local/run.pid"
if [[ ! "$pid" =~ ^[0-9]+$ ]] || [[ ! -r "/proc/$pid/cmdline" ]] || \
   ! grep -azq 'run-local.sh' "/proc/$pid/cmdline"; then
    printf 'The recorded launcher is no longer running.\n' >&2
    exit 1
fi
kill -TERM "$pid"
printf 'Shutdown requested for the whiteboard, backend, and MongoDB.\n'
