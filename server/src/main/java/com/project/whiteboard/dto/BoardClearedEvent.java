package com.project.whiteboard.dto;
import java.time.Instant;
public record BoardClearedEvent(String type, String roomId, String sessionId, Instant timestamp) { }
