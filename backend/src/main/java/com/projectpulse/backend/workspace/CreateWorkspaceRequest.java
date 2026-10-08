package com.projectpulse.backend.workspace;

import jakarta.validation.constraints.NotBlank;

public record CreateWorkspaceRequest(@NotBlank String name, String description) {
}