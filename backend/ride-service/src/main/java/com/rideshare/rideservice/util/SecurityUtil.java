package com.rideshare.rideservice.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Utility class to extract user information from request headers.
 * In microservices architecture, the API Gateway validates JWT and forwards
 * user information via headers (X-USER-EMAIL, X-USER-ID, X-USER-ROLE).
 * 
 * Note: For direct service-to-service calls or if Spring Security is configured,
 * this can be extended to also check SecurityContext.
 */
public class SecurityUtil {

    /**
     * Extract user email/username from request headers.
     * First tries X-USER-EMAIL header (set by API Gateway), then falls back to Authorization header.
     * The API Gateway sets X-USER-EMAIL header after JWT validation.
     */
    public static String getCurrentUserEmail() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            // First try X-USER-EMAIL header (set by API Gateway)
            String email = request.getHeader("X-USER-EMAIL");
            if (email != null && !email.isEmpty()) {
                return email;
            }
            // Fallback: try to extract from Authorization header
            email = extractEmailFromAuthorizationHeader(request);
            if (email != null && !email.isEmpty()) {
                return email;
            }
        }
        throw new RuntimeException("User email not found in request headers");
    }

    /**
     * Helper method to extract email from Authorization header (JWT token).
     * This is a fallback when X-USER-EMAIL header is not available.
     */
    private static String extractEmailFromAuthorizationHeader(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                // Simple JWT parsing - extract subject (email) from token
                // Note: This is a basic implementation. In production, you should validate the token signature.
                String[] parts = token.split("\\.");
                if (parts.length >= 2) {
                    // Decode the payload (second part)
                    String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                    // Extract email from "sub" field in JSON payload
                    // This is a simplified parser - for production use a proper JWT library
                    int subIndex = payload.indexOf("\"sub\":\"");
                    if (subIndex != -1) {
                        int start = subIndex + 7;
                        int end = payload.indexOf("\"", start);
                        if (end != -1) {
                            return payload.substring(start, end);
                        }
                    }
                }
            } catch (Exception e) {
                // If parsing fails, return null
                return null;
            }
        }
        return null;
    }

    /**
     * Extract user ID from request headers.
     * The API Gateway sets X-USER-ID header after JWT validation.
     */
    public static String getCurrentUserId() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String userId = request.getHeader("X-USER-ID");
            if (userId != null && !userId.isEmpty()) {
                return userId;
            }
        }
        throw new RuntimeException("User ID not found in request headers");
    }

    /**
     * Extract user role from request headers.
     * The API Gateway sets X-USER-ROLE header after JWT validation.
     */
    public static String getCurrentUserRole() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String role = request.getHeader("X-USER-ROLE");
            if (role != null && !role.isEmpty()) {
                return role;
            }
        }
        return "USER"; // Default role
    }
}

