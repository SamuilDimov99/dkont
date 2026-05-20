package com.example.logistics.service.impl;

import com.example.logistics.model.Employee;
import com.example.logistics.model.EmployeeType;
import com.example.logistics.repo.CompanyRepository;
import com.example.logistics.repo.EmployeeRepository;
import com.example.logistics.repo.OfficeRepository;
import com.example.logistics.repo.UserRepository;
import com.example.logistics.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final OfficeRepository officeRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Employee> getEmployeesByCompany(Long companyId) {
        return employeeRepository.findByCompanyId(companyId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Employee> getEmployeesByType(EmployeeType type) {
        return employeeRepository.findByEmployeeType(type);
    }

    @Override
    @Transactional(readOnly = true)
    public Employee getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id).orElse(null);
        if (employee == null) throw new IllegalArgumentException("Employee not found with id: " + id);
        return employee;
    }

    @Override
    @Transactional(readOnly = true)
    public Employee getEmployeeByUserId(Long userId) {
        Employee employee = employeeRepository.findByUserId(userId);
        if (employee == null) throw new IllegalArgumentException("Employee not found for user id: " + userId);
        return employee;
    }

    @Override
    public Employee createEmployee(Employee employee) {
        if (employee.getUser() == null || employee.getUser().getId() == null) throw new IllegalArgumentException("User is required");
        if (employee.getEmployeeType() == null) throw new IllegalArgumentException("Employee type is required");
        attachRelations(employee);
        Employee saved = employeeRepository.save(employee);
        return getEmployeeById(saved.getId());
    }

    @Override
    public Employee updateEmployee(Long id, Employee updated) {
        Employee existing = getEmployeeById(id);
        if (updated.getEmployeeType() == null) throw new IllegalArgumentException("Employee type is required");
        existing.setEmployeeType(updated.getEmployeeType());
        attachRelations(updated);
        existing.setOffice(updated.getOffice());
        existing.setCompany(updated.getCompany());
        Employee saved = employeeRepository.save(existing);
        return getEmployeeById(saved.getId());
    }

    private void attachRelations(Employee employee) {
        if (employee.getCompany() == null || employee.getCompany().getId() == null) throw new IllegalArgumentException("Company is required");

        employee.setUser(userRepository.findById(employee.getUser().getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + employee.getUser().getId())));
        employee.setCompany(companyRepository.findById(employee.getCompany().getId())
                .orElseThrow(() -> new IllegalArgumentException("Company not found with id: " + employee.getCompany().getId())));

        if (employee.getOffice() != null && employee.getOffice().getId() != null) {
            employee.setOffice(officeRepository.findById(employee.getOffice().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Office not found with id: " + employee.getOffice().getId())));
        } else {
            employee.setOffice(null);
        }
    }

    @Override
    public void deleteEmployee(Long id) {
        employeeRepository.deleteById(id);
    }
}
