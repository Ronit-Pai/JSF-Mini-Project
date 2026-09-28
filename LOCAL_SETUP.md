# Local development on this machine

This is the short reference for the configured machine. See [README.md](README.md) for the full installation guide, configuration reference, manual startup commands, API details, testing, backups, Docker notes, and troubleshooting.

## Architecture

- `frontend/`: Next.js 11 and React 17, with a canvas-based drawing interface.
- `server/`: Spring Boot 3.3.5 on Java 17. REST endpoints create rooms and restore drawings; STOMP over SockJS broadcasts drawings and presence.
- MongoDB 7: stores rooms and drawing operations in the `collabcanvas` database.

## Start and stop

From a terminal (including Fish):

```sh
cd /home/ronitpai/jsf/Jsf
bash run-local.sh
```

Open **http://localhost:3000**. Create a room with a username and room name. Another browser tab can join using the room ID from the room URL or the **🔗 Copy ID** button.

The launcher runs all three services and stops them when you press **Ctrl+C**. To stop a background instance from another terminal, run `bash stop-local.sh` from this directory. It refuses to start a duplicate instance on occupied ports. Services bind only to the local machine.

| Service | Address |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8080 |
| Backend health | http://localhost:8080/actuator/health |
| MongoDB | mongodb://127.0.0.1:27017/collabcanvas |

Logs are in `.local/logs/`. Database files are in `.local/mongodb/` and survive restarts. Stop MongoDB before moving or deleting these files.

## Installed dependencies

User-local runtimes are under `~/.local/share/jsf-runtimes/`:

- Node.js 22, with npm, through the `node/` symlink.
- Eclipse Temurin Java 17 in `jdk-17*/`.
- MongoDB 7 in `mongodb-linux-*/`.

The launcher selects these runtimes without changing the system Java version or shell configuration. Docker is not required for this setup. Maven is downloaded by the project's Maven wrapper into `~/.m2/`; frontend dependencies are installed in `frontend/node_modules/`.

Next.js 11 needs `NODE_OPTIONS=--openssl-legacy-provider` with Node 22; the launcher supplies it. This is a legacy application with outdated dependencies, intended here for local development, not public deployment without upgrades and a security review.

## Rebuild or reinstall

In Bash:

```bash
export JAVA_HOME="$(find "$HOME/.local/share/jsf-runtimes" -maxdepth 1 -type d -name 'jdk-17*' -print -quit)"
export PATH="$HOME/.local/share/jsf-runtimes/node/bin:$JAVA_HOME/bin:$PATH"

cd /home/ronitpai/jsf/Jsf/server
./mvnw clean package

cd ../frontend
npm ci --legacy-peer-deps
```

The launcher builds the backend if the JAR is missing. After editing backend code, stop the app, run `./mvnw package` with the runtime environment above, and restart. Frontend edits are reloaded automatically by the development server.

## Local integration configuration

`frontend/utils/baseUrl.js` reads `NEXT_PUBLIC_API_BASE_URL`, defaulting to `http://localhost:8080`. The frontend uses the bundled backend's `/api/rooms` REST endpoints and `/ws` SockJS endpoint, rather than the original hosted Heroku service.

For the launcher, CORS permits `http://localhost:3000` and `http://127.0.0.1:3000`. Use `localhost` consistently when opening the app.

## Tests and limitations

Backend unit tests run with `./mvnw test` using Java 17. Frontend operation tests run with:

```sh
~/.local/share/jsf-runtimes/node/bin/node --test frontend/tests/boardOperations.test.cjs
```

Local browser verification scripts and screenshots are stored in `.local/`. They use Playwright installed outside the project at `~/.cache/jsf-browser/` and the existing Google Chrome executable.

The backend does not support undo. The Undo control explains this; use the eraser or the confirmed **Clear Board for Everyone** action instead. After a dropped connection, use **Retry connection** to restore saved drawings. Unconfirmed strokes are not automatically resent.

The npm audit at setup reported 37 vulnerabilities, including 13 critical and 18 high. Dependency upgrades were intentionally kept separate from local startup work. Do not expose this legacy development setup publicly.
