package com.projectpulse.backend.workspace;

import com.projectpulse.backend.user.User;
import com.projectpulse.backend.user.UserRepository;
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
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;

    public WorkspaceController(WorkspaceRepository workspaceRepository,
                               WorkspaceMemberRepository memberRepository,
                               UserRepository userRepository) {
        this.workspaceRepository = workspaceRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    private User currentUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<WorkspaceResponse> create(@Valid @RequestBody CreateWorkspaceRequest req,
                                                    Authentication auth) {
        User user = currentUser(auth);

        Workspace workspace = workspaceRepository.save(Workspace.builder()
                .name(req.name().trim())
                .description(req.description())
                .owner(user)
                .build());

        memberRepository.save(WorkspaceMember.builder()
                .workspace(workspace)
                .user(user)
                .role(WorkspaceRole.OWNER)
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(
                new WorkspaceResponse(workspace.getId(), workspace.getName(),
                        workspace.getDescription(), WorkspaceRole.OWNER));
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<WorkspaceResponse> mine(Authentication auth) {
        User user = currentUser(auth);
        return memberRepository.findAllForUser(user.getId()).stream()
                .map(m -> new WorkspaceResponse(
                        m.getWorkspace().getId(),
                        m.getWorkspace().getName(),
                        m.getWorkspace().getDescription(),
                        m.getRole()))
                .toList();
    }

    @PostMapping("/{id}/members")
    @Transactional
    public ResponseEntity<?> addMember(@PathVariable Long id,
                                       @Valid @RequestBody AddMemberRequest req,
                                       Authentication auth) {
        User me = currentUser(auth);

        WorkspaceMember myMembership = memberRepository
                .findByWorkspaceIdAndUserId(id, me.getId()).orElse(null);
        if (myMembership == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Workspace not found"));
        }
        if (myMembership.getRole() != WorkspaceRole.OWNER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only the owner can add members"));
        }

        User invitee = userRepository.findByEmail(req.email().trim().toLowerCase()).orElse(null);
        if (invitee == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No user with that email"));
        }
        if (memberRepository.existsByWorkspaceIdAndUserId(id, invitee.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "User is already a member"));
        }

        memberRepository.save(WorkspaceMember.builder()
                .workspace(myMembership.getWorkspace())
                .user(invitee)
                .role(WorkspaceRole.MEMBER)
                .build());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Member added", "email", invitee.getEmail()));
    }

    @GetMapping("/{id}/members")
    @Transactional(readOnly = true)
    public ResponseEntity<?> members(@PathVariable Long id, Authentication auth) {
        User me = currentUser(auth);
        if (!memberRepository.existsByWorkspaceIdAndUserId(id, me.getId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Workspace not found"));
        }

        List<MemberResponse> members = memberRepository.findAllForWorkspace(id).stream()
                .map(m -> new MemberResponse(
                        m.getUser().getId(),
                        m.getUser().getName(),
                        m.getUser().getEmail(),
                        m.getRole()))
                .toList();
        return ResponseEntity.ok(members);
    }
}