package com.rideshare.paymentservice.controller;

import com.rideshare.paymentservice.dto.AddMoneyRequest;
import com.rideshare.paymentservice.model.PaymentTransaction;
import com.rideshare.paymentservice.repository.PaymentTransactionRepository;
import com.rideshare.paymentservice.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentTransactionRepository repository;
    private final WalletService walletService;

    @GetMapping
    public List<PaymentTransaction> getAllPayments() {
        return repository.findAll();
    }

    @GetMapping("/me/history")
    public List<PaymentTransaction> getMyPaymentHistory(@RequestHeader("X-USER-ID") String userIdStr) {
        try {
            Long userId = Long.parseLong(userIdStr);
            return repository.findByUserIdOrderByCreatedAtDesc(userId);
        } catch (NumberFormatException e) {
            // If X-USER-ID is email, try to get from user-service
            // For now, return empty list
            return List.of();
        }
    }

    @GetMapping("/rides/{rideId}")
    public PaymentTransaction getPaymentByRideId(@PathVariable Long rideId) {
        return repository.findAll().stream()
                .filter(t -> t.getRideId() != null && t.getRideId().equals(rideId))
                .findFirst()
                .orElse(null);
    }

    /**
     * Add money to user's wallet
     * This endpoint accepts amount and calls user-service to update wallet balance
     */
    @PostMapping("/add-money")
    public ResponseEntity<Map<String, Object>> addMoney(
            @RequestHeader("X-USER-EMAIL") String userEmail,
            @RequestBody AddMoneyRequest request) {
        try {
            PaymentTransaction transaction = walletService.addMoney(userEmail, request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Money added successfully");
            response.put("transaction", transaction);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
}
