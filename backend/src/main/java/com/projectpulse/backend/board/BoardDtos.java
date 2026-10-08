package com.projectpulse.backend.board;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public final class BoardDtos {

    private BoardDtos() {
    }

    public record CreateBoardRequest(@NotBlank String name) {
    }

    public record CreateListRequest(@NotBlank String name) {
    }

    public record BoardResponse(Long id, String name, Long workspaceId) {
    }

    public record ListResponse(Long id, String name, int position) {
    }

    public record BoardDetailResponse(Long id, String name, Long workspaceId, List<ListResponse> lists) {
    }
}