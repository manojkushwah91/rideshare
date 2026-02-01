package com.rideshare.common.events;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RideAcceptedEvent {
    private String rideId;
    private String userId;
    private String driverId;
    private String pickupLocation;
    private String dropLocation;
}

