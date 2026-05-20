package com.example.logistics.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "client")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String phone;

    @OneToMany(mappedBy = "sender")
    private List<Shipment> sentShipments;

    @OneToMany(mappedBy = "recipient")
    private List<Shipment> receivedShipments;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    @JsonIgnore
    public User getUser() { return user; }
    @JsonProperty
    public void setUser(User user) { this.user = user; }
    public Long getUserId() { return user == null ? null : user.getId(); }
    public String getUsername() { return user == null ? null : user.getUsername(); }
    public String getFirstName() { return user == null ? null : user.getFirstName(); }
    public String getLastName() { return user == null ? null : user.getLastName(); }
    public String getEmail() { return user == null ? null : user.getEmail(); }
    @JsonIgnore
    public List<Shipment> getSentShipments() { return sentShipments; }
    public void setSentShipments(List<Shipment> sentShipments) { this.sentShipments = sentShipments; }
    @JsonIgnore
    public List<Shipment> getReceivedShipments() { return receivedShipments; }
    public void setReceivedShipments(List<Shipment> receivedShipments) { this.receivedShipments = receivedShipments; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
