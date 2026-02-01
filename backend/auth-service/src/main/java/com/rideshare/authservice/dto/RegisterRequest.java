package com.rideshare.authservice.dto;

import com.rideshare.authservice.model.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String phone;
    private Role role;
}
