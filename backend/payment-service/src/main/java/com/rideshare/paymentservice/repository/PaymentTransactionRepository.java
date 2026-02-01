package com.rideshare.paymentservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rideshare.paymentservice.model.PaymentTransaction;
import java.util.List;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    boolean existsByRideId(Long rideId);
    List<PaymentTransaction> findByUserId(Long userId);
    List<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);
}
