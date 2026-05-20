package com.example.logistics.repo;

import com.example.logistics.model.Employee;
import com.example.logistics.model.EmployeeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    @Override
    @EntityGraph(attributePaths = {"user", "company", "office"})
    List<Employee> findAll();

    @Override
    @EntityGraph(attributePaths = {"user", "company", "office"})
    Optional<Employee> findById(Long id);

    @EntityGraph(attributePaths = {"user", "company", "office"})
    @Query("SELECT e FROM Employee e WHERE e.user.id = :userId")
    Employee findByUserId(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"user", "company", "office"})
    @Query("SELECT e FROM Employee e WHERE e.company.id = :companyId")
    List<Employee> findByCompanyId(@Param("companyId") Long companyId);

    @EntityGraph(attributePaths = {"user", "company", "office"})
    @Query("SELECT e FROM Employee e WHERE e.office.id = :officeId")
    List<Employee> findByOfficeId(@Param("officeId") Long officeId);

    @EntityGraph(attributePaths = {"user", "company", "office"})
    List<Employee> findByEmployeeType(EmployeeType employeeType);

    @EntityGraph(attributePaths = {"user", "company", "office"})
    @Query("SELECT e FROM Employee e WHERE e.company.id = :companyId AND e.employeeType = :employeeType")
    List<Employee> findByCompanyIdAndEmployeeType(@Param("companyId") Long companyId, @Param("employeeType") EmployeeType employeeType);
}
