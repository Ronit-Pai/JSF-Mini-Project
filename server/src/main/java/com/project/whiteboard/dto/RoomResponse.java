package com.project.whiteboard.dto;
import com.project.whiteboard.model.Room;
import java.time.Instant;
public record RoomResponse(String roomId, String roomName, Instant createdAt, Instant updatedAt) {
    public static RoomResponse from(Room room) { return new RoomResponse(room.getRoomId(), room.getRoomName(), room.getCreatedAt(), room.getUpdatedAt()); }
}
