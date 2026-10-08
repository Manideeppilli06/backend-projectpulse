package com.projectpulse.backend.workspace;

public record WorkspaceResponse(Long id, String name, String description, WorkspaceRole role) {
}