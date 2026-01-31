package com.rideshare.driverservice.controller;

import com.rideshare.driverservice.dto.*;
import com.rideshare.driverservice.model.*;
import com.rideshare.driverservice.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;

    @GetMapping("/me")
    public DriverProfile getProfile(@RequestHeader("X-USER-EMAIL") String email) {
        return driverService.getProfile(email);
    }

    @PutMapping("/me/status")
    public DriverProfile updateStatus(
            @RequestHeader("X-USER-EMAIL") String email,
            @RequestBody DriverStatusRequest request) {
        return driverService.updateStatus(email, request);
    }

    @PostMapping("/me/vehicle")
    public Vehicle addVehicle(
            @RequestHeader("X-USER-EMAIL") String email,
            @RequestBody VehicleRequest request) {
        return driverService.addOrUpdateVehicle(email, request);
    }

    // Internal call by Ride Service
    @GetMapping("/available")
    public List<DriverProfile> availableDrivers() {
        return driverService.findAvailableDrivers();
    }

    @GetMapping("/rides/available")
    public Object getAvailableRides() {
        return driverService.getAvailableRides();
    }

    @PutMapping("/rides/{rideId}/accept")
    public Object acceptRide(
            @PathVariable Long rideId,
            @RequestHeader("X-USER-ID") String driverIdStr) {
        Long driverId = Long.parseLong(driverIdStr);
        return driverService.acceptRide(rideId, driverId);
    }
}
