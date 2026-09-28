package com.project.whiteboard.model;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;
@Document("drawing_operations")
@CompoundIndex(name = "room_timestamp", def = "{'roomId': 1, 'timestamp': 1}")
public class DrawingOperation {
    @Id private String operationId;
    private String roomId;
    private String sessionId;
    private String tool;
    private List<Point> points;
    private String colour;
    private Integer width;
    private Instant timestamp;
    public String getOperationId() { return operationId; }
    public void setOperationId(String operationId) { this.operationId = operationId; }
    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getTool() { return tool; }
    public void setTool(String tool) { this.tool = tool; }
    public List<Point> getPoints() { return points; }
    public void setPoints(List<Point> points) { this.points = points; }
    public String getColour() { return colour; }
    public void setColour(String colour) { this.colour = colour; }
    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
