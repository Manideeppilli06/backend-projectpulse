package com.projectpulse.backend.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class CommentDtos {

    private CommentDtos() {
    }

    public record CreateCommentRequest(@NotBlank @Size(max = 1000) String content) {
    }

    public record CommentResponse(Long id, String content, Long authorId,
                                  String authorName, Instant createdAt) {
    }
}