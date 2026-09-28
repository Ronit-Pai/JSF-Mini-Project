package com.project.whiteboard;
import com.project.whiteboard.dto.DrawingEvent;
import com.project.whiteboard.model.*;
import com.project.whiteboard.repository.DrawingOperationRepository;
import com.project.whiteboard.service.*;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
class DrawingServiceTest {
    @Test void saveScopesTheOperationToTheResolvedRoom() {
        DrawingOperationRepository repository = mock(DrawingOperationRepository.class); RoomService rooms = mock(RoomService.class);
        when(repository.save(any(DrawingOperation.class))).thenAnswer(i -> i.getArgument(0));
        DrawingEvent event = new DrawingEvent(); event.setSessionId("session-a"); event.setTool("pencil"); event.setColour("#123ABC"); event.setWidth(4); event.setPoints(List.of(new Point(1.0, 2.0)));
        DrawingOperation saved = new DrawingService(repository, rooms).save("room1", event);
        assertEquals("ROOM1", saved.getRoomId()); assertNotNull(saved.getOperationId()); verify(rooms).getRequired("room1");
    }
}
