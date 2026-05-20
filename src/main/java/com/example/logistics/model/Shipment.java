package com.example.logistics.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "shipment")
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private Client sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private Client recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_by_id", nullable = false)
    private Employee registeredBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_type", nullable = false)
    private DeliveryType deliveryType;

    @Column(name = "delivery_address")
    private String deliveryAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_office_id")
    private Office destinationOffice;

    @Column
    private String description;

    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal weight;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipmentStatus status;

    @Column(name = "registered_at", nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @PrePersist
    protected void onCreate() {
        this.registeredAt = LocalDateTime.now();
        this.status = ShipmentStatus.REGISTERED;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    @JsonIgnore
    public Company getCompany() { return company; }
    @JsonProperty
    public void setCompany(Company company) { this.company = company; }
    public Long getCompanyId() { return company == null ? null : company.getId(); }
    @JsonIgnore
    public Client getSender() { return sender; }
    @JsonProperty
    public void setSender(Client sender) { this.sender = sender; }
    public Long getSenderClientId() { return sender == null ? null : sender.getId(); }
    @JsonIgnore
    public Client getRecipient() { return recipient; }
    @JsonProperty
    public void setRecipient(Client recipient) { this.recipient = recipient; }
    public Long getReceiverClientId() { return recipient == null ? null : recipient.getId(); }
    @JsonIgnore
    public Employee getRegisteredBy() { return registeredBy; }
    @JsonProperty
    public void setRegisteredBy(Employee registeredBy) { this.registeredBy = registeredBy; }
    public Long getRegisteredByEmployeeId() { return registeredBy == null ? null : registeredBy.getId(); }
    public DeliveryType getDeliveryType() { return deliveryType; }
    public void setDeliveryType(DeliveryType deliveryType) { this.deliveryType = deliveryType; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    @JsonIgnore
    public Office getDestinationOffice() { return destinationOffice; }
    @JsonProperty
    public void setDestinationOffice(Office destinationOffice) { this.destinationOffice = destinationOffice; }
    public Long getDestinationOfficeId() { return destinationOffice == null ? null : destinationOffice.getId(); }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public ShipmentStatus getStatus() { return status; }
    public void setStatus(ShipmentStatus status) { this.status = status; }
    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public String getSentDate() { return registeredAt == null ? null : registeredAt.toLocalDate().toString(); }
    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public String getReceivedDate() { return deliveredAt == null ? null : deliveredAt.toLocalDate().toString(); }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }
}
