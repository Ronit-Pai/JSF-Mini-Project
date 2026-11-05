# CollabCanvas Backend Setup Deployment and Testing

This guide covers the Spring Boot and MongoDB backend in `server`. It implements the room-based collaboration behavior described in the supplied requirements: room creation, persisted drawing operations, STOMP/WebSocket synchronization, clear-board events, and room-scoped presence.

## Requirements

- Java 17
- Docker Desktop with its Linux engine running, if using containers
- MongoDB 7, unless using the provided Docker Compose configuration

No credentials are committed. Start from `server/.env.example` and set a private `MONGODB_URI` for any shared or production environment.

## Local development

1. Start MongoDB with `docker compose up -d mongodb` from the project root.
2. In PowerShell, set local configuration if it differs from the defaults:

   ```powershell
   $env:MONGODB_URI = "mongodb://localhost:27017/collabcanvas"
   $env:CORS_ALLOWED_ORIGINS = "http://localhost:3000"
   ```

3. Run the backend:

   ```powershell
   cd server
   .\mvnw.cmd spring-boot:run
   ```

The service listens on `http://localhost:8080` by default. A browser app must use a permitted origin and reconnect by fetching persisted operations after an interrupted socket connection.

## REST contract

| Purpose | Method and path | Body / result |
| --- | --- | --- |
| Create room | `POST /api/rooms` | `{ "roomName": "Workshop", "displayName": "Asha" }` returns a generated 8-character `roomId` |
| Room metadata | `GET /api/rooms/{roomId}` | Returns room ID, name, and timestamps |
| Restore board | `GET /api/rooms/{roomId}/drawings` | Returns chronological persisted operations |
| Persist a stroke | `POST /api/rooms/{roomId}/drawings` | Uses the drawing event payload below |
| Clear saved board | `DELETE /api/rooms/{roomId}/drawings` | Returns `204 No Content` |

A drawing event contains `sessionId`, `tool` (`pencil` or `eraser`), one to 5,000 `{ "x": number, "y": number }` points, a six-digit hex `colour`, and `width` from 1 to 100. The server adds `operationId`, normalized `roomId`, and `timestamp`.

Invalid input returns HTTP 400, missing rooms return 404, and database outages return 503 without exposing internal connection details.

## WebSocket and STOMP contract

Connect a SockJS/STOMP client to `/ws` and use the `/app` application prefix. Subscribe before publishing:

| Action | Send to | Subscribe to |
| --- | --- | --- |
| Draw stroke | `/app/rooms/{roomId}/draw` | `/topic/rooms/{roomId}/drawings` |
| Clear board | `/app/rooms/{roomId}/clear` | `/topic/rooms/{roomId}/drawings` |
| Join presence | `/app/rooms/{roomId}/presence/join` | `/topic/rooms/{roomId}/presence` |
| Leave presence | `/app/rooms/{roomId}/presence/leave` | `/topic/rooms/{roomId}/presence` |

Presence join and leave payloads are `{ "displayName": "Asha" }`. The backend binds presence to the actual STOMP session and emits a new participant list on joins, explicit leaves, and abrupt disconnects. Clear notifications have `type: "board_cleared"`; drawing notifications are persisted drawing operations. The bundled old `/ws-message` transport path is retained temporarily, but clients must migrate their destinations to the contracts above.

## Build and tests

Run the unit suite and package the executable JAR:

```powershell
cd server
.\mvnw.cmd clean test
.\mvnw.cmd package
```

The unit tests cover server-generated room IDs, missing-room handling, and room-scoped drawing persistence. Before release, also perform this integration checklist against MongoDB:

1. Create two rooms and connect two browser clients to each.
2. Publish a stroke in one room and verify it reaches only that room's drawings topic.
3. Refresh a client and verify `GET /drawings` restores chronological strokes.
4. Clear one room and verify its history is deleted without affecting the other room.
5. Close a client without sending leave and verify a presence update is emitted.
6. Submit invalid tool, colour, width, and oversized point-list payloads; verify rejection.

## Container deployment

To run MongoDB, the backend, and frontend together from the project root:

```powershell
docker compose up --build
```

For a platform deployment, build and publish the `server/Dockerfile` image, then configure these environment variables in the platform's secret/settings interface:

```text
MONGODB_URI=mongodb+srv://<private-user>:<private-password>@<cluster>/collabcanvas?retryWrites=true&w=majority
CORS_ALLOWED_ORIGINS=https://your-frontend.example
PORT=8080
WEBSOCKET_MAX_PAYLOAD_BYTES=65536
```

Terminate TLS at the platform or reverse proxy and configure the frontend to use `https://` REST URLs and `wss://` WebSocket URLs. Do not use `*` for production origins. Ensure the proxy supports WebSocket upgrade requests and health-check `GET /actuator/health` after deployment. Set `SPRING_PROFILES_ACTIVE=prod` to enable graceful shutdown and forwarded-header support.

## Production smoke test

After deployment, create a room, connect two independent browser sessions, draw, clear, refresh, and reconnect. Confirm that records are present in the `rooms` and `drawing_operations` collections, no draw event crosses rooms, and browser console/network logs contain no CORS or WebSocket upgrade errors.
