package com.example.logistics.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "employee")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "office_id")
    private Office office;

    @Enumerated(EnumType.STRING)
    @Column(name = "employee_type", nullable = false)
    private EmployeeType employeeType;

    @OneToMany(mappedBy = "registeredBy")
    private List<Shipment> registeredShipments;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    @JsonIgnore
    public User getUser() { return user; }
    @JsonProperty
    public void setUser(User user) { this.user = user; }
    public Long getUserId() { return user == null ? null : user.getId(); }
    public String getFirstName() { return user == null ? null : user.getFirstName(); }
    public String getLastName() { return user == null ? null : user.getLastName(); }
    public String getEmail() { return user == null ? null : user.getEmail(); }
    @JsonIgnore
    public Company getCompany() { return company; }
    @JsonProperty
    public void setCompany(Company company) { this.company = company; }
    public Long getCompanyId() { return company == null ? null : company.getId(); }
    @JsonIgnore
    public Office getOffice() { return office; }
    @JsonProperty
    public void setOffice(Office office) { this.office = office; }
    public Long getOfficeId() { return office == null ? null : office.getId(); }
    public EmployeeType getEmployeeType() { return employeeType; }
    public void setEmployeeType(EmployeeType employeeType) { this.employeeType = employeeType; }
    @JsonIgnore
    public List<Shipment> getRegisteredShipments() { return registeredShipments; }
    public void setRegisteredShipments(List<Shipment> registeredShipments) { this.registeredShipments = registeredShipments; }
}
