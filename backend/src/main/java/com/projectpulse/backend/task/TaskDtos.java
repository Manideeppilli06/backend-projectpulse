package com.projectpulse.backend.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public final class TaskDtos {

    private TaskDtos() {
    }

    public record CreateTaskRequest(
            @NotBlank String title,
            String description,
            Priority priority,
            LocalDate dueDate,
            Long assigneeId) {
    }

    public record UpdateTaskRequest(
            @NotBlank String title,
            String description,
            Priority priority,
            LocalDate dueDate,
            Long assigneeId) {
    }

    public record MoveTaskRequest(@NotNull Long listId, Integer position) {
    }

    public record TaskResponse(
            Long id,
            String title,
            String description,
            Priority priority,
            LocalDate dueDate,
            Long listId,
            int position,
            Long assigneeId,
            String assigneeName) {
    }
}