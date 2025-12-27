package com.rideshare.authservice.service;

import com.rideshare.authservice.dto.*;
import com.rideshare.authservice.model.UserAuth;
import com.rideshare.authservice.repository.UserAuthRepository;
import lombok.RequiredArgsConstructor;
import com.rideshare.authservice.config.JwtUtil;
// CHANGE 1: Import the Interface, not the Class
import org.springframework.security.crypto.password.PasswordEncoder; 
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAuthRepository repository;
    // CHANGE 2: Use the Interface type here
    private final PasswordEncoder encoder; 
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        if (repository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        UserAuth user = UserAuth.builder()
                .email(request.getEmail())
                .password(encoder.encode(request.getPassword())) // Works exactly the same
                .role(request.getRole())
                .createdAt(LocalDateTime.now())
                .enabled(true)
                .build();

        repository.save(user);

        // Convert Enum to String for JwtUtil
        String roleStr = user.getRole().name();
        String token = jwtUtil.generateToken(user.getEmail(), roleStr);

        return AuthResponse.builder()
                .email(user.getEmail())
                .role(roleStr)
                .token(token)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        UserAuth user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!encoder.matches(request.getPassword(), user.getPassword())) { // Works exactly the same
            throw new RuntimeException("Invalid credentials");
        }

        // Convert Enum to String for JwtUtil
        String roleStr = user.getRole().name();
        String token = jwtUtil.generateToken(user.getEmail(), roleStr);

        return AuthResponse.builder()
                .email(user.getEmail())
                .role(roleStr)
                .token(token)
                .build();
    }
}