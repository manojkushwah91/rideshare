package com.rideshare.rideservice.controller;

import com.rideshare.rideservice.dto.RideRequest;
import com.rideshare.rideservice.dto.RideResponse;
import com.rideshare.rideservice.service.RideService;
import com.rideshare.rideservice.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rides")
@RequiredArgsConstructor
public class RideController {

    private final RideService rideService;

    @PostMapping
    public RideResponse createRide(
            @RequestBody RideRequest request,
            @RequestHeader(value = "X-USER-EMAIL", required = false) String emailHeader) {
        // Extract email from JWT token header
        String email = emailHeader != null ? emailHeader : SecurityUtil.getCurrentUserEmail();
        return rideService.createRide(request, email);
    }

    @GetMapping("/user/{userId}")
    public List<RideResponse> getUserRides(@PathVariable Long userId) {
        return rideService.getRidesByUser(userId);
    }

    @GetMapping("/my-rides")
    public List<RideResponse> getMyRides(@RequestHeader(value = "X-USER-EMAIL", required = false) String emailHeader) {
        // Extract email from JWT token header
        String email = emailHeader != null ? emailHeader : SecurityUtil.getCurrentUserEmail();
        // Use email-based query to find rides for this specific user
        return rideService.getRidesByPassengerEmail(email);
    }

    @GetMapping("/active")
    public ResponseEntity<RideResponse> getActiveRide(@RequestHeader(value = "X-USER-EMAIL", required = false) String emailHeader) {
        // Extract email from JWT token header
        String email = emailHeader != null ? emailHeader : SecurityUtil.getCurrentUserEmail();
        // Find active ride for this specific user
        RideResponse activeRide = rideService.findActiveRideByPassenger(email);
        if (activeRide == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(activeRide);
    }

    @GetMapping("/driver/{driverId}")
    public List<RideResponse> getDriverRides(@PathVariable Long driverId) {
        return rideService.getRidesByDriver(driverId);
    }

    // --- New Kafka booking endpoint ---
    @PostMapping("/book")
    public ResponseEntity<String> bookRide(
            @RequestBody RideRequest dto,
            @RequestHeader(value = "X-USER-ID", required = false) String userIdHeader) {
        
        // Use userId from header if available, otherwise from request body
        Long userId = dto.getUserId() != null ? dto.getUserId() : 1L; // Placeholder
        rideService.publishRideRequestedEvent(userId, dto.getPickupLocation(), dto.getDropLocation());
        return ResponseEntity.ok("Ride Requested");
    }

    @GetMapping("/available")
    public List<RideResponse> getAvailableRides() {
        return rideService.getAvailableRides();
    }

    @GetMapping("/{rideId}")
    public RideResponse getRideById(@PathVariable Long rideId) {
        return rideService.getRideById(rideId);
    }

    @PutMapping("/{rideId}/accept")
    public RideResponse acceptRide(
            @PathVariable Long rideId,
            @RequestHeader("X-USER-ID") String driverIdStr) {
        Long driverId = Long.parseLong(driverIdStr);
        return rideService.acceptRide(rideId, driverId);
    }

    @PutMapping("/{rideId}/start")
    public RideResponse startRide(
            @PathVariable Long rideId,
            @RequestHeader("X-USER-ID") String driverIdStr) {
        Long driverId = Long.parseLong(driverIdStr);
        return rideService.startRide(rideId, driverId);
    }

    @PutMapping("/{rideId}/complete")
    public RideResponse completeRide(
            @PathVariable Long rideId,
            @RequestHeader("X-USER-ID") String driverIdStr) {
        Long driverId = Long.parseLong(driverIdStr);
        return rideService.completeRide(rideId, driverId);
    }
}
