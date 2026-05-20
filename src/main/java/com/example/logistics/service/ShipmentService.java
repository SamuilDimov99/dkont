package com.example.logistics.service;

import com.example.logistics.model.Shipment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface ShipmentService {
    List<Shipment> getAllShipments();
    List<Shipment> getShipmentsBySender(Long clientId);
    List<Shipment> getShipmentsByRecipient(Long clientId);
    List<Shipment> getShipmentsByClient(Long clientId);
    List<Shipment> getShipmentsByEmployee(Long employeeId);
    List<Shipment> getUndeliveredShipments();
    Shipment getShipmentById(Long id);
    Shipment createShipment(Shipment shipment);
    Shipment updateShipment(Long id, Shipment shipment);
    Shipment markDelivered(Long id);
    Shipment markInTransit(Long id);
    Shipment cancelShipment(Long id);
    void deleteShipment(Long id);
    BigDecimal calculateRevenue(Long companyId, LocalDateTime from, LocalDateTime to);
    List<Shipment> getShipmentsByDateRange(Long companyId, LocalDateTime from, LocalDateTime to);
}
