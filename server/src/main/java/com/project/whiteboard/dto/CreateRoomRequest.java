package com.project.whiteboard.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record CreateRoomRequest(@NotBlank @Size(max = 100) String roomName, @Size(max = 80) String displayName) { }
