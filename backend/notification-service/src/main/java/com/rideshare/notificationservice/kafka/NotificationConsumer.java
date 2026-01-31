package com.rideshare.notificationservice.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rideshare.common.events.PaymentCompletedEvent;
import com.rideshare.common.events.RideRequestedEvent;
import com.rideshare.common.events.RideAcceptedEvent;
import com.rideshare.common.events.RideCompletedEvent;
import com.rideshare.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @KafkaListener(topics = "ride.requested", groupId = "notification-group")
    public void handleRideRequested(String message) {
        try {
            RideRequestedEvent event = objectMapper.readValue(message, RideRequestedEvent.class);
            Long userId = Long.parseLong(event.getUserId());
            notificationService.sendNotification(
                    userId,
                    "RIDE_REQUESTED",
                    "Your ride request from " + event.getPickupLocation() + " to " + event.getDropLocation() + " has been created"
            );
            System.out.println("📢 Notification: Ride requested by user " + userId);
        } catch (Exception e) {
            System.err.println("❌ Failed to process ride requested notification: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "ride.accepted", groupId = "notification-group")
    public void handleRideAccepted(String message) {
        try {
            RideAcceptedEvent event = objectMapper.readValue(message, RideAcceptedEvent.class);
            Long userId = Long.parseLong(event.getUserId());
            notificationService.sendNotification(
                    userId,
                    "RIDE_ACCEPTED",
                    "Your ride " + event.getRideId() + " has been accepted by driver. Pickup: " + event.getPickupLocation()
            );
            System.out.println("📢 Notification: Ride " + event.getRideId() + " accepted for user " + userId);
        } catch (Exception e) {
            System.err.println("❌ Failed to process ride accepted notification: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "ride.completed", groupId = "notification-group")
    public void handleRideCompleted(String message) {
        try {
            RideCompletedEvent event = objectMapper.readValue(message, RideCompletedEvent.class);
            Long userId = Long.parseLong(event.getUserId());
            notificationService.sendNotification(
                    userId,
                    "RIDE_COMPLETED",
                    "Your ride " + event.getRideId() + " has been completed. Fare: $" + event.getFare()
            );
            System.out.println("📢 Notification: Ride completed for user " + userId + ", rideId: " + event.getRideId());
        } catch (Exception e) {
            System.err.println("❌ Failed to process ride completed notification: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "payment.completed", groupId = "notification-group")
    public void notifyUser(PaymentCompletedEvent event) {
        try {
            Long userId = Long.parseLong(event.getUserId());
            notificationService.sendNotification(
                    userId,
                    "PAYMENT_COMPLETED",
                    "Payment for ride " + event.getRideId() + " - Status: " + event.getStatus()
            );
            System.out.println(
                "📢 Notification sent for Ride " + event.getRideId() +
                " Payment Status: " + event.getStatus()
            );
        } catch (Exception e) {
            System.err.println("❌ Failed to process payment notification: " + e.getMessage());
        }
    }
}
