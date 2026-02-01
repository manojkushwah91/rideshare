package com.rideshare.rideservice.service;

import com.rideshare.rideservice.dto.RideRequest;
import com.rideshare.rideservice.dto.RideResponse;
import com.rideshare.rideservice.model.Ride;
import com.rideshare.rideservice.repository.RideRepository;
import com.rideshare.rideservice.kafka.RideEventProducer;
import com.rideshare.common.events.RideRequestedEvent;
import com.rideshare.common.events.RideAcceptedEvent;
import com.rideshare.common.events.RideCompletedEvent;
import com.rideshare.common.enums.RideStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RideService {

    private final RideRepository rideRepository;
    private final RideEventProducer rideEventProducer;

    public RideResponse createRide(RideRequest request, String passengerEmail) {
        Ride ride = new Ride();
        ride.setUserId(request.getUserId());
        ride.setPassengerEmail(passengerEmail); // Store email for email-based queries
        ride.setDriverId(request.getDriverId());
        ride.setPickupLocation(request.getPickupLocation());
        ride.setDropLocation(request.getDropLocation());
        ride.setFare(request.getFare());
        ride.setStatus(RideStatus.REQUESTED.name());
        ride.setCreatedAt(LocalDateTime.now());
        ride.setUpdatedAt(LocalDateTime.now());

        Ride saved = rideRepository.save(ride);

        // Publish Kafka Event
        RideRequestedEvent event = new RideRequestedEvent(
                saved.getId().toString(),
                saved.getUserId().toString(),
                saved.getPickupLocation(),
                saved.getDropLocation()
        );

        rideEventProducer.publishRideRequested(event);

        return mapToResponse(saved);
    }

    public List<RideResponse> getRidesByUser(Long userId) {
        return rideRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<RideResponse> getRidesByDriver(Long driverId) {
        return rideRepository.findByDriverId(driverId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private RideResponse mapToResponse(Ride ride) {
        RideResponse response = new RideResponse();
        response.setRideId(ride.getId());
        response.setUserId(ride.getUserId());
        response.setDriverId(ride.getDriverId());
        response.setPickupLocation(ride.getPickupLocation());
        response.setDropLocation(ride.getDropLocation());
        response.setFare(ride.getFare());
        response.setStatus(ride.getStatus());
        response.setCreatedAt(ride.getCreatedAt());
        response.setUpdatedAt(ride.getUpdatedAt());
        return response;
    }

    // --- New method for publishing ride requests via Kafka ---
    public void publishRideRequestedEvent(Long userId, String pickup, String drop) {
        RideRequestedEvent event = new RideRequestedEvent(
                UUID.randomUUID().toString(),
                userId.toString(),
                pickup,
                drop
        );
        rideEventProducer.publishRideRequested(event);
    }

    public List<RideResponse> getAvailableRides() {
        return rideRepository.findByStatus(RideStatus.REQUESTED.name())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public RideResponse acceptRide(Long rideId, Long driverId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        if (!RideStatus.REQUESTED.name().equals(ride.getStatus())) {
            throw new RuntimeException("Ride is not available for acceptance");
        }

        ride.setDriverId(driverId);
        ride.setStatus(RideStatus.ACCEPTED.name());
        ride.setUpdatedAt(LocalDateTime.now());

        Ride saved = rideRepository.save(ride);

        // Publish ride accepted event for notifications
        RideAcceptedEvent acceptedEvent = new RideAcceptedEvent(
                saved.getId().toString(),
                saved.getUserId().toString(),
                saved.getDriverId().toString(),
                saved.getPickupLocation(),
                saved.getDropLocation()
        );
        rideEventProducer.publishRideAccepted(acceptedEvent);

        return mapToResponse(saved);
    }

    public RideResponse startRide(Long rideId, Long driverId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        if (!ride.getDriverId().equals(driverId)) {
            throw new RuntimeException("Unauthorized: This ride is not assigned to you");
        }

        if (!RideStatus.ACCEPTED.name().equals(ride.getStatus())) {
            throw new RuntimeException("Ride must be accepted before starting");
        }

        ride.setStatus(RideStatus.IN_PROGRESS.name());
        ride.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(rideRepository.save(ride));
    }

    public RideResponse completeRide(Long rideId, Long driverId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        if (!ride.getDriverId().equals(driverId)) {
            throw new RuntimeException("Unauthorized: This ride is not assigned to you");
        }

        if (!RideStatus.IN_PROGRESS.name().equals(ride.getStatus())) {
            throw new RuntimeException("Ride must be in progress before completing");
        }

        ride.setStatus(RideStatus.COMPLETED.name());
        ride.setUpdatedAt(LocalDateTime.now());

        Ride saved = rideRepository.save(ride);

        // Publish ride completed event for payment processing
        RideCompletedEvent event = new RideCompletedEvent(
                saved.getId().toString(),
                saved.getUserId().toString(),
                saved.getDriverId().toString(),
                saved.getFare() != null ? saved.getFare().doubleValue() : 0.0
        );
        rideEventProducer.publishRideCompleted(event);

        return mapToResponse(saved);
    }

    public RideResponse getRideById(Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        return mapToResponse(ride);
    }

    public List<RideResponse> getRidesByPassengerEmail(String email) {
        return rideRepository.findByPassengerEmail(email)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public RideResponse findActiveRideByPassenger(String email) {
        // Find rides that are not completed or cancelled for this passenger
        List<Ride> activeRides = rideRepository.findByPassengerEmail(email)
                .stream()
                .filter(ride -> !RideStatus.COMPLETED.name().equals(ride.getStatus()) 
                        && !RideStatus.CANCELLED.name().equals(ride.getStatus()))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())) // Most recent first
                .collect(Collectors.toList());
        
        if (activeRides.isEmpty()) {
            return null;
        }
        
        return mapToResponse(activeRides.get(0));
    }
}
