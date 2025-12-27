package com.rideshare.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .csrf(ServerHttpSecurity.CsrfSpec::disable) // Disable CSRF for Gateway
            .authorizeExchange(exchange -> exchange
                // Allow unauthenticated access to auth endpoints
                .pathMatchers("/auth/**").permitAll()
                // Allow discovery server endpoints if needed
                .pathMatchers("/eureka/**").permitAll()
                // Require authentication for everything else
                .anyExchange().authenticated() 
            );
        return http.build();
    }
}