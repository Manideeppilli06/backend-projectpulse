package com.projectpulse.backend.board;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardListRepository extends JpaRepository<BoardList, Long> {

    List<BoardList> findByBoardIdOrderByPositionAsc(Long boardId);

    long countByBoardId(Long boardId);
}