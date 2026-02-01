package com.rideshare.rideservice.handler;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RideWebSocketHandler extends TextWebSocketHandler {

    // Store active sessions to push updates later (e.g., when a driver accepts)
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // The Gateway has already checked the token, so we trust this connection.
        String topic = getTopicFromPath(session);
        sessions.put(session.getId(), session);
        System.out.println("✅ WebSocket Connected: " + session.getId() + " to topic: " + topic);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session.getId());
        System.out.println("❌ WebSocket Disconnected: " + session.getId());
    }

    private String getTopicFromPath(WebSocketSession session) {
        // Extracts "ride-updates" from path /kafka/ride-updates
        String path = session.getUri().getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }
}