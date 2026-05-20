package com.example.logistics.service;

import com.example.logistics.model.Employee;
import com.example.logistics.model.EmployeeType;

import java.util.List;

public interface EmployeeService {
    List<Employee> getAllEmployees();
    List<Employee> getEmployeesByCompany(Long companyId);
    List<Employee> getEmployeesByType(EmployeeType type);
    Employee getEmployeeById(Long id);
    Employee getEmployeeByUserId(Long userId);
    Employee createEmployee(Employee employee);
    Employee updateEmployee(Long id, Employee employee);
    void deleteEmployee(Long id);
}