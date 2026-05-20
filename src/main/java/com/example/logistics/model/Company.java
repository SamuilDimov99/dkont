package com.example.logistics.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "company")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "base_price_per_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePricePerKg;

    @Column(name = "address_surcharge", nullable = false, precision = 10, scale = 2)
    private BigDecimal addressSurcharge;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    private List<Office> offices;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    private List<Employee> employees;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    private List<Shipment> shipments;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getBasePricePerKg() { return basePricePerKg; }
    public void setBasePricePerKg(BigDecimal basePricePerKg) { this.basePricePerKg = basePricePerKg; }
    public BigDecimal getAddressSurcharge() { return addressSurcharge; }
    public void setAddressSurcharge(BigDecimal addressSurcharge) { this.addressSurcharge = addressSurcharge; }
    @JsonIgnore
    public List<Office> getOffices() { return offices; }
    public void setOffices(List<Office> offices) { this.offices = offices; }
    @JsonIgnore
    public List<Employee> getEmployees() { return employees; }
    public void setEmployees(List<Employee> employees) { this.employees = employees; }
    @JsonIgnore
    public List<Shipment> getShipments() { return shipments; }
    public void setShipments(List<Shipment> shipments) { this.shipments = shipments; }
}
