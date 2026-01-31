package com.rideshare.paymentservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rideshare.paymentservice.model.PaymentTransaction;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    boolean existsByRideId(Long rideId);
}
