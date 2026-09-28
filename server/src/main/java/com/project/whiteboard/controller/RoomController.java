package com.project.whiteboard.controller;
import com.project.whiteboard.dto.*;
import com.project.whiteboard.model.DrawingOperation;
import com.project.whiteboard.service.DrawingService;
import com.project.whiteboard.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    private final RoomService rooms; private final DrawingService drawings;
    public RoomController(RoomService rooms, DrawingService drawings) { this.rooms = rooms; this.drawings = drawings; }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public RoomResponse create(@Valid @RequestBody CreateRoomRequest request) { return RoomResponse.from(rooms.create(request)); }
    @GetMapping("/{roomId}") public RoomResponse get(@PathVariable String roomId) { return RoomResponse.from(rooms.getRequired(roomId)); }
    @GetMapping("/{roomId}/drawings") public List<DrawingOperation> drawings(@PathVariable String roomId) { return drawings.list(roomId); }
    @PostMapping("/{roomId}/drawings") @ResponseStatus(HttpStatus.CREATED)
    public DrawingOperation save(@PathVariable String roomId, @Valid @RequestBody DrawingEvent event) { return drawings.save(roomId, event); }
    @DeleteMapping("/{roomId}/drawings") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear(@PathVariable String roomId) { drawings.clear(roomId); }
}
