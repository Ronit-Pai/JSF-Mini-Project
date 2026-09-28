package com.project.whiteboard.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public class PresenceRequest { @NotBlank @Size(max = 80) private String displayName; public String getDisplayName() { return displayName; } public void setDisplayName(String displayName) { this.displayName = displayName; } }
