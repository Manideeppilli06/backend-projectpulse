package com.projectpulse.backend.workspace;

public record MemberResponse(Long userId, String name, String email, WorkspaceRole role) {
}