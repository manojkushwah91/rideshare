package com.rideshare.paymentservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rideshare.common.events.PaymentCompletedEvent;
import com.rideshare.common.events.RideCompletedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PaymentEventListener {

    private final PaymentService paymentService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @KafkaListener(topics = "ride.completed", groupId = "payment-group")
    public void handleRideCompleted(String message) {

        try {
            RideCompletedEvent event =
                    objectMapper.readValue(message, RideCompletedEvent.class);

            // Convert String IDs to Long
            Long userId = Long.parseLong(event.getUserId());
            Long rideId = Long.parseLong(event.getRideId());
            Double fare = event.getFare() != null ? event.getFare() : 0.0;

            // Process payment
            paymentService.processWalletPayment(
                    userId,
                    rideId,
                    fare
            );

            // Publish payment completed event for notifications
            PaymentCompletedEvent paymentEvent = new PaymentCompletedEvent(
                    event.getRideId(),
                    event.getUserId(),
                    "SUCCESS"
            );
            kafkaTemplate.send("payment.completed", event.getRideId(), paymentEvent);

        } catch (Exception e) {
            System.err.println("❌ Payment failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
