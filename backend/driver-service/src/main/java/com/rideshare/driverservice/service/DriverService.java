package com.rideshare.driverservice.service;

import com.rideshare.driverservice.dto.DriverStatusRequest;
import com.rideshare.driverservice.dto.VehicleRequest;
import com.rideshare.driverservice.model.*;
import com.rideshare.driverservice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverProfileRepository driverRepo;
    private final VehicleRepository vehicleRepo;
    private final RestTemplate restTemplate;

    public DriverProfile getProfile(String email) {
        return driverRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
    }

    public DriverProfile updateStatus(String email, DriverStatusRequest request) {
        DriverProfile driver = getProfile(email);

        driver.setStatus(request.getStatus());
        driver.setUpdatedAt(LocalDateTime.now());

        return driverRepo.save(driver);
    }

    public Vehicle addOrUpdateVehicle(String email, VehicleRequest request) {
        DriverProfile driver = getProfile(email);

        Vehicle vehicle = vehicleRepo.findByDriverId(driver.getId())
                .orElse(Vehicle.builder().driverId(driver.getId()).build());

        vehicle.setVehicleNumber(request.getVehicleNumber());
        vehicle.setType(request.getType());
        vehicle.setModel(request.getModel());

        return vehicleRepo.save(vehicle);
    }

    public List<DriverProfile> findAvailableDrivers() {
        return driverRepo.findByStatus(DriverStatus.ONLINE);
    }

    public Object getAvailableRides() {
        try {
            ResponseEntity<List> response = restTemplate.exchange(
                    "http://ride-service/api/rides/available",
                    HttpMethod.GET,
                    null,
                    List.class
            );
            return response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch available rides: " + e.getMessage());
        }
    }

    public Object acceptRide(Long rideId, Long driverId) {
        try {
            // Update driver status to ON_RIDE
            DriverProfile driver = driverRepo.findById(driverId)
                    .orElseThrow(() -> new RuntimeException("Driver not found"));
            driver.setStatus(DriverStatus.ON_RIDE);
            driverRepo.save(driver);

            // Call ride service to accept the ride
            // The ride service expects X-USER-ID header
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("X-USER-ID", driverId.toString());
            org.springframework.http.HttpEntity<?> entity = new org.springframework.http.HttpEntity<>(headers);

            String url = "http://ride-service/api/rides/" + rideId + "/accept";
            ResponseEntity<Object> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    entity,
                    Object.class
            );
            return response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("Failed to accept ride: " + e.getMessage());
        }
    }
}
