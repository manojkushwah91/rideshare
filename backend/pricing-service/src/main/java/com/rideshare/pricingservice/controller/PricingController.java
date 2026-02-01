package com.rideshare.pricingservice.controller;

import com.rideshare.pricingservice.dto.*;
import com.rideshare.pricingservice.service.PricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pricing")
@RequiredArgsConstructor
public class PricingController {

    private final PricingService pricingService;

    @PostMapping("/estimate")
    public FareResponse estimateFare(@RequestBody FareRequest request) {
        return pricingService.calculateFare(request);
    }

    /**
     * Calculate fare - accepts either FareRequest (with distance/time) or LocationFareRequest (with locations)
     * Frontend should send LocationFareRequest with pickupLocation and dropoffLocation
     */
    @PostMapping("/calculate")
    public ResponseEntity<FareResponse> calculateFare(@RequestBody LocationFareRequest locationRequest) {
        // If locations are provided, calculate from locations
        if (locationRequest.getPickupLocation() != null && locationRequest.getDropoffLocation() != null) {
            FareResponse response = pricingService.calculateFareFromLocations(
                    locationRequest.getPickupLocation(),
                    locationRequest.getDropoffLocation(),
                    locationRequest.getRideId()
            );
            return ResponseEntity.ok(response);
        }
        
        // Otherwise, try to parse as FareRequest
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    /**
     * Legacy endpoint for FareRequest with distance and time
     */
    @PostMapping("/calculate-legacy")
    public FareResponse calculateFareLegacy(@RequestBody FareRequest request) {
        return pricingService.calculateFare(request);
    }
}
