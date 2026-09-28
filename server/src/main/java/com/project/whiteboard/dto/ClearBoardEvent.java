package com.project.whiteboard.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public class ClearBoardEvent { @NotBlank @Size(max = 80) private String sessionId; public String getSessionId() { return sessionId; } public void setSessionId(String sessionId) { this.sessionId = sessionId; } }
