package com.project.whiteboard.repository;
import com.project.whiteboard.model.DrawingOperation;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
public interface DrawingOperationRepository extends MongoRepository<DrawingOperation, String> {
    List<DrawingOperation> findByRoomIdOrderByTimestampAsc(String roomId);
    void deleteByRoomId(String roomId);
}
