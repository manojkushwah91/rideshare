package com.rideshare.notificationservice.controller;

import com.rideshare.notificationservice.model.Notification;
import com.rideshare.notificationservice.service.NotificationService;
import com.rideshare.notificationservice.service.NotificationPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;
    private final NotificationPublisher notificationPublisher;

    @GetMapping("/user/{userId}")
    public List<Notification> getUserNotifications(@PathVariable Long userId) {
        return service.getUserNotifications(userId);
    }

    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id) {
        service.markAsRead(id);
    }

    /**
     * SSE endpoint for real-time notifications
     * Frontend connects to this endpoint and receives push notifications
     */
    @GetMapping(value = "/subscribe/{userEmail}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@PathVariable String userEmail) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE); // No timeout
        
        // Register the connection
        notificationPublisher.addConnection(userEmail, emitter);
        
        // Send initial connection message
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("Connected to notification service"));
        } catch (IOException e) {
            emitter.completeWithError(e);
            notificationPublisher.removeConnection(userEmail);
            return emitter;
        }
        
        return emitter;
    }
}
