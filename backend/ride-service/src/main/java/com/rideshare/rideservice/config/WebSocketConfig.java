package com.rideshare.rideservice.config;

import com.rideshare.rideservice.handler.RideWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final RideWebSocketHandler rideWebSocketHandler;

    public WebSocketConfig(RideWebSocketHandler rideWebSocketHandler) {
        this.rideWebSocketHandler = rideWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(rideWebSocketHandler, "/kafka/{topic}")
                // PRODUCTION FIX: Explicitly allow your frontend origin only
                // Add your production domain here when you deploy (e.g., "https://myapp.com")
                .setAllowedOrigins("http://localhost:5173", "http://localhost:3000"); 
    }
}