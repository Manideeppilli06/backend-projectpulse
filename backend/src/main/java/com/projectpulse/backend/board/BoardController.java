package com.projectpulse.backend.board;

import com.projectpulse.backend.board.BoardDtos.*;
import com.projectpulse.backend.user.User;
import com.projectpulse.backend.user.UserRepository;
import com.projectpulse.backend.workspace.WorkspaceMember;
import com.projectpulse.backend.workspace.WorkspaceMemberRepository;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class BoardController {

    private static final String[] DEFAULT_LISTS = {"To Do", "In Progress", "Done"};

    private final BoardRepository boardRepository;
    private final BoardListRepository listRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;

    public BoardController(BoardRepository boardRepository,
                           BoardListRepository listRepository,
                           WorkspaceMemberRepository memberRepository,
                           UserRepository userRepository) {
        this.boardRepository = boardRepository;
        this.listRepository = listRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    private User currentUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private Board accessibleBoard(Long boardId, User me) {
        Board board = boardRepository.findById(boardId).orElse(null);
        if (board == null) {
            return null;
        }
        boolean isMember = memberRepository
                .existsByWorkspaceIdAndUserId(board.getWorkspace().getId(), me.getId());
        return isMember ? board : null;
    }

    private ResponseEntity<?> notFound(String message) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", message));
    }

    @PostMapping("/workspaces/{workspaceId}/boards")
    @Transactional
    public ResponseEntity<?> createBoard(@PathVariable Long workspaceId,
                                         @Valid @RequestBody CreateBoardRequest req,
                                         Authentication auth) {
        User me = currentUser(auth);
        WorkspaceMember membership = memberRepository
                .findByWorkspaceIdAndUserId(workspaceId, me.getId()).orElse(null);
        if (membership == null) {
            return notFound("Workspace not found");
        }

        Board board = boardRepository.save(Board.builder()
                .name(req.name().trim())
                .workspace(membership.getWorkspace())
                .build());

        for (int i = 0; i < DEFAULT_LISTS.length; i++) {
            listRepository.save(BoardList.builder()
                    .name(DEFAULT_LISTS[i])
                    .position(i)
                    .board(board)
                    .build());
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new BoardResponse(board.getId(), board.getName(), workspaceId));
    }

    @GetMapping("/workspaces/{workspaceId}/boards")
    @Transactional(readOnly = true)
    public ResponseEntity<?> listBoards(@PathVariable Long workspaceId, Authentication auth) {
        User me = currentUser(auth);
        if (!memberRepository.existsByWorkspaceIdAndUserId(workspaceId, me.getId())) {
            return notFound("Workspace not found");
        }

        List<BoardResponse> boards = boardRepository
                .findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .map(b -> new BoardResponse(b.getId(), b.getName(), workspaceId))
                .toList();
        return ResponseEntity.ok(boards);
    }

    @GetMapping("/boards/{boardId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getBoard(@PathVariable Long boardId, Authentication auth) {
        User me = currentUser(auth);
        Board board = accessibleBoard(boardId, me);
        if (board == null) {
            return notFound("Board not found");
        }

        List<ListResponse> lists = listRepository.findByBoardIdOrderByPositionAsc(boardId).stream()
                .map(l -> new ListResponse(l.getId(), l.getName(), l.getPosition()))
                .toList();

        return ResponseEntity.ok(new BoardDetailResponse(
                board.getId(), board.getName(), board.getWorkspace().getId(), lists));
    }

    @PostMapping("/boards/{boardId}/lists")
    @Transactional
    public ResponseEntity<?> addList(@PathVariable Long boardId,
                                     @Valid @RequestBody CreateListRequest req,
                                     Authentication auth) {
        User me = currentUser(auth);
        Board board = accessibleBoard(boardId, me);
        if (board == null) {
            return notFound("Board not found");
        }

        BoardList list = listRepository.save(BoardList.builder()
                .name(req.name().trim())
                .position((int) listRepository.countByBoardId(boardId))
                .board(board)
                .build());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ListResponse(list.getId(), list.getName(), list.getPosition()));
    }
}