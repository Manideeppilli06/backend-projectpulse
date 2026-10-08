package com.projectpulse.backend.comment;

import com.projectpulse.backend.comment.CommentDtos.*;
import com.projectpulse.backend.task.Task;
import com.projectpulse.backend.task.TaskRepository;
import com.projectpulse.backend.user.User;
import com.projectpulse.backend.user.UserRepository;
import com.projectpulse.backend.workspace.WorkspaceMemberRepository;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class CommentController {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;

    public CommentController(CommentRepository commentRepository,
                             TaskRepository taskRepository,
                             WorkspaceMemberRepository memberRepository,
                             UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.taskRepository = taskRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    private User currentUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private boolean isMemberOfTaskWorkspace(Task task, User user) {
        Long workspaceId = task.getList().getBoard().getWorkspace().getId();
        return memberRepository.existsByWorkspaceIdAndUserId(workspaceId, user.getId());
    }

    private ResponseEntity<?> notFound(String message) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", message));
    }

    private CommentResponse toResponse(Comment c) {
        return new CommentResponse(c.getId(), c.getContent(), c.getAuthor().getId(),
                c.getAuthor().getName(), c.getCreatedAt());
    }

    @PostMapping("/tasks/{taskId}/comments")
    @Transactional
    public ResponseEntity<?> add(@PathVariable Long taskId,
                                 @Valid @RequestBody CreateCommentRequest req,
                                 Authentication auth) {
        User me = currentUser(auth);
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null || !isMemberOfTaskWorkspace(task, me)) {
            return notFound("Task not found");
        }

        Comment comment = commentRepository.save(Comment.builder()
                .content(req.content().trim())
                .task(task)
                .author(me)
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(comment));
    }

    @GetMapping("/tasks/{taskId}/comments")
    @Transactional(readOnly = true)
    public ResponseEntity<?> list(@PathVariable Long taskId, Authentication auth) {
        User me = currentUser(auth);
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null || !isMemberOfTaskWorkspace(task, me)) {
            return notFound("Task not found");
        }

        List<CommentResponse> comments = commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId)
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(comments);
    }

    @DeleteMapping("/comments/{commentId}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long commentId, Authentication auth) {
        User me = currentUser(auth);
        Comment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null || !isMemberOfTaskWorkspace(comment.getTask(), me)) {
            return notFound("Comment not found");
        }
        if (!comment.getAuthor().getId().equals(me.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only delete your own comments"));
        }
        commentRepository.delete(comment);
        return ResponseEntity.noContent().build();
    }
}