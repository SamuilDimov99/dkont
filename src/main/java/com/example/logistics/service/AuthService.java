package com.example.logistics.service;

import com.example.logistics.model.EmployeeType;
import com.example.logistics.model.Role;

public interface AuthService {

    AuthSession login(String username, String password);

    AuthSession registerClient(String username, String password, String email);

    record AuthSession(
            long userId,
            String username,
            String email,
            Role role,
            Long clientId,
            Long employeeId,
            EmployeeType employeeType,
            Long officeId) {}
}
