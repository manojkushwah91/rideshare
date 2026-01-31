package com.rideshare.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
            .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
            .exceptionHandling(handling -> handling
                .authenticationEntryPoint((exchange, ex) -> {
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete();
                })
            )
            .authorizeExchange(exchange -> exchange
                .pathMatchers("/api/auth/**", "/auth/**", "/eureka/**").permitAll()
                .pathMatchers("/drivers/**").hasRole("DRIVER")
                .pathMatchers("/rides/**").authenticated()
                .pathMatchers("/users/**").authenticated()
                .pathMatchers("/payments/**").authenticated()
                .pathMatchers("/notifications/**").authenticated()
                .anyExchange().authenticated()
            )
            .build();
    }
}