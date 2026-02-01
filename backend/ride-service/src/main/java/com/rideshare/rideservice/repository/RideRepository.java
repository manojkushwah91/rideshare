package com.rideshare.rideservice.repository;

import com.rideshare.rideservice.model.Ride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RideRepository extends JpaRepository<Ride, Long> {
    List<Ride> findByUserId(Long userId);
    List<Ride> findByPassengerEmail(String passengerEmail);
    List<Ride> findByDriverId(Long driverId);
    List<Ride> findByStatus(String status);
    List<Ride> findByPassengerEmailAndStatus(String passengerEmail, String status);
}
