package com.projectpulse.backend.task;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByListIdOrderByPositionAsc(Long listId);

    List<Task> findByListBoardIdOrderByPositionAsc(Long boardId);

    long countByListId(Long listId);

    long countByListBoardId(Long boardId);

    long countByListBoardIdAndListNameIgnoreCase(Long boardId, String name);
}