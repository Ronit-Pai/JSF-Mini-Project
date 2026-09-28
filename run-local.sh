#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIMES="${JSF_RUNTIMES:-$HOME/.local/share/jsf-runtimes}"
export JAVA_HOME="${JAVA_HOME:-$(find "$RUNTIMES" -maxdepth 1 -type d -name 'jdk-17*' -print -quit)}"
export PATH="$RUNTIMES/node/bin:$JAVA_HOME/bin:$PATH"
MONGOD="$(find "$RUNTIMES" -path '*/bin/mongod' -print -quit)"
export MONGODB_URI="mongodb://127.0.0.1:27017/collabcanvas"
export CORS_ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
export NEXT_PUBLIC_API_BASE_URL="http://localhost:8080"
export NEXT_TELEMETRY_DISABLED=1
export PORT=8080
export SERVER_ADDRESS=127.0.0.1

if [[ ! -x "$JAVA_HOME/bin/java" || ! -x "$MONGOD" ]] || ! command -v node >/dev/null; then
    printf 'Missing local runtimes. See LOCAL_SETUP.md.\n' >&2
    exit 1
fi
if [[ ! -d "$ROOT/frontend/node_modules" ]]; then
    (cd "$ROOT/frontend" && npm ci --legacy-peer-deps)
fi
if [[ ! -f "$ROOT/server/target/whiteboard-0.0.1-SNAPSHOT.jar" ]]; then
    (cd "$ROOT/server" && bash mvnw package)
fi

python3 - <<'PY'
import socket
for port in (27017, 8080, 3000):
    with socket.socket() as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind(('127.0.0.1', port))
        except OSError:
            raise SystemExit(f'Port {port} is already in use. Stop the existing service before starting another copy.')
PY

mkdir -p "$ROOT/.local/mongodb" "$ROOT/.local/logs"
pids=()
cleanup() {
    trap - EXIT INT TERM
    for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done
    for pid in "${pids[@]}"; do wait "$pid" 2>/dev/null || true; done
    rm -f "$ROOT/.local/run.pid"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
printf '%s\n' "$$" > "$ROOT/.local/run.pid"

"$MONGOD" --dbpath "$ROOT/.local/mongodb" --bind_ip 127.0.0.1 --port 27017 \
    --logpath "$ROOT/.local/logs/mongodb.log" --logappend &
pids+=("$!")
"$JAVA_HOME/bin/java" -jar "$ROOT/server/target/whiteboard-0.0.1-SNAPSHOT.jar" \
    >"$ROOT/.local/logs/backend.log" 2>&1 &
pids+=("$!")
(
    cd "$ROOT/frontend"
    # Next.js 11 uses Webpack hashing that needs the legacy OpenSSL provider on Node 22.
    export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--openssl-legacy-provider"
    exec node node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3000
) >"$ROOT/.local/logs/frontend.log" 2>&1 &
pids+=("$!")

ready=false
for ((attempt=0; attempt<90; attempt++)); do
    for pid in "${pids[@]}"; do
        if ! kill -0 "$pid" 2>/dev/null; then
            printf 'A service exited. Check %s/.local/logs.\n' "$ROOT" >&2
            exit 1
        fi
    done
    if curl -fsS http://localhost:8080/actuator/health >/dev/null 2>&1 && \
       curl -fsS http://localhost:3000 >/dev/null 2>&1; then
        ready=true
        break
    fi
    sleep 1
 done
if [[ "$ready" != true ]]; then
    printf 'Startup timed out. Check %s/.local/logs.\n' "$ROOT" >&2
    exit 1
fi
printf 'Whiteboard: http://localhost:3000\nBackend: http://localhost:8080\nLogs: %s/.local/logs\nPress Ctrl+C to stop all three services.\n' "$ROOT"
wait -n "${pids[@]}"
