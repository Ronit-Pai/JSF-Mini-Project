package com.project.whiteboard.service;
import com.project.whiteboard.dto.CreateRoomRequest;
import com.project.whiteboard.exception.ResourceNotFoundException;
import com.project.whiteboard.model.Room;
import com.project.whiteboard.repository.RoomRepository;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.security.SecureRandom;
import java.util.Locale;
@Service
public class RoomServiceImpl implements RoomService {
    private static final char[] ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private final SecureRandom random = new SecureRandom();
    private final RoomRepository rooms;
    public RoomServiceImpl(RoomRepository rooms) { this.rooms = rooms; }
    public Room create(CreateRoomRequest request) {
        Room room = new Room();
        room.setRoomId(nextRoomId());
        room.setRoomName(request.roomName().trim());
        room.setCreatedAt(Instant.now());
        room.setUpdatedAt(room.getCreatedAt());
        return rooms.save(room);
    }
    public Room getRequired(String roomId) { return rooms.findByRoomId(normalize(roomId)).orElseThrow(() -> new ResourceNotFoundException("Room not found")); }
    public boolean exists(String roomId) { return rooms.existsByRoomId(normalize(roomId)); }
    private String nextRoomId() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder id = new StringBuilder(8);
            for (int i = 0; i < 8; i++) id.append(ALPHABET[random.nextInt(ALPHABET.length)]);
            if (!rooms.existsByRoomId(id.toString())) return id.toString();
        }
        throw new IllegalStateException("Could not allocate room ID");
    }
    private String normalize(String roomId) { return roomId == null ? "" : roomId.trim().toUpperCase(Locale.ROOT); }
}
