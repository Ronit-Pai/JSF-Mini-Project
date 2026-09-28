package com.project.whiteboard.controller;
import com.project.whiteboard.dto.*;
import com.project.whiteboard.model.DrawingOperation;
import com.project.whiteboard.service.DrawingService;
import com.project.whiteboard.service.PresenceService;
import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.time.Instant;
@Controller
public class WebSocketTextController {
    private final DrawingService drawings; private final PresenceService presence; private final SimpMessagingTemplate messages;
    public WebSocketTextController(DrawingService drawings, PresenceService presence, SimpMessagingTemplate messages) { this.drawings = drawings; this.presence = presence; this.messages = messages; }
    @MessageMapping("/rooms/{roomId}/draw") public void draw(@DestinationVariable String roomId, @Valid DrawingEvent event) { DrawingOperation saved = drawings.save(roomId, event); messages.convertAndSend("/topic/rooms/" + saved.getRoomId() + "/drawings", saved); }
    @MessageMapping("/rooms/{roomId}/clear") public void clear(@DestinationVariable String roomId, @Valid ClearBoardEvent event) { drawings.clear(roomId); String id = roomId.trim().toUpperCase(); messages.convertAndSend("/topic/rooms/" + id + "/drawings", new BoardClearedEvent("board_cleared", id, event.getSessionId(), Instant.now())); }
    @MessageMapping("/rooms/{roomId}/presence/join") public void join(@DestinationVariable String roomId, @Valid PresenceRequest request, SimpMessageHeaderAccessor headers) { presence.join(roomId, headers.getSessionId(), request.getDisplayName()); }
    @MessageMapping("/rooms/{roomId}/presence/leave") public void leave(@DestinationVariable String roomId, @Valid PresenceRequest request, SimpMessageHeaderAccessor headers) { presence.leave(roomId, headers.getSessionId()); }
}
