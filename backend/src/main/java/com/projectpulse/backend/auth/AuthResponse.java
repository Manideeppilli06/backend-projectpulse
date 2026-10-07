package com.projectpulse.backend.auth;

public record AuthResponse(String token, String name, String email) {
}