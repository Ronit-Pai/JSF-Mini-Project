package com.project.whiteboard;
import com.project.whiteboard.dto.CreateRoomRequest;
import com.project.whiteboard.exception.ResourceNotFoundException;
import com.project.whiteboard.model.Room;
import com.project.whiteboard.repository.RoomRepository;
import com.project.whiteboard.service.RoomServiceImpl;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
class RoomServiceImplTest {
    @Test void createsAnEightCharacterServerGeneratedRoomId() {
        RoomRepository repository = mock(RoomRepository.class);
        when(repository.existsByRoomId(any())).thenReturn(false); when(repository.save(any(Room.class))).thenAnswer(i -> i.getArgument(0));
        Room room = new RoomServiceImpl(repository).create(new CreateRoomRequest("Design review", "Asha"));
        assertTrue(room.getRoomId().matches("[A-Z2-9]{8}")); assertEquals("Design review", room.getRoomName());
    }
    @Test void missingRoomHasNoAmbiguousResult() {
        RoomRepository repository = mock(RoomRepository.class); when(repository.findByRoomId("MISSING")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> new RoomServiceImpl(repository).getRequired("missing"));
    }
}
