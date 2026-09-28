package com.project.whiteboard.repository;
import com.project.whiteboard.model.Room;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
public interface RoomRepository extends MongoRepository<Room, String> {
    Optional<Room> findByRoomId(String roomId);
    boolean existsByRoomId(String roomId);
}
