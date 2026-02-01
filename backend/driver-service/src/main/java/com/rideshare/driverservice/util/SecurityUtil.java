package com.rideshare.driverservice.util;

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
     * The API Gateway sets X-USER-EMAIL header after JWT validation.
     */
    public static String getCurrentUserEmail() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String email = request.getHeader("X-USER-EMAIL");
            if (email != null && !email.isEmpty()) {
                return email;
            }
        }
        throw new RuntimeException("User email not found in request headers");
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

