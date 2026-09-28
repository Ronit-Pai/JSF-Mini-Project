# Collaborative Whiteboard

A room-based realtime whiteboard built with **Next.js, React, Spring Boot, and MongoDB**. Participants share a room ID, draw together, and reload previously saved drawings.

This README describes the locally integrated version in this directory. The frontend uses the bundled backend rather than the original hosted Heroku API.

> **Local development only:** the frontend has legacy dependencies with known security vulnerabilities. Keep the app on localhost until dependencies and deployment security have been reviewed. Shared undo is not implemented by the backend.

## Contents

- [Architecture and features](#architecture-and-features)
- [Quick start on the configured machine](#quick-start-on-the-configured-machine)
- [Requirements and installed versions](#requirements-and-installed-versions)
- [First-time installation on Linux](#first-time-installation-on-linux)
- [Configuration](#configuration)
- [Running services separately](#running-services-separately)
- [Using the whiteboard](#using-the-whiteboard)
- [Development and rebuilds](#development-and-rebuilds)
- [Testing and verification](#testing-and-verification)
- [API reference](#api-reference)
- [Database, logs, and backups](#database-logs-and-backups)
- [Docker alternative](#docker-alternative)
- [Troubleshooting](#troubleshooting)
- [Limitations and deployment precautions](#limitations-and-deployment-precautions)

## Architecture and features

```text
Browser: Next.js / React / HTML canvas
  |-- REST: create a room, look up a room, fetch saved drawings
  `-- SockJS + STOMP: send drawing operations, clear events, and presence
           |
           v
Spring Boot: validation, room services, WebSocket message broker
           |
           v
MongoDB: rooms and drawing_operations collections
```

**STOMP** is the messaging protocol used over the socket connection. **SockJS** supplies the browser transport. The backend persists drawing operations and broadcasts them to subscribers in the corresponding room.

Supported behavior:

- Create rooms and join by room ID.
- See a room-scoped participant count and join/leave notifications.
- Draw with a pencil, change colour/thickness, and erase.
- Pan and zoom without changing other participants' viewports.
- Reload saved drawings from MongoDB.
- Export a board to a file and import drawings into the shared board.
- Clear the board for all participants after confirmation.
- Switch rooms and retry a failed realtime connection.
- Draw with a mouse or touch input.

### Project structure

```text
Jsf/
├── README.md                         # Full setup guide
├── LOCAL_SETUP.md                    # Short machine-specific reference
├── BACKEND_SETUP_DEPLOYMENT_TESTING.md
├── run-local.sh                      # Starts and supervises all three services
├── stop-local.sh                     # Stops the local launcher and its services
├── frontend/
│   ├── components/                   # Canvas, toolbars, room forms
│   ├── pages/                        # Home and /room/[rid] routes
│   ├── styles/                       # Sass styles
│   ├── utils/                        # API helpers and drawing conversion
│   ├── tests/                        # Drawing-operation unit tests
│   └── package-lock.json             # npm dependency lockfile
├── server/
│   ├── mvnw                          # Maven wrapper for Linux/macOS
│   ├── mvnw.cmd                      # Maven wrapper for Windows
│   ├── pom.xml                       # Spring Boot dependencies
│   ├── src/main/                     # Backend application
│   ├── src/test/                     # Backend unit tests
│   ├── .env.example                  # Configuration reference, not auto-loaded
│   ├── Dockerfile
│   └── docker-compose.yaml
└── .local/                           # Generated, ignored local data
    ├── mongodb/                      # Persistent database files
    ├── logs/                         # Service logs
    └── run.pid                       # Exists while run-local.sh is active
```

## Quick start on the configured machine

The project is at **`/home/ronitpai/jsf/Jsf`**. Linux paths are case-sensitive: `Jsf` and `JSF` are different names.

The necessary runtimes and dependencies have already been installed on this machine. Start from any terminal, including Fish:

```sh
cd /home/ronitpai/jsf/Jsf
bash run-local.sh
```

Wait for the launcher to print the URLs, then open **http://localhost:3000**.

| Service | Local address |
| --- | --- |
| Whiteboard frontend | http://localhost:3000 |
| Spring Boot backend | http://localhost:8080 |
| Backend health | http://localhost:8080/actuator/health |
| MongoDB | mongodb://127.0.0.1:27017/collabcanvas |

All three services bind to the local machine in launcher mode. Use `localhost` consistently in the browser.

### Stop or restart

Press **Ctrl+C** in the launcher terminal, or run this from another terminal:

```sh
cd /home/ronitpai/jsf/Jsf
bash stop-local.sh
```

The stop script requests shutdown; allow the processes to exit before starting again. To restart, run `bash run-local.sh` after shutdown completes.

Check listening ports if necessary:

```sh
ss -ltnp | grep -E ':(3000|8080|27017)\b'
```

After shutdown, no project listeners should appear. The database files are retained.

### What the launcher does

1. Selects the user-local Node.js and Java runtimes and finds `mongod`.
2. Installs frontend dependencies if `frontend/node_modules/` is missing.
3. Builds the backend if its executable JAR is missing.
4. Checks that ports `3000`, `8080`, and `27017` are available.
5. Starts MongoDB, the packaged backend, and the Next.js development server.
6. Checks backend health and frontend HTTP availability.
7. Stops its child services when the launcher is stopped or a service exits.

The launcher does **not** install missing runtimes, automatically rebuild an existing backend JAR, or configure an operating-system service. Keep its terminal open while using the app. `stop-local.sh` controls instances started by this launcher, not separately started services.

## Requirements and installed versions

| Component | Version used in the verified local setup | Purpose |
| --- | --- | --- |
| Node.js | 22.23.3 | Frontend runtime and npm |
| Java JDK | Eclipse Temurin 17.0.20.1 | Compile and run Spring Boot |
| MongoDB | 7.0.16 | Persist rooms and drawings |
| Next.js | 11.x | Frontend framework |
| React | 17.0.2 | UI components |
| Spring Boot | 3.3.5 | Backend framework |
| Maven | 3.6.3 through the project wrapper | Backend dependency management/build |
| Bash, Python 3, curl | Available locally | Launcher and health/port checks |

The local launcher targets Linux. The configured machine runs CachyOS, an Arch-based distribution. Native Windows/macOS startup is not covered by these scripts; use a suitable Linux environment or adapt the manual service commands.

Installed runtime directory:

```text
~/.local/share/jsf-runtimes/
├── node -> node-v22.23.3-linux-x64
├── node-v22.23.3-linux-x64/
├── jdk-17.0.20.1+1/
└── mongodb-linux-x86_64-ubuntu2204-7.0.16/
```

These installations do not replace system Java or edit shell startup files. Maven downloads are cached under `~/.m2/`. Frontend packages are in `frontend/node_modules/`.

**Compatibility notes:**

- Use **Java 17** for this project rather than the machine's system Java 26.
- Next.js 11 needs `NODE_OPTIONS=--openssl-legacy-provider` on Node 22. The launcher sets this automatically.
- Install npm dependencies with `--legacy-peer-deps` because this frontend uses older React/UI packages.
- Use the npm lockfile consistently; avoid alternating npm and Yarn installations.
- Docker is optional and was not used for the verified local setup.

## First-time installation on Linux

Skip this section on the already configured machine unless recovering a missing installation.

The following commands recreate the tested **Linux x86-64** runtime layout without administrator access. They are not universal binary packages: the selected MongoDB archive needs a compatible glibc-based system, OpenSSL 3 libraries, and a supported CPU with AVX. For another architecture or operating system, choose matching binaries from the vendors instead.

These are **Bash commands**. If your interactive shell is Fish, enter `bash` first and run the commands in that shell. Change `PROJECT_ROOT` if the project lives elsewhere.

### 1. Choose directories

```bash
PROJECT_ROOT="/home/ronitpai/jsf/Jsf"
RUNTIMES="$HOME/.local/share/jsf-runtimes"
DOWNLOADS="$HOME/.cache/jsf-downloads"
mkdir -p "$RUNTIMES" "$DOWNLOADS"
```

You need `curl`, `tar` with gzip/xz support, `sha256sum`, Python 3, and Bash. The first installation also needs Internet access to download runtimes and npm/Maven dependencies.

### 2. Install Node.js 22

```bash
NODE_VERSION="22.23.3"
NODE_ARCHIVE="node-v${NODE_VERSION}-linux-x64.tar.xz"
cd "$DOWNLOADS"
curl -fLO "https://nodejs.org/dist/v${NODE_VERSION}/${NODE_ARCHIVE}"
curl -fL "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt" -o node-SHASUMS256.txt
grep " ${NODE_ARCHIVE}$" node-SHASUMS256.txt | sha256sum -c -
```

Continue only if the checksum check reports `OK`:

```bash
tar -xJf "$DOWNLOADS/$NODE_ARCHIVE" -C "$RUNTIMES"
ln -s "$RUNTIMES/node-v${NODE_VERSION}-linux-x64" "$RUNTIMES/node"
```

The symlink command assumes a first-time installation. If `node` already exists, inspect it rather than overwriting an unrelated installation.

### 3. Install Java 17

Download the current Temurin Java 17 JDK for Linux x86-64:

```bash
curl -fL --retry 2 \
  'https://api.adoptium.net/v3/binary/latest/17/ga/linux/x64/jdk/hotspot/normal/eclipse' \
  -o "$DOWNLOADS/jdk17.tar.gz"
tar -xzf "$DOWNLOADS/jdk17.tar.gz" -C "$RUNTIMES"
```

This URL resolves to the latest Java 17 patch release, so the extracted `jdk-17*` directory may differ from the version listed above. Verify vendor checksums/signatures when independently provisioning a machine.

### 4. Install MongoDB 7

This reproduces the archive used for local verification:

```bash
MONGODB_VERSION="7.0.16"
MONGODB_ARCHIVE="mongodb-linux-x86_64-ubuntu2204-${MONGODB_VERSION}.tgz"
curl -fL --retry 2 "https://fastdl.mongodb.org/linux/${MONGODB_ARCHIVE}" \
  -o "$DOWNLOADS/$MONGODB_ARCHIVE"
tar -xzf "$DOWNLOADS/$MONGODB_ARCHIVE" -C "$RUNTIMES"
```

The version above is a reproducibility reference, not a recommendation for a new public deployment. Review current MongoDB 7 security releases and select a supported OS-specific archive when updating. The launcher discovers `mongod` below the runtime directory.

### 5. Select runtimes and install project dependencies

```bash
export JAVA_HOME="$(find "$RUNTIMES" -maxdepth 1 -type d -name 'jdk-17*' -print -quit)"
export PATH="$RUNTIMES/node/bin:$JAVA_HOME/bin:$PATH"
MONGOD="$(find "$RUNTIMES" -path '*/bin/mongod' -print -quit)"

node --version
npm --version
java -version
"$MONGOD" --version

cd "$PROJECT_ROOT/frontend"
npm ci --legacy-peer-deps

cd "$PROJECT_ROOT/server"
bash mvnw package
```

The Maven wrapper downloads Maven and backend dependencies automatically. A separate global Maven installation is unnecessary. `package` runs the backend unit tests and creates:

```text
server/target/whiteboard-0.0.1-SNAPSHOT.jar
```

If there are several Java 17 installations, set `JAVA_HOME` explicitly to the intended one instead of relying on the first directory found.

### 6. Start the app

```bash
cd "$PROJECT_ROOT"
bash run-local.sh
```

## Configuration

### Launcher mode versus manual mode

`run-local.sh` supplies fixed local settings for the backend URL, database, allowed browser origins, addresses, and ports. Exporting a different `MONGODB_URI`, `PORT`, or `NEXT_PUBLIC_API_BASE_URL` before running that script will **not** override the values it sets.

Use [manual service startup](#running-services-separately) for different ports or an external database. `JSF_RUNTIMES` can point the launcher at another runtime directory, and an existing `JAVA_HOME` is respected; ensure it points to Java 17.

| Variable | Purpose | Launcher value |
| --- | --- | --- |
| `JSF_RUNTIMES` | Directory containing local runtimes | `~/.local/share/jsf-runtimes` by default |
| `JAVA_HOME` | JDK used for the backend | Existing value or discovered `jdk-17*` directory |
| `MONGODB_URI` | Backend database connection | `mongodb://127.0.0.1:27017/collabcanvas` |
| `CORS_ALLOWED_ORIGINS` | Browser origins allowed for REST and WebSocket access | `http://localhost:3000,http://127.0.0.1:3000` |
| `PORT` | Backend HTTP port | `8080` |
| `SERVER_ADDRESS` | Backend bind address | `127.0.0.1` |
| `NEXT_PUBLIC_API_BASE_URL` | API URL embedded in frontend browser code | `http://localhost:8080` |
| `NODE_OPTIONS` | Node.js compatibility option | Adds `--openssl-legacy-provider` for the frontend |
| `NEXT_TELEMETRY_DISABLED` | Disables Next.js telemetry | `1` |
| `WEBSOCKET_MAX_PAYLOAD_BYTES` | Backend socket message-size limit | Not set by launcher; backend defaults to `65536` |

**CORS** means Cross-Origin Resource Sharing. The frontend and backend use different ports, so the backend must permit the exact browser origin. An origin contains the scheme, hostname, and port, without a route path.

`server/.env.example` documents configuration names. The shell launcher and Spring Boot application do **not** automatically load it or an arbitrary `server/.env` file. Export variables in the backend shell or configure them through your process/container environment.

For a manually started frontend, Next.js can load `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Restart the frontend after changing its environment. Variables prefixed `NEXT_PUBLIC_` are visible in browser code; never store database credentials or other secrets in them.

## Running services separately

Use three Bash terminals. In each, select the runtime environment as needed:

```bash
PROJECT_ROOT="/home/ronitpai/jsf/Jsf"
RUNTIMES="$HOME/.local/share/jsf-runtimes"
export JAVA_HOME="$(find "$RUNTIMES" -maxdepth 1 -type d -name 'jdk-17*' -print -quit)"
export PATH="$RUNTIMES/node/bin:$JAVA_HOME/bin:$PATH"
cd "$PROJECT_ROOT"
```

### Terminal 1: MongoDB

```bash
MONGOD="$(find "$RUNTIMES" -path '*/bin/mongod' -print -quit)"
mkdir -p .local/mongodb .local/logs
"$MONGOD" --dbpath "$PROJECT_ROOT/.local/mongodb" \
  --bind_ip 127.0.0.1 --port 27017 \
  --logpath "$PROJECT_ROOT/.local/logs/mongodb.log" --logappend
```

### Terminal 2: Spring Boot

```bash
export MONGODB_URI="mongodb://127.0.0.1:27017/collabcanvas"
export CORS_ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
export SERVER_ADDRESS=127.0.0.1
export PORT=8080
cd "$PROJECT_ROOT/server"
bash mvnw spring-boot:run
```

### Terminal 3: Next.js

```bash
export NEXT_PUBLIC_API_BASE_URL="http://localhost:8080"
export NODE_OPTIONS=--openssl-legacy-provider
export NEXT_TELEMETRY_DISABLED=1
cd "$PROJECT_ROOT/frontend"
npm run dev -- -H 127.0.0.1 -p 3000
```

Use Ctrl+C in each terminal to stop manually launched processes. Avoid running these alongside `run-local.sh`: they compete for the same ports and database directory.

## Using the whiteboard

1. Open http://localhost:3000.
2. Choose **Create a Room**, enter a username and room name, and select **Create Room**.
3. Dismiss the controls panel.
4. Copy the room ID using **🔗 Copy ID** or take it from the `/room/<ID>` URL.
5. Open another browser tab or window, select **Join Existing Room**, and enter a username and that ID.
6. Draw in either tab and confirm that the other updates.

Room names are limited to 100 characters. The browser requires a username of 1–80 characters. Room IDs are normalized to uppercase; joining with a lowercase ID is supported.

| Action | Control |
| --- | --- |
| Draw | Left-click and drag, or single-finger touch |
| Move your view | Right-click and drag |
| Zoom | Mouse wheel |
| Change colour | Colour bar |
| Pencil, eraser, thickness | Drawing tools menu, opened with the book icon |
| Export drawings | **💾 Save Canvas**; downloads `canvas.txt` containing JSON |
| Import drawings | **📤 Import Canvas**; appends valid drawings to the shared board |
| Copy room ID | **🔗 Copy ID** |
| Switch rooms | **🚪 Change Room** |
| Change theme | **💡 Change Theme** |
| Clear for everyone | **🗑️ Clear Board for Everyone**, then confirm |
| Recover a dropped connection | **Retry connection** in the error panel |

Clearing deletes saved operations in the current room. It is not undoable. Importing broadcasts new operations; it is not a private local preview. A downloaded canvas file is a drawing export, not a full database backup.

## Development and rebuilds

Select Java 17 and Node 22 using the environment commands above before running build commands outside the launcher.

### Frontend edits

The development server reloads frontend source changes automatically. Restart it for environment changes.

To reinstall the locked frontend dependencies:

```bash
cd /home/ronitpai/jsf/Jsf/frontend
npm ci --legacy-peer-deps
```

### Backend edits

The launcher runs a packaged JAR. After changing backend source, stop the app, rebuild, and start again:

```bash
cd /home/ronitpai/jsf/Jsf
bash stop-local.sh
# Wait for the existing services to finish shutting down.
cd server
bash mvnw clean package
cd ..
bash run-local.sh
```

An existing JAR is not rebuilt automatically by `run-local.sh`. In manual development mode, stop and rerun `bash mvnw spring-boot:run` to compile updated source; automatic backend hot reload is not configured.

### Production-style frontend build

The package includes standard Next.js build/start commands:

```bash
cd /home/ronitpai/jsf/Jsf/frontend
export NODE_OPTIONS=--openssl-legacy-provider
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
npm run build
npm run start -- -H 127.0.0.1 -p 3000
```

Stop the frontend development server before using these commands. The backend and MongoDB must be started separately. **Verification so far used development mode, not this production-build flow.** A successful build would not by itself make the legacy application safe for public deployment.

## Testing and verification

### Unit tests

With the runtime environment selected:

```bash
cd /home/ronitpai/jsf/Jsf/server
bash mvnw test

cd ../frontend
node --test tests/boardOperations.test.cjs
```

The previous local setup verification passed **4 backend tests** and **6 frontend tests**. These are unit tests, not a substitute for checking real MongoDB and browser interactions.

### Health checks while the app is running

```sh
curl -fsS http://localhost:8080/actuator/health
curl -I http://localhost:3000
```

The backend health response should contain `"status":"UP"`; the frontend should return HTTP 200.

### Manual browser checklist

- Create a room and join it in a second tab.
- Draw, change tools, and erase; check both tabs.
- Refresh and confirm drawings are restored.
- Create a different room and confirm its board remains independent.
- Export a board and import the file; confirm the other participant sees it.
- Clear the board, refresh, and confirm it stays empty.
- Switch rooms and check the board and participant counts.
- Close a participant tab and check presence updates.
- Try a nonexistent room and confirm an understandable error.
- Check desktop and narrow mobile viewports, including touch drawing.
- Pan/zoom, draw again, and confirm coordinates are correct for another participant.
- Restart the backend and MongoDB, retry the browser connection, and confirm persistence.

These flows were exercised during local setup using Google Chrome and Playwright, a browser automation library. That verification included a full service restart and recovery of saved drawings.

### Machine-local verification scripts

Additional test scripts and screenshots remain under ignored `.local/`, not in the portable application source. They use Playwright at `~/.cache/jsf-browser/node_modules/` and Chrome at `/opt/google/chrome/chrome`.

From the project root, while the app is running:

```bash
python3 .local/api-smoke.py
node .local/browser-smoke.cjs
node .local/viewport-smoke.cjs
```

These scripts create test rooms and drawing data. They may not exist in a fresh checkout or archive.

**`.local/recovery-smoke.cjs` is disruptive:** it invokes `stop-local.sh` and waits for an external restart. It is not an unattended test runner and should not be run while other users are working. The original setup session coordinated its restart separately.

## API reference

The canonical REST prefix is **`/api/rooms`**, not the older `/api/v1/rooms`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/rooms` | Create a room |
| `GET` | `/api/rooms/{roomId}` | Fetch room metadata |
| `GET` | `/api/rooms/{roomId}/drawings` | Fetch persisted operations in timestamp order |
| `POST` | `/api/rooms/{roomId}/drawings` | Persist a drawing operation |
| `DELETE` | `/api/rooms/{roomId}/drawings` | Delete persisted operations |
| `GET` | `/actuator/health` | Backend/database health |

Example room creation:

```sh
curl -i -X POST http://localhost:8080/api/rooms \
  -H 'Content-Type: application/json' \
  -d '{"roomName":"Local workshop","displayName":"Alice"}'
```

Expect HTTP 201 and a response containing an eight-character `roomId`. Use that returned value in subsequent requests or the join form.

A drawing payload uses this shape:

```json
{
  "sessionId": "example-session",
  "tool": "pencil",
  "points": [{ "x": 100.5, "y": 120 }, { "x": 180, "y": 160.25 }],
  "colour": "#ffffff",
  "width": 3
}
```

Tools are `pencil` or `eraser`; colour must be a six-digit hex value; width is an integer from 1 to 100; each operation has 1–5,000 points. The backend accepts an optional `operationId` and generates one if omitted. The browser supplies unique operation IDs to recognize server echoes.

### Realtime destinations

Connect a SockJS client to **`http://localhost:8080/ws`**, then use STOMP:

| Action | Publish destination | Subscription |
| --- | --- | --- |
| Draw | `/app/rooms/{roomId}/draw` | `/topic/rooms/{roomId}/drawings` |
| Clear | `/app/rooms/{roomId}/clear` | `/topic/rooms/{roomId}/drawings` |
| Join presence | `/app/rooms/{roomId}/presence/join` | `/topic/rooms/{roomId}/presence` |
| Leave presence | `/app/rooms/{roomId}/presence/leave` | `/topic/rooms/{roomId}/presence` |

Presence payloads contain `displayName`; clear payloads contain `sessionId`. The frontend subscribes before sending presence/drawing messages and fetches history on connection.

**REST drawing writes do not broadcast to connected browsers.** Use the STOMP draw/clear destinations for collaborative changes. The application already does this; do not add a duplicate REST save for every socket drawing event.

For more backend details, see [BACKEND_SETUP_DEPLOYMENT_TESTING.md](BACKEND_SETUP_DEPLOYMENT_TESTING.md).

## Database, logs, and backups

### Persistent storage

- Database name: `collabcanvas`.
- Collections: `rooms` and `drawing_operations`.
- Local MongoDB data directory: `.local/mongodb/`.
- Presence is held in backend memory; users reconnect after a backend restart.

Stopping services, rebuilding Java, or reinstalling npm dependencies does not remove MongoDB data. The setup's test rooms may still exist.

### Logs

```text
.local/logs/frontend.log
.local/logs/backend.log
.local/logs/mongodb.log
```

For example:

```sh
tail -n 100 .local/logs/backend.log
tail -f .local/logs/frontend.log
```

The launcher overwrites frontend/backend logs on a new start and appends to the MongoDB log. Save logs elsewhere first if you need previous startup diagnostics.

### Offline local backup

For a simple backup on this machine:

1. Run `bash stop-local.sh`.
2. Confirm all three ports are closed.
3. Copy/archive `.local/mongodb/` only after MongoDB has fully stopped.

For example, after confirming shutdown:

```bash
mkdir -p "$HOME/jsf-backups"
tar -czf "$HOME/jsf-backups/mongodb-$(date +%Y%m%d-%H%M%S).tar.gz" -C .local mongodb
```

A raw data-directory backup is intended for a compatible MongoDB installation. For portable backups, use MongoDB Database Tools such as `mongodump`/`mongorestore`; those tools are not included in this setup.

To start with an empty local database, stop everything and move `.local/mongodb/` to a backup location before starting again. This creates a fresh database without immediately destroying the old files. Never point two MongoDB processes at the same data directory.

## Docker alternative

`server/docker-compose.yaml` describes **MongoDB and the backend only**. It does not start the Next.js frontend. The verified local setup uses native user-local runtimes because this account lacked permission to access the Docker daemon.

Before using Compose:

1. Confirm that Docker is running and your account is authorized to use it.
2. Stop the native launcher to free ports 8080 and 27017.
3. Review the Compose port bindings: the supplied file publishes on all host interfaces. For local-only use, change them to `127.0.0.1:27017:27017` and `127.0.0.1:8080:8080` respectively before starting.

Then, from the project root:

```sh
docker compose -f server/docker-compose.yaml up --build
```

Start the frontend separately using the manual frontend commands. The Compose configuration allows the browser origin `http://localhost:3000`.

To stop the containers:

```sh
docker compose -f server/docker-compose.yaml down
```

The named Docker volume is separate from `.local/mongodb/`; these modes do not automatically share data. `down` preserves the volume by default. Adding `--volumes` would delete its database data.

The Dockerfile skips tests during packaging. Run tests separately before relying on its image. **Container startup has not been verified on this machine.**

## Troubleshooting

| Symptom | Check or resolution |
| --- | --- |
| `node`, `npm`, or `mvn` not found | Use `run-local.sh`, or select the runtime `PATH` before manual commands. Use `bash mvnw` instead of expecting global Maven. |
| Java compilation/Lombok errors under system Java | Set `JAVA_HOME` to the installed Java 17 JDK and put its `bin` first in `PATH`. |
| `ERR_OSSL_EVP_UNSUPPORTED` | Set `NODE_OPTIONS=--openssl-legacy-provider` when running Next.js 11 with Node 22. The launcher already does this. |
| npm dependency-resolution errors | Use `npm ci --legacy-peer-deps` with the existing lockfile. Avoid an unreviewed `npm audit fix --force`. |
| `Port ... is already in use` | Inspect with `ss -ltnp`; stop the identified service. Do not kill unrelated applications blindly. |
| `Missing local runtimes` | Check the directory layout and `node` symlink, or follow first-time installation. `JSF_RUNTIMES` changes the search directory. |
| `mvnw: Permission denied` | Run `bash mvnw ...`, or restore execute permission with `chmod +x server/mvnw` from the project root. |
| Maven wrapper reports `$'\r'` or syntax errors | A Windows extraction may have restored CRLF line endings. Convert `server/mvnw` to LF; the configured copy already uses LF. |
| MongoDB fails with a missing shared library or illegal instruction | Use a binary compatible with your OS, OpenSSL libraries, architecture, and CPU; inspect `mongodb.log`. |
| MongoDB reports a locked data directory | Check whether another `mongod` owns it. Stop that process cleanly; avoid deleting lock/data files as a first step. |
| Backend cannot connect to MongoDB | Check port 27017, database logs, and `MONGODB_URI`. A container's `localhost` is not the host or another container. |
| Room creation fails or CORS errors appear | Check backend health, the frontend API URL, and the exact allowed browser origin. Restart Next.js after changing environment variables. |
| Drawing works locally but not in the second tab | Verify both tabs use the same room, the socket endpoint is `/ws`, and the API/transport are not still targeting the original hosted service. |
| Retry connection appears | Restore backend/database availability, then select Retry. Unconfirmed changes may not have been saved. |
| Backend source edits have no effect | Rebuild the JAR; the launcher only builds it when missing. |
| Stop script says no PID file exists | The launcher may already be stopped, or services were launched manually. Inspect listeners and stop them in their owning terminals. |
| Browser form or controls look stale | Refresh after frontend recompilation; inspect `frontend.log` for errors. |
| Docker permission denied | Configure authorized Docker access with your system administrator or use the native setup. The native launcher needs no Docker access. |

For startup failures, inspect `.local/logs/` before changing configuration. Avoid sharing logs or environment files containing credentials.

## Limitations and deployment precautions

- **Undo:** the backend has no shared undo endpoint. The control explains this rather than silently changing only one participant's board.
- **Recovery:** retry reloads saved operations; unconfirmed operations are not automatically resent.
- **Limits:** the 5,000-point validation limit and the default 64 KiB WebSocket message limit both apply. A large imported operation may exceed the byte limit even when its point count is valid.
- **Scale:** large boards, many simultaneous participants, and simultaneous clear/draw operations have not been load-tested.
- **Access control:** a room ID is not authentication or authorization. Treat room access as shared access, not private storage.
- **Security:** the initial npm audit reported 37 vulnerabilities, including 13 critical and 18 high. Counts are a setup-time snapshot, not a current security guarantee. Run `npm audit` to reassess and plan compatible upgrades before deployment.
- **Deployment:** use maintained dependency versions, authenticated database access, narrowly scoped allowed origins, HTTPS/WSS, secret management, backups, and appropriate access controls. The local MongoDB instance is unauthenticated and intentionally bound to loopback.

The original project advertised [a hosted demo](https://collaborative-whiteboard.vercel.app/). That external deployment was not verified and may differ from this local version.
