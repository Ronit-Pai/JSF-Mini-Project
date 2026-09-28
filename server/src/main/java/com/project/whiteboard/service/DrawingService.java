package com.project.whiteboard.service;
import com.project.whiteboard.dto.DrawingEvent;
import com.project.whiteboard.exception.ResourceNotFoundException;
import com.project.whiteboard.model.DrawingOperation;
import com.project.whiteboard.repository.DrawingOperationRepository;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
@Service
public class DrawingService {
    private final DrawingOperationRepository operations;
    private final RoomService rooms;
    public DrawingService(DrawingOperationRepository operations, RoomService rooms) { this.operations = operations; this.rooms = rooms; }
    public DrawingOperation save(String roomId, DrawingEvent event) {
        rooms.getRequired(roomId);
        DrawingOperation operation = new DrawingOperation();
        operation.setOperationId(event.getOperationId() == null || event.getOperationId().isBlank() ? UUID.randomUUID().toString() : event.getOperationId());
        operation.setRoomId(roomId.trim().toUpperCase()); operation.setSessionId(event.getSessionId()); operation.setTool(event.getTool());
        operation.setPoints(event.getPoints()); operation.setColour(event.getColour()); operation.setWidth(event.getWidth()); operation.setTimestamp(Instant.now());
        return operations.save(operation);
    }
    public List<DrawingOperation> list(String roomId) { rooms.getRequired(roomId); return operations.findByRoomIdOrderByTimestampAsc(roomId.trim().toUpperCase()); }
    public void clear(String roomId) { rooms.getRequired(roomId); operations.deleteByRoomId(roomId.trim().toUpperCase()); }
}
