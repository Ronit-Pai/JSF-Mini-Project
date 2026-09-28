package com.project.whiteboard.service;
import com.project.whiteboard.dto.CreateRoomRequest;
import com.project.whiteboard.model.Room;
public interface RoomService {
    Room create(CreateRoomRequest request);
    Room getRequired(String roomId);
    boolean exists(String roomId);
}
