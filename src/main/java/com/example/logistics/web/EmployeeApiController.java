package com.example.logistics.web;

import com.example.logistics.model.Employee;
import com.example.logistics.model.EmployeeType;
import com.example.logistics.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employee")
@RequiredArgsConstructor
public class EmployeeApiController {

    private final EmployeeService employeeService;

    // GET
    @GetMapping
    public List<Employee> getAllEmployees() {
        return employeeService.getAllEmployees();
    }

    @GetMapping("/{id}")
    public Employee getEmployeeById(@PathVariable long id) {
        return employeeService.getEmployeeById(id);
    }

    @GetMapping("/by-user/{userId}")
    public Employee getEmployeeByUserId(@PathVariable long userId) {
        return employeeService.getEmployeeByUserId(userId);
    }

    @GetMapping("/by-company/{companyId}")
    public List<Employee> getEmployeesByCompany(@PathVariable long companyId) {
        return employeeService.getEmployeesByCompany(companyId);
    }

    @GetMapping("/by-type/{type}")
    public List<Employee> getEmployeesByType(@PathVariable EmployeeType type) {
        return employeeService.getEmployeesByType(type);
    }

    // POST, PUT
    @PostMapping
    public Employee createEmployee(@RequestBody Employee employee) {
        return employeeService.createEmployee(employee);
    }

    @PutMapping("/{id}")
    public Employee updateEmployee(@RequestBody Employee employee, @PathVariable long id) {
        return employeeService.updateEmployee(id, employee);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteEmployee(@PathVariable long id) {
        employeeService.deleteEmployee(id);
    }
}
