package com.rideshare.apigateway.filter;

import com.rideshare.apigateway.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    @Autowired
    private JwtUtil jwtUtil;

    public AuthenticationFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            // 1. Check if header is present
            if (!exchange.getRequest().getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                throw new RuntimeException("Missing Authorization Header");
            }

            String authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION).get(0);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                // 2. Remove "Bearer " prefix
                authHeader = authHeader.substring(7);
            }

            try {
                // 3. Validate Token
                jwtUtil.validateToken(authHeader);
                
                // 4. Extract Email
                String userEmail = jwtUtil.extractUsername(authHeader);

                // 5. Mutate Request: Add the "Magic Header"
                ServerWebExchange modifiedExchange = exchange.mutate()
                        .request(builder -> builder.header("X-USER-EMAIL", userEmail)) // <-- The Magic happens here!
                        .build();

                return chain.filter(modifiedExchange);

            } catch (Exception e) {
                // Token invalid
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
        };
    }

    public static class Config {
        // Configuration properties can go here
    }
}