package com.project.whiteboard.dto;
import java.util.List;
public record PresenceEvent(String type, String displayName, List<String> participants) { }
