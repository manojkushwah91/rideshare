package com.rideshare.apigateway.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;

@Component
public class JwtUtil {

    // ✅ EXACT MATCH with Auth Service
    public static final String SECRET = "rideshare-secret-key-rideshare-secret-key-must-be-long";

    public void validateToken(final String token) {
        Jwts.parserBuilder().setSigningKey(getSignKey()).build().parseClaimsJws(token);
    }

    public String extractUsername(String token) {
        return Jwts.parserBuilder().setSigningKey(getSignKey()).build().parseClaimsJws(token).getBody().getSubject();
    }

    private Key getSignKey() {
        // ✅ CHANGED: Uses .getBytes() just like your Auth Service
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }
}