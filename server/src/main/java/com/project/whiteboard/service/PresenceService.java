package com.project.whiteboard.service;
import com.project.whiteboard.dto.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
@Service
public class PresenceService {
    private final Map<String, Map<String, String>> members = new ConcurrentHashMap<>();
    private final SimpMessagingTemplate messages; private final RoomService rooms;
    public PresenceService(SimpMessagingTemplate messages, RoomService rooms) { this.messages = messages; this.rooms = rooms; }
    public void join(String roomId, String sessionId, String displayName) { rooms.getRequired(roomId); members.computeIfAbsent(normalize(roomId), ignored -> new ConcurrentHashMap<>()).put(sessionId, displayName.trim()); publish(roomId, "joined", displayName); }
    public void leave(String roomId, String sessionId) { Map<String, String> room = members.get(normalize(roomId)); if (room == null) return; String name = room.remove(sessionId); if (room.isEmpty()) members.remove(normalize(roomId)); if (name != null) publish(roomId, "left", name); }
    public void disconnect(String sessionId) { new ArrayList<>(members.keySet()).forEach(roomId -> leave(roomId, sessionId)); }
    private void publish(String roomId, String type, String name) { Map<String, String> room = members.getOrDefault(normalize(roomId), Map.of()); messages.convertAndSend("/topic/rooms/" + normalize(roomId) + "/presence", new PresenceEvent(type, name, List.copyOf(room.values()))); }
    private String normalize(String roomId) { return roomId.trim().toUpperCase(Locale.ROOT); }
}
