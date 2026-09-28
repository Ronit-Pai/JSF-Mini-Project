# Collaborative Whiteboard

A room-based realtime whiteboard built with **Next.js, React, Spring Boot, and MongoDB**. Create a room, share its ID, and draw together across browser sessions. Drawing operations are saved in MongoDB and restored when participants reconnect.


## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Local launcher for Linux](#local-launcher-for-linux)
- [Configuration](#configuration)
- [Using the whiteboard](#using-the-whiteboard)
- [Development](#development)
- [Testing](#testing)
- [API reference](#api-reference)
- [Storage and backups](#storage-and-backups)
- [Docker alternative](#docker-alternative)
- [Troubleshooting](#troubleshooting)
- [Limitations and deployment](#limitations-and-deployment)

## Features

- Create rooms and join existing rooms using a shared ID.
- Draw with a pencil, change colour and thickness, and erase.
- Synchronize drawings and participant presence within each room.
- Restore saved drawings after a page reload or reconnection.
- Pan and zoom independently of other participants.
- Export drawings to a file and import them into a shared board.
- Clear a board for all participants after confirmation.
- Switch rooms and retry interrupted connections.
- Use mouse or touch input with responsive controls.

## Architecture

```text
Browser: Next.js / React / HTML canvas
  |-- REST: room creation, metadata, saved drawing history
  `-- SockJS + STOMP: drawing events, clearing, presence
           |
           v
Spring Boot: validation, room services, messaging
           |
           v
MongoDB: rooms and drawing_operations collections
```

**STOMP** is the messaging protocol used for realtime events. **SockJS** provides the browser transport. The backend persists drawing operations and broadcasts them to subscribers in the same room.

### Project structure

```text
.
├── README.md
├── BACKEND_SETUP_DEPLOYMENT_TESTING.md
├── run-local.sh                      # Linux launcher for all three services
├── stop-local.sh                     # Stops services owned by the launcher
├── frontend/
│   ├── components/                   # Canvas, toolbars, and room forms
│   ├── pages/                        # Home and /room/[rid] routes
│   ├── styles/                       # Sass styles
│   ├── utils/                        # API helpers and drawing operations
│   ├── tests/                        # Drawing-operation tests
│   ├── package.json
│   └── package-lock.json
├── server/
│   ├── mvnw                          # Maven wrapper for Unix-like shells
│   ├── mvnw.cmd                      # Maven wrapper for Windows
│   ├── pom.xml
│   ├── src/main/                     # Spring Boot application
│   ├── src/test/                     # Backend tests
│   ├── .env.example                  # Configuration reference
│   ├── Dockerfile
│   └── docker-compose.yaml
└── .local/                           # Generated locally; excluded from Git
    ├── mongodb/                      # Data for a manually started local database
    └── logs/                         # Service logs
```

## Requirements

Install the following tools before starting:

| Tool | Version | Purpose |
| --- | --- | --- |
| Node.js and npm | Node.js 22.x | Frontend development and dependencies |
| Java Development Kit | JDK 17 | Build and run the backend |
| MongoDB Community Server | 7.x | Persist rooms and drawings |
| Git | A current version | Clone and manage the source |
| Bash | Required for the shell examples | Run setup commands and scripts |
| Python 3 and curl | Required by `run-local.sh` | Port and health checks |
| Docker with Compose | Optional | Run the backend and database in containers |

The application uses **Next.js 11.x**, **React 17.0.2**, and **Spring Boot 3.3.5**. The project includes a Maven wrapper, so a global Maven installation is unnecessary.

Official installation resources:

- [Node.js downloads](https://nodejs.org/en/download)
- [Eclipse Temurin JDK downloads](https://adoptium.net/temurin/releases/?version=17)
- [MongoDB Community installation](https://www.mongodb.com/docs/v7.0/installation/)
- [Docker installation](https://docs.docker.com/get-started/get-docker/)

Choose packages that match your operating system, CPU architecture, and vendor requirements. Use current compatible patch releases and verify downloaded archives with vendor checksums or signatures.

### Compatibility notes

- Ensure `JAVA_HOME` points to **JDK 17**, and that its `bin` directory is on `PATH`.
- Next.js 11 needs `NODE_OPTIONS=--openssl-legacy-provider` when running on Node.js 22.
- Install frontend dependencies with `npm ci --legacy-peer-deps` because the project uses older React/UI packages.
- Use `package-lock.json` consistently; avoid alternating npm and Yarn installations.
- The optional launcher scripts target **Linux**. For other platforms, use the manual service instructions with platform-appropriate commands. Windows users can use a Linux environment such as WSL or adapt the commands and use `mvnw.cmd`.

## Getting started

### 1. Obtain the source

Replace `<repository-url>` with the URL of your Git repository. The destination directory name is arbitrary:

```bash
git clone "<repository-url>" collaborative-whiteboard
cd collaborative-whiteboard
```

If you already have the source, open the directory containing `frontend/`, `server/`, and `run-local.sh` instead.

**All command blocks below start from the project root unless stated otherwise.** Open each additional terminal in that directory. Examples use Bash; if your interactive shell is Fish, enter `bash` before using Bash-specific environment syntax. Subshells such as `(cd server && ...)` keep the parent terminal at the project root.

### 2. Check your tools

```bash
node --version
npm --version
java -version
javac -version
mongod --version
```

Resolve missing tools or incorrect versions before continuing. If using a managed or containerized MongoDB instance, a local `mongod` executable is not required; configure the backend connection string instead.

### 3. Install dependencies and build the backend

```bash
(cd frontend && npm ci --legacy-peer-deps)
(cd server && bash mvnw package)
```

The Maven wrapper downloads Maven and backend dependencies. `package` runs the backend unit tests and creates:

```text
server/target/whiteboard-0.0.1-SNAPSHOT.jar
```

Initial installation requires network access to npm and Maven repositories.

### 4. Start MongoDB — terminal 1

For a standalone local database:

```bash
mkdir -p .local/mongodb .local/logs
mongod --dbpath "$PWD/.local/mongodb" \
  --bind_ip 127.0.0.1 --port 27017 \
  --logpath "$PWD/.local/logs/mongodb.log" --logappend
```

Leave the process running. Its logs are written to `.local/logs/mongodb.log`.

If MongoDB is already running as a system service or container, use that instance instead. Avoid starting another process on the same port or data directory. An existing MongoDB service may use a different storage location.

### 5. Start Spring Boot — terminal 2

```bash
export MONGODB_URI="mongodb://127.0.0.1:27017/collabcanvas"
export CORS_ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
export SERVER_ADDRESS=127.0.0.1
export PORT=8080
(cd server && bash mvnw spring-boot:run)
```

For a different database, replace `MONGODB_URI` with your connection string. Keep credentials in environment variables or a secret manager, not in committed source files.

### 6. Start Next.js — terminal 3

```bash
export NEXT_PUBLIC_API_BASE_URL="http://localhost:8080"
export NODE_OPTIONS=--openssl-legacy-provider
export NEXT_TELEMETRY_DISABLED=1
(cd frontend && npm run dev -- -H 127.0.0.1 -p 3000)
```

Open **http://localhost:3000** once the frontend is ready.

| Service | Default development address |
| --- | --- |
| Whiteboard | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Backend health | http://localhost:8080/actuator/health |
| MongoDB | mongodb://127.0.0.1:27017/collabcanvas |

### 7. Check health and stop services

From another terminal:

```bash
curl -fsS http://localhost:8080/actuator/health
curl -I http://localhost:3000
```

Expect a backend response containing `"status":"UP"` and HTTP 200 from the frontend.

Press **Ctrl+C** in each owning terminal to stop services started manually. Use your service manager or Docker commands for a database managed outside these terminals. Saved drawings remain in MongoDB after shutdown.

## Local launcher for Linux

`run-local.sh` is an alternative to starting the three processes separately. It requires a specific local runtime layout; installing tools on `PATH` alone does not satisfy all of its requirements.

### Prepare the runtime directory

By default, the launcher searches **`$HOME/.local/share/jsf-runtimes`**. Extract compatible runtime archives there, or set `JSF_RUNTIMES` to another directory with the same structure:

```text
<runtime-directory>/
├── node/                             # Node installation or symlink to it
│   └── bin/
│       ├── node
│       └── npm
├── jdk-17.../                        # Extracted JDK 17 installation
│   └── bin/java
└── mongodb-.../                      # Extracted MongoDB installation
    └── bin/mongod
```

The `...` entries illustrate version-dependent directory names; they are not literal filenames. Keep one intended MongoDB installation under this directory. The launcher selects the first matching `mongod` and, unless `JAVA_HOME` is already set, the first directory matching `jdk-17*`.

- `node/` may be a symlink to the extracted Node.js 22 installation.
- Set `JAVA_HOME` explicitly if your JDK folder uses another name or multiple JDKs are present.
- Install Bash, Python 3, and curl separately.
- Download archives suitable for your platform using the official resources in [requirements](#requirements).

### Start and stop

Once the runtime directory is prepared, run from the project root:

```bash
bash run-local.sh
```

Keep the launcher terminal open. Stop with **Ctrl+C**, or from another terminal in the project root:

```bash
bash stop-local.sh
```

Wait for shutdown to complete before starting again. On Linux, inspect listeners with:

```bash
ss -ltnp | grep -E ':(3000|8080|27017)\b'
```

### Launcher behavior

The launcher:

1. Selects local runtimes.
2. Installs frontend dependencies if `frontend/node_modules/` is missing.
3. Builds the backend if its packaged JAR is missing.
4. Checks availability of ports 3000, 8080, and 27017.
5. Starts MongoDB, the packaged backend, and the frontend development server.
6. Checks service health and writes logs under `.local/logs/`.
7. Stops its child services when it exits or a service stops.

It does **not** download missing runtimes, rebuild an existing JAR automatically, or install a system service. `stop-local.sh` controls only processes owned by this launcher, not manually launched services.

The launcher uses fixed loopback addresses, ports, database settings, and frontend API URL. It overrides exported `MONGODB_URI`, `PORT`, `SERVER_ADDRESS`, `CORS_ALLOWED_ORIGINS`, and `NEXT_PUBLIC_API_BASE_URL` values. Use manual startup for custom values.

## Configuration

| Variable | Purpose | Application default or setup guidance |
| --- | --- | --- |
| `JAVA_HOME` | JDK installation | Set to JDK 17 |
| `MONGODB_URI` | Backend database connection | `mongodb://localhost:27017/collabcanvas` |
| `PORT` | Backend HTTP port | `8080` |
| `SERVER_ADDRESS` | Backend network bind address | Set to `127.0.0.1` for local-only development |
| `CORS_ALLOWED_ORIGINS` | Allowed browser origins | `http://localhost:3000`; accepts comma-separated origins |
| `WEBSOCKET_MAX_PAYLOAD_BYTES` | Backend socket message limit | `65536` bytes |
| `NEXT_PUBLIC_API_BASE_URL` | API URL used by browser code | `http://localhost:8080` |
| `NODE_OPTIONS` | Node.js runtime flags | Set `--openssl-legacy-provider` for Next.js 11 on Node.js 22 |
| `NEXT_TELEMETRY_DISABLED` | Next.js telemetry control | Set to `1` to disable telemetry |
| `JSF_RUNTIMES` | Runtime search directory for the Linux launcher | `$HOME/.local/share/jsf-runtimes` |

**CORS** means Cross-Origin Resource Sharing. Since the frontend and backend run on different ports, the backend must allow the exact browser origin, including scheme, hostname, and port. If you change the frontend port, update `CORS_ALLOWED_ORIGINS` accordingly.

### Backend environment

`server/.env.example` lists supported settings. Spring Boot and the shell launcher do **not** automatically load that file or an arbitrary `server/.env`. Export variables in the backend shell or configure them through your service/container environment.

### Frontend environment

For manual startup, create `frontend/.env.local` if you prefer a file to exported variables:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Restart Next.js after changing its environment. Exported environment variables take precedence over values in `.env.local`.

Variables prefixed `NEXT_PUBLIC_` are included in browser code. Never put database passwords or other secrets in them. Production builds must be rebuilt when changing values embedded in the frontend bundle.

## Using the whiteboard

1. Open the frontend and choose **Create a Room**.
2. Enter a username and room name, then create the room.
3. Dismiss the controls panel and copy the room ID using **🔗 Copy ID** or the `/room/<ID>` URL.
4. In another browser tab, choose **Join Existing Room** and enter a username and that ID.
5. Draw in either tab and confirm that the other updates.

Room names are limited to 100 characters. The browser requires a username of 1–80 characters. Room IDs are normalized to uppercase; lowercase IDs are accepted when joining.

| Action | Control |
| --- | --- |
| Draw | Left-click and drag, or single-finger touch |
| Move your view | Right-click and drag |
| Zoom | Mouse wheel |
| Change colour | Colour bar |
| Select pencil, eraser, or thickness | Drawing tools menu, opened with the book icon |
| Export drawings | **💾 Save Canvas**; downloads JSON in `canvas.txt` |
| Import drawings | **📤 Import Canvas**; appends to the shared board |
| Copy room ID | **🔗 Copy ID** |
| Switch rooms | **🚪 Change Room** |
| Change theme | **💡 Change Theme** |
| Clear for everyone | **🗑️ Clear Board for Everyone**, then confirm |
| Restore a connection | **Retry connection** in the error panel |

Clearing deletes saved operations in the current room and cannot be undone. Imported drawings are shared with other participants, not shown as a private preview. A canvas export is not a complete database backup.

## Development

Run these commands from the project root with Node.js 22 and JDK 17 selected in your shell.

### Frontend

The development server reloads source changes automatically. Restart it after environment changes.

Reinstall locked dependencies:

```bash
(cd frontend && npm ci --legacy-peer-deps)
```

### Backend

For manual startup, stop the backend and rerun:

```bash
(cd server && bash mvnw spring-boot:run)
```

Automatic backend hot reload is not configured.

For launcher mode, stop the launcher, wait for shutdown, rebuild the JAR, then restart:

```bash
bash stop-local.sh
```

After the services have exited:

```bash
(cd server && bash mvnw clean package)
bash run-local.sh
```

The launcher only builds a JAR when it is missing; an existing JAR must be rebuilt after source changes.

### Production-style frontend build

Stop the frontend development server before running:

```bash
export NODE_OPTIONS=--openssl-legacy-provider
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
(cd frontend && npm run build)
(cd frontend && npm run start -- -H 127.0.0.1 -p 3000)
```

Start the backend and MongoDB separately. Validate the production-build flow in your target environment; development-mode checks do not establish production readiness.

## Testing

### Unit tests

```bash
(cd server && bash mvnw test)
(cd frontend && node --test tests/boardOperations.test.cjs)
```

Backend tests cover room and drawing services. Frontend tests cover drawing conversion, validation, deduplication, and history replay. Unit tests do not replace integration checks against a running database and browser clients.

### Browser verification checklist

With all services running:

- Create a room and join it in a second tab.
- Draw, change tools, and erase; check both clients.
- Reload and confirm drawings are restored.
- Create another room and confirm its board is isolated.
- Export and import drawings; confirm changes are shared.
- Clear a board and reload to verify empty history.
- Switch rooms and check drawings and participant counts.
- Close a participant tab and check presence updates.
- Try a nonexistent room and check the error state.
- Check desktop and mobile viewports, including touch drawing.
- Pan/zoom and verify new strokes appear correctly for another participant.
- Restart the backend/database, retry the browser connection, and confirm saved drawings return.

Run restart and clear tests only against disposable development data. Browser automation scripts, screenshots, and database files generated under `.local/` are excluded from Git and are not required for setup.

## API reference

The REST prefix is **`/api/rooms`**.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/rooms` | Create a room |
| `GET` | `/api/rooms/{roomId}` | Fetch room metadata |
| `GET` | `/api/rooms/{roomId}/drawings` | Fetch saved operations in timestamp order |
| `POST` | `/api/rooms/{roomId}/drawings` | Persist a drawing operation |
| `DELETE` | `/api/rooms/{roomId}/drawings` | Delete saved operations |
| `GET` | `/actuator/health` | Check backend/database health |

Example room creation:

```bash
curl -i -X POST http://localhost:8080/api/rooms \
  -H 'Content-Type: application/json' \
  -d '{"roomName":"Workshop","displayName":"Alice"}'
```

Expect HTTP 201 and a response containing an eight-character `roomId`.

Drawing payload:

```json
{
  "sessionId": "example-session",
  "tool": "pencil",
  "points": [{ "x": 100.5, "y": 120 }, { "x": 180, "y": 160.25 }],
  "colour": "#ffffff",
  "width": 3
}
```

- `tool`: `pencil` or `eraser`.
- `colour`: six-digit hex value.
- `width`: integer from 1 to 100.
- `points`: 1–5,000 points per operation.
- `operationId`: optional; generated by the backend if omitted. The frontend supplies unique IDs to identify server echoes.

### Realtime destinations

Connect a SockJS client to **`http://localhost:8080/ws`**, then use STOMP:

| Action | Publish destination | Subscription |
| --- | --- | --- |
| Draw | `/app/rooms/{roomId}/draw` | `/topic/rooms/{roomId}/drawings` |
| Clear | `/app/rooms/{roomId}/clear` | `/topic/rooms/{roomId}/drawings` |
| Join presence | `/app/rooms/{roomId}/presence/join` | `/topic/rooms/{roomId}/presence` |
| Leave presence | `/app/rooms/{roomId}/presence/leave` | `/topic/rooms/{roomId}/presence` |

Presence payloads contain `displayName`; clear payloads contain `sessionId`.

**REST drawing writes do not broadcast to connected browsers.** Use STOMP draw/clear messages for collaborative changes. The frontend already does this; sending a duplicate REST save for each socket event is unnecessary.

For more backend information, see [BACKEND_SETUP_DEPLOYMENT_TESTING.md](BACKEND_SETUP_DEPLOYMENT_TESTING.md).

## Storage and backups

### Persistent data

- Database: `collabcanvas`.
- Collections: `rooms` and `drawing_operations`.
- Data directory for the standalone commands and launcher: `.local/mongodb/`.
- Presence is stored in backend memory; clients reconnect after a backend restart.

Managed MongoDB services and Docker volumes use their own data locations. Rebuilding Java or reinstalling npm dependencies does not delete database records.

### Logs

The launcher writes:

```text
.local/logs/frontend.log
.local/logs/backend.log
.local/logs/mongodb.log
```

For example:

```bash
tail -n 100 .local/logs/backend.log
tail -f .local/logs/frontend.log
```

Frontend and backend logs are overwritten on each launcher start; MongoDB logs are appended. In manual mode, frontend and backend output goes to their owning terminals unless redirected.

### Offline backup of the local data directory

Stop MongoDB completely before archiving its files. If using the launcher, stop it and wait for all child processes to exit first.

From the project root, after confirming shutdown:

```bash
mkdir -p "$HOME/whiteboard-backups"
tar -czf "$HOME/whiteboard-backups/mongodb-$(date +%Y%m%d-%H%M%S).tar.gz" \
  -C .local mongodb
```

Raw data-directory backups require a compatible MongoDB installation. For portable logical backups, install [MongoDB Database Tools](https://www.mongodb.com/docs/database-tools/) and use `mongodump`/`mongorestore` as appropriate.

For an empty development database, stop the database and move its data directory to a backup location before starting again. Never run two MongoDB processes against the same directory.

## Docker alternative

`server/docker-compose.yaml` defines **MongoDB and the backend only**. Start Next.js separately.

Before starting containers:

1. Install Docker with Compose and confirm authorized access to the daemon.
2. Stop conflicting native services on ports 8080 and 27017.
3. Review port exposure: the supplied Compose file publishes on all host interfaces. For local-only access, change the database mapping to `127.0.0.1:27017:27017` and the backend mapping to `127.0.0.1:8080:8080`.

From the project root:

```bash
docker compose -f server/docker-compose.yaml up --build
```

Then start the frontend using the commands in [getting started](#getting-started). Use `http://localhost:3000`, which matches the allowed origin in the Compose file.

Stop containers with:

```bash
docker compose -f server/docker-compose.yaml down
```

The Docker volume is separate from `.local/mongodb/`; switching startup methods does not migrate data. `down` preserves the named volume unless `--volumes` is added, which deletes its data.

The Dockerfile skips tests during packaging. Run tests separately and validate container startup and health in your environment.

## Troubleshooting

| Symptom | Resolution |
| --- | --- |
| `node`, `npm`, `java`, or `mongod` not found | Install the required tool and ensure its executable is on `PATH`. For launcher mode, also prepare the documented runtime layout. |
| `mvn` not found | Use the included wrapper: `(cd server && bash mvnw test)`. |
| Java compilation or Lombok errors | Check that `JAVA_HOME`, `java`, and `javac` select JDK 17. |
| `ERR_OSSL_EVP_UNSUPPORTED` | Set `NODE_OPTIONS=--openssl-legacy-provider` before running Next.js on Node.js 22. |
| npm dependency-resolution errors | Use `npm ci --legacy-peer-deps` with the existing lockfile. |
| Port already in use | Identify the listener and stop it through its owning terminal, service manager, or container. Avoid killing unrelated applications. |
| Launcher reports missing runtimes | Check `JSF_RUNTIMES`, the `node/bin` layout, JDK selection, and the location of `mongod`. |
| Maven wrapper permission denied | Run `bash mvnw` from `server/`, or restore executable permissions. |
| Maven wrapper reports `$'\r'` or shell syntax errors | Ensure `server/mvnw` uses Unix LF line endings. |
| MongoDB fails with shared-library or CPU errors | Use a vendor-supported binary matching your OS, architecture, libraries, and CPU. |
| MongoDB reports a locked data directory | Check for another database process using the directory; stop it cleanly before retrying. |
| Backend cannot connect to MongoDB | Verify `MONGODB_URI`, database health, and networking. A container's `localhost` refers to that container. |
| Room creation fails or CORS errors appear | Verify backend health, `NEXT_PUBLIC_API_BASE_URL`, and the exact allowed browser origin. |
| Frontend environment changes have no effect | Restart the development server; rebuild production bundles after changing public environment values. |
| Drawings do not synchronize | Confirm both clients use the same room, the correct backend URL, and the `/ws` SockJS endpoint. |
| Retry connection appears | Restore backend/database availability, then select Retry. Unconfirmed changes may not have been saved. |
| Backend edits have no effect in launcher mode | Rebuild the executable JAR before restarting. |
| Stop script reports no PID file | The launcher may already be stopped, or services may have been started manually. Inspect listeners and their owning processes. |
| Docker permission denied | Configure authorized Docker access or use the native service instructions. |

Inspect logs before changing configuration. Keep credentials out of shared logs and committed environment files.

## Limitations and deployment

- **Undo:** no shared undo endpoint exists. The UI explains this rather than changing only one client's board.
- **Recovery:** retry restores saved history; unconfirmed operations are not automatically resent.
- **Payload limits:** both the 5,000-point limit and the default 64 KiB socket limit apply. A large operation can exceed the byte limit before reaching the point limit.
- **Scale:** large boards, high participant counts, and simultaneous clear/draw operations require additional testing.
- **Access control:** possession of a room ID is not authentication or authorization. This application is not private storage by default.
- **Dependencies:** run `npm audit` and review backend dependencies regularly. Plan compatible upgrades rather than applying forced dependency changes without testing.
- **Deployment security:** use maintained dependencies, authenticated database access, HTTPS/WSS, restricted allowed origins, secret management, access controls, and tested backups. The standalone MongoDB commands intentionally use loopback binding without authentication and are intended for local development only.
