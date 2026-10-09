package com.projectpulse.backend.task;

import com.projectpulse.backend.board.Board;
import com.projectpulse.backend.board.BoardList;
import com.projectpulse.backend.board.BoardListRepository;
import com.projectpulse.backend.board.BoardRepository;
import com.projectpulse.backend.task.TaskDtos.*;
import com.projectpulse.backend.user.User;
import com.projectpulse.backend.user.UserRepository;
import com.projectpulse.backend.workspace.WorkspaceMemberRepository;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class TaskController {

    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;
    private final BoardListRepository listRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;

    public TaskController(TaskRepository taskRepository,
                          BoardRepository boardRepository,
                          BoardListRepository listRepository,
                          WorkspaceMemberRepository memberRepository,
                          UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.boardRepository = boardRepository;
        this.listRepository = listRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    // ---------- helpers ----------

    private User currentUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private boolean isMember(Long workspaceId, User user) {
        return memberRepository.existsByWorkspaceIdAndUserId(workspaceId, user.getId());
    }

    private Task accessibleTask(Long taskId, User me) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return null;
        }
        Long workspaceId = task.getList().getBoard().getWorkspace().getId();
        return isMember(workspaceId, me) ? task : null;
    }

    private ResponseEntity<?> notFound(String message) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", message));
    }

    private ResponseEntity<?> badRequest(String message) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", message));
    }

    private TaskResponse toResponse(Task t) {
        User a = t.getAssignee();
        return new TaskResponse(
                t.getId(),
                t.getTitle(),
                t.getDescription(),
                t.getPriority(),
                t.getDueDate(),
                t.getList().getId(),
                t.getPosition(),
                a == null ? null : a.getId(),
                a == null ? null : a.getName());
    }

    private void renumber(List<Task> tasks) {
        for (int i = 0; i < tasks.size(); i++) {
            tasks.get(i).setPosition(i);
        }
        taskRepository.saveAll(tasks);
    }

    // ---------- endpoints ----------

    @PostMapping("/lists/{listId}/tasks")
    @Transactional
    public ResponseEntity<?> createTask(@PathVariable Long listId,
                                        @Valid @RequestBody CreateTaskRequest req,
                                        Authentication auth) {
        User me = currentUser(auth);
        BoardList list = listRepository.findById(listId).orElse(null);
        if (list == null) {
            return notFound("List not found");
        }
        Long workspaceId = list.getBoard().getWorkspace().getId();
        if (!isMember(workspaceId, me)) {
            return notFound("List not found");
        }

        User assignee = null;
        if (req.assigneeId() != null) {
            assignee = userRepository.findById(req.assigneeId()).orElse(null);
            if (assignee == null || !isMember(workspaceId, assignee)) {
                return badRequest("Assignee must be a member of this workspace");
            }
        }

        Task task = taskRepository.save(Task.builder()
                .title(req.title().trim())
                .description(req.description())
                .priority(req.priority() == null ? Priority.MEDIUM : req.priority())
                .dueDate(req.dueDate())
                .position((int) taskRepository.countByListId(listId))
                .list(list)
                .assignee(assignee)
                .createdBy(me)
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(task));
    }

    @GetMapping("/boards/{boardId}/tasks")
    @Transactional(readOnly = true)
    public ResponseEntity<?> boardTasks(@PathVariable Long boardId, Authentication auth) {
        User me = currentUser(auth);
        Board board = boardRepository.findById(boardId).orElse(null);
        if (board == null || !isMember(board.getWorkspace().getId(), me)) {
            return notFound("Board not found");
        }

        List<TaskResponse> tasks = taskRepository.findByListBoardIdOrderByPositionAsc(boardId)
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(tasks);
    }

    @PutMapping("/tasks/{taskId}")
    @Transactional
    public ResponseEntity<?> updateTask(@PathVariable Long taskId,
                                        @Valid @RequestBody UpdateTaskRequest req,
                                        Authentication auth) {
        User me = currentUser(auth);
        Task task = accessibleTask(taskId, me);
        if (task == null) {
            return notFound("Task not found");
        }
        Long workspaceId = task.getList().getBoard().getWorkspace().getId();

        User assignee = null;
        if (req.assigneeId() != null) {
            assignee = userRepository.findById(req.assigneeId()).orElse(null);
            if (assignee == null || !isMember(workspaceId, assignee)) {
                return badRequest("Assignee must be a member of this workspace");
            }
        }

        task.setTitle(req.title().trim());
        task.setDescription(req.description());
        if (req.priority() != null) {
            task.setPriority(req.priority());
        }
        task.setDueDate(req.dueDate());
        task.setAssignee(assignee);

        return ResponseEntity.ok(toResponse(taskRepository.save(task)));
    }

    @PatchMapping("/tasks/{taskId}/move")
    @Transactional
    public ResponseEntity<?> moveTask(@PathVariable Long taskId,
                                      @Valid @RequestBody MoveTaskRequest req,
                                      Authentication auth) {
        User me = currentUser(auth);
        Task task = accessibleTask(taskId, me);
        if (task == null) {
            return notFound("Task not found");
        }

        BoardList target = listRepository.findById(req.listId()).orElse(null);
        BoardList source = task.getList();
        if (target == null || !target.getBoard().getId().equals(source.getBoard().getId())) {
            return badRequest("Target list must be on the same board");
        }

        List<Task> targetTasks = new ArrayList<>(
                taskRepository.findByListIdOrderByPositionAsc(target.getId()));
        targetTasks.removeIf(t -> t.getId().equals(task.getId()));

        int index = req.position() == null
                ? targetTasks.size()
                : Math.max(0, Math.min(req.position(), targetTasks.size()));
        targetTasks.add(index, task);
        task.setList(target);
        renumber(targetTasks);

        if (!source.getId().equals(target.getId())) {
            List<Task> sourceTasks = new ArrayList<>(
                    taskRepository.findByListIdOrderByPositionAsc(source.getId()));
            sourceTasks.removeIf(t -> t.getId().equals(task.getId()));
            renumber(sourceTasks);
        }

        return ResponseEntity.ok(toResponse(task));
    }

    @DeleteMapping("/tasks/{taskId}")
    @Transactional
    public ResponseEntity<?> deleteTask(@PathVariable Long taskId, Authentication auth) {
        User me = currentUser(auth);
        Task task = accessibleTask(taskId, me);
        if (task == null) {
            return notFound("Task not found");
        }
        Long listId = task.getList().getId();
        taskRepository.delete(task);
        taskRepository.flush();
        renumber(new ArrayList<>(taskRepository.findByListIdOrderByPositionAsc(listId)));
        return ResponseEntity.noContent().build();
    }
}