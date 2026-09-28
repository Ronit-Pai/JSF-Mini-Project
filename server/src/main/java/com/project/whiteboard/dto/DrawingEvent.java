package com.project.whiteboard.dto;
import com.project.whiteboard.model.Point;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
public class DrawingEvent {
    @Size(max = 80) private String operationId;
    @NotBlank @Size(max = 80) private String sessionId;
    @NotBlank @Pattern(regexp = "pencil|eraser") private String tool;
    @NotEmpty @Size(max = 5000) private List<@Valid Point> points;
    @NotBlank @Pattern(regexp = "#[0-9a-fA-F]{6}") private String colour;
    @NotNull @Min(1) @Max(100) private Integer width;
    public String getOperationId() { return operationId; }
    public void setOperationId(String operationId) { this.operationId = operationId; }
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
}
