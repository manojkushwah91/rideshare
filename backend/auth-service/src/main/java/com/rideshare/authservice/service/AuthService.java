package com.rideshare.authservice.service;

import com.rideshare.authservice.dto.*;
import com.rideshare.authservice.model.UserAuth;
import com.rideshare.authservice.repository.UserAuthRepository;
import lombok.RequiredArgsConstructor;
import com.rideshare.authservice.config.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAuthRepository repository;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final RestTemplate restTemplate; // ✅ This is now used below

    public AuthResponse register(RegisterRequest request) {
        // 1. Existing Logic: Check if email exists
        if (repository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // 2. Existing Logic: Create and Save UserAuth (Login credentials)
        UserAuth user = UserAuth.builder()
                .email(request.getEmail())
                .password(encoder.encode(request.getPassword()))
                .role(request.getRole())
                .createdAt(LocalDateTime.now())
                .enabled(true)
                .build();

        repository.save(user);

        // =================================================================================
        // 👇 NEW LOGIC START: Bridge to User-Service (Fixes "User Not Found" / Split Brain)
        // =================================================================================
        try {
            // Create the payload to send to User Service
            UserProfileRequest profileRequest = new UserProfileRequest(
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                request.getRole().name()
            );

            // Send POST request to User Service via Eureka (using service discovery)
            restTemplate.postForObject(
                "http://user-service/api/v1/users", 
                profileRequest, 
                Void.class
            );
            
        } catch (Exception e) {
            // Log the error but don't stop the registration entirely.
            // In production, you might want to rollback the transaction here.
            System.err.println("❌ FAILED to create User Profile in User-Service: " + e.getMessage());
        }
        // =================================================================================
        // 👆 NEW LOGIC END
        // =================================================================================


        // 3. Existing Logic: Generate JWT and Return
        String roleStr = user.getRole().name();
        String token = jwtUtil.generateToken(user.getEmail(), roleStr);

        return AuthResponse.builder()
                .email(user.getEmail())
                .role(roleStr)
                .token(token)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Existing Logic: Validation and Login
        UserAuth user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!encoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String roleStr = user.getRole().name();
        String token = jwtUtil.generateToken(user.getEmail(), roleStr);

        return AuthResponse.builder()
                .email(user.getEmail())
                .role(roleStr)
                .token(token)
                .build();
    }

    // ✅ Simple DTO to hold the data we send to User-Service
    @lombok.Data
    @lombok.AllArgsConstructor
    static class UserProfileRequest {
        private String name;
        private String email;
        private String phone;
        private String role;
    }
}