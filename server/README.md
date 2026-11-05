# Server and project guide

This guide explains the files in `server/` and how a browser session uses the
backend. The backend is a Java 17 / Spring Boot 3.3 application. It exposes REST
endpoints for rooms and board history, SockJS/STOMP for live updates, and uses
MongoDB for persisted room and drawing data.

## How the project works

```text
Next.js browser
  ├─ REST: create/join a room and load saved drawing operations
  └─ SockJS + STOMP: send strokes, clear the board, and exchange presence
             |
             v
Spring Boot server
  ├─ validates requests and checks that rooms exist
  ├─ persists rooms and drawing operations
  └─ broadcasts room-scoped drawing and presence events
             |
             v
MongoDB: rooms and drawing_operations collections
```

1. On the home page, the frontend creates a room with `POST /api/rooms`. The
   server generates its room ID and stores the room in MongoDB.
2. The room page fetches room metadata, opens a SockJS connection at `/ws`, and
   subscribes to that room's drawing and presence topics. It sends a presence
   join event, then fetches saved drawings over REST. Live events received while
   history loads are buffered and merged with history.
3. A stroke is sent to `/app/rooms/{roomId}/draw`. The server validates it,
   verifies the room, saves it as a drawing operation, and publishes the saved
   operation to `/topic/rooms/{roomId}/drawings`. The browser applies the event
   to its canvas and reconciles it with its pending local update.
4. Clearing uses `/app/rooms/{roomId}/clear`. The server deletes that room's
   saved drawing operations and broadcasts a `board_cleared` event to the same
   drawings topic.
5. Join and leave messages go to `/app/rooms/{roomId}/presence/join` and
   `/app/rooms/{roomId}/presence/leave`. Presence is held in server memory,
   keyed by room and WebSocket session; disconnect events remove participants
   even if the browser did not send an explicit leave.
6. On reconnect or refresh, the frontend requests
   `GET /api/rooms/{roomId}/drawings` to rebuild the board from MongoDB.

Room IDs are normalized to uppercase. A room's saved drawing history is
permanent until cleared; presence is transient and is not stored in MongoDB.
The WebSocket simple broker is in-memory, so this setup is intended for a single
backend instance unless messaging and presence are adapted for a multi-instance
deployment.

### Main REST endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/rooms` | Create a room and return its generated ID |
| `GET` | `/api/rooms/{roomId}` | Read room metadata |
| `GET` | `/api/rooms/{roomId}/drawings` | Read saved operations in timestamp order |
| `POST` | `/api/rooms/{roomId}/drawings` | Save an operation through REST |
| `DELETE` | `/api/rooms/{roomId}/drawings` | Delete all saved operations for the room |

The shared canvas currently uses STOMP to save and distribute live strokes;
the REST `POST` endpoint saves an operation but does not broadcast it.

## Files in `server/`

### Build and runtime configuration

| File | What it does |
| --- | --- |
| `pom.xml` | Maven project definition: Spring Boot 3.3.5, Java 17, web, WebSocket, MongoDB, validation, Actuator, Lombok, and test dependencies; also configures the Spring Boot packaging plugin. |
| `mvnw` | Unix-like shell entry point for the Maven Wrapper. |
| `mvnw.cmd` | Windows command-shell entry point for the Maven Wrapper. |
| `.mvn/wrapper/maven-wrapper.properties` | Selects the Maven distribution and wrapper JAR versions/URLs used by the scripts. |
| `.mvn/wrapper/maven-wrapper.jar` | Maven Wrapper bootstrap JAR used to download/run the configured Maven distribution. |
| `.mvn/wrapper/MavenWrapperDownloader.java` | Helper source used by the wrapper to download its bootstrap JAR if needed. |
| `.env.example` | Example environment-variable values for MongoDB, port, allowed browser origins, and WebSocket payload limit. It is a reference; the application reads environment variables rather than loading this file itself. |
| `.gitignore` | Excludes Maven build output and common IDE/project files from version control. |
| `src/main/resources/application.properties` | Default Spring settings, including port, MongoDB URI, CORS origins, WebSocket payload size, safe error responses, and health endpoint exposure. |
| `src/main/resources/application-prod.properties` | Production-profile settings for forwarded proxy headers and graceful shutdown. Activate with `SPRING_PROFILES_ACTIVE=prod`. |

### Containers and deployment

| File | What it does |
| --- | --- |
| `Dockerfile` | Builds the application in a Maven/JDK stage, copies the executable JAR into a Java 17 runtime image, exposes port 8080, and defines an Actuator health check. |
| `../docker-compose.yaml` | Starts MongoDB, the backend, and frontend without publishing host ports, supplies their connection/CORS configuration, and keeps database files in a named volume. |
| `../docker-compose.local.yaml` | Optional local-development overlay that publishes each service on loopback for browser and host access. |
| `heroku.yml` | Directs Heroku's Docker-based build to use `Dockerfile` for its web process. |

### Java application source

All Java source files are under
`src/main/java/com/project/whiteboard/`.

#### Application entry point

| File | What it does |
| --- | --- |
| `WhiteboardApplication.java` | Spring Boot entry point. Starts the application and component scanning. |

#### Configuration (`config/`)

| File | What it does |
| --- | --- |
| `CorsConfig.java` | Allows configured browser origins to call `/api/**` using GET, POST, DELETE, or OPTIONS. |
| `WebSocketConfig.java` | Enables STOMP message handling, configures `/app` as the client-send prefix and `/topic` as the broadcast broker, registers SockJS endpoints `/ws` and the compatibility endpoint `/ws-message`, and sets the inbound message-size limit. |
| `WebSocketEvents.java` | Listens for WebSocket disconnects and asks the presence service to remove the disconnected session from rooms. |

#### HTTP and WebSocket controllers (`controller/`)

| File | What it does |
| --- | --- |
| `RoomController.java` | Implements the room and drawing-history REST endpoints. It delegates room and drawing rules to services and validates incoming request bodies. |
| `WebSocketTextController.java` | Handles STOMP draw, clear, join, and leave messages. Draws are saved before broadcast; clears delete stored operations before notifying subscribers. |

#### Message and API data types (`dto/`)

| File | What it does |
| --- | --- |
| `CreateRoomRequest.java` | Request fields for room creation: a nonblank room name (up to 100 characters) and optional display name (up to 80). |
| `RoomResponse.java` | API representation of a room, with a factory to expose its ID, name, and timestamps without exposing the MongoDB document directly. |
| `DrawingEvent.java` | Drawing operation payload. Validates operation/session IDs, `pencil` or `eraser` tool, 1–5,000 points, six-digit hex colour, and width from 1 to 100. |
| `ClearBoardEvent.java` | Clear message payload; carries the session ID of the participant requesting the clear. |
| `BoardClearedEvent.java` | Broadcast notification identifying a cleared board, room, requesting session, and event time. |
| `PresenceRequest.java` | Join/leave request payload containing a nonblank display name of at most 80 characters. |
| `PresenceEvent.java` | Presence broadcast containing the event type, affected display name, and current participant names. |

#### Domain models (`model/`)

| File | What it does |
| --- | --- |
| `Room.java` | MongoDB document for a room, stored in the `rooms` collection. Its room ID has a unique index. |
| `DrawingOperation.java` | MongoDB document for a saved stroke/eraser operation in `drawing_operations`; includes room, session, tool, points, colour, width, timestamp, and a room/timestamp index. |
| `Point.java` | A validated `{x, y}` coordinate used in a drawing operation. |
| `Drawing.java` | Legacy drawing payload containing a list of `Coordinates`; not used by the current REST/STOMP flow. |
| `Coordinates.java` | Legacy segment-style coordinate and style data used by `Drawing`; not used by the current flow. |
| `ActionResponseDTO.java` | Legacy response shape with a message and user list; not referenced by the current flow. |
| `RoomActionsDTO.java` | Legacy room-action payload with username, payload, and room ID; not referenced by the current flow. |
| `TextMessageDTO.java` | Legacy single-message payload; not referenced by the current flow. |

#### Persistence interfaces (`repository/`)

| File | What it does |
| --- | --- |
| `RoomRepository.java` | Spring Data MongoDB operations for rooms, including lookup and existence checks by room ID. |
| `DrawingOperationRepository.java` | Spring Data MongoDB operations for drawing history, including chronological room queries and deleting all operations in a room. |

#### Application logic (`service/`)

| File | What it does |
| --- | --- |
| `RoomService.java` | Interface for creating rooms, requiring a room to exist, and checking whether it exists. |
| `RoomServiceImpl.java` | Implements room operations: generates collision-checked eight-character IDs, normalizes lookup IDs, sets timestamps, and reports missing rooms. |
| `DrawingService.java` | Validates room existence, assigns operation IDs and timestamps, normalizes room IDs, and saves, lists, or clears drawing operations. |
| `PresenceService.java` | Tracks room participants in concurrent in-memory maps, publishes participant lists, and removes sessions on explicit leave or disconnect. |

#### Error handling (`exception/`)

| File | What it does |
| --- | --- |
| `ResourceNotFoundException.java` | Signals that a requested room does not exist. |
| `ApiExceptionHandler.java` | Converts missing rooms to 404, validation errors to 400, and MongoDB access failures to 503 Problem Details responses. |

### Tests (`src/test/java/com/project/whiteboard/`)

| File | What it does |
| --- | --- |
| `RoomServiceImplTest.java` | Tests server-generated room IDs and the not-found behavior for missing rooms. |
| `DrawingServiceTest.java` | Tests that a saved operation is associated with a verified, normalized room and receives an operation ID. |
| `WhiteboardApplicationTests.java` | Basic application-class availability smoke test. |

Maven-generated files such as `target/` and the packaged JAR are build outputs,
not source files; `target/` is excluded by `.gitignore`.

## Build and run

From this directory, with Java 17 installed and MongoDB reachable:

```sh
./mvnw test
./mvnw spring-boot:run
```

The default server address is `http://localhost:8080`. Set `MONGODB_URI`,
`CORS_ALLOWED_ORIGINS`, `PORT`, or `WEBSOCKET_MAX_PAYLOAD_BYTES` in the
environment to override the defaults. For complete local launcher, API,
container, and deployment instructions, see
[`../LOCAL_SETUP.md`](../LOCAL_SETUP.md) and
[`../BACKEND_SETUP_DEPLOYMENT_TESTING.md`](../BACKEND_SETUP_DEPLOYMENT_TESTING.md).
