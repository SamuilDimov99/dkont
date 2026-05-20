package com.example.logistics.web;

import com.example.logistics.model.Shipment;
import com.example.logistics.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/shipment")
@RequiredArgsConstructor
public class ShipmentApiController {

    private final ShipmentService shipmentService;

    // GET
    @GetMapping
    public List<Shipment> getAllShipments() {
        return shipmentService.getAllShipments();
    }

    @GetMapping("/{id}")
    public Shipment getShipmentById(@PathVariable long id) {
        return shipmentService.getShipmentById(id);
    }

    @GetMapping("/by-sender/{clientId}")
    public List<Shipment> getShipmentsBySender(@PathVariable long clientId) {
        return shipmentService.getShipmentsBySender(clientId);
    }

    @GetMapping("/by-recipient/{clientId}")
    public List<Shipment> getShipmentsByRecipient(@PathVariable long clientId) {
        return shipmentService.getShipmentsByRecipient(clientId);
    }

    @GetMapping("/by-client/{clientId}")
    public List<Shipment> getShipmentsByClient(@PathVariable long clientId) {
        return shipmentService.getShipmentsByClient(clientId);
    }

    @GetMapping("/by-employee/{employeeId}")
    public List<Shipment> getShipmentsByEmployee(@PathVariable long employeeId) {
        return shipmentService.getShipmentsByEmployee(employeeId);
    }

    @GetMapping("/undelivered")
    public List<Shipment> getUndeliveredShipments() {
        return shipmentService.getUndeliveredShipments();
    }

    @GetMapping("/revenue")
    public BigDecimal getRevenue(@RequestParam long companyId,
                                 @RequestParam LocalDateTime from,
                                 @RequestParam LocalDateTime to) {
        return shipmentService.calculateRevenue(companyId, from, to);
    }

    // POST, PUT
    @PostMapping
    public Shipment createShipment(@RequestBody Shipment shipment) {
        return shipmentService.createShipment(shipment);
    }

    @PutMapping("/{id}")
    public Shipment updateShipment(@RequestBody Shipment shipment, @PathVariable long id) {
        return shipmentService.updateShipment(id, shipment);
    }

    // Status transitions
    @PutMapping("/{id}/deliver")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markDelivered(@PathVariable long id) {
        shipmentService.markDelivered(id);
    }

    @PutMapping("/{id}/transit")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markInTransit(@PathVariable long id) {
        shipmentService.markInTransit(id);
    }

    @PutMapping("/{id}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelShipment(@PathVariable long id) {
        shipmentService.cancelShipment(id);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteShipment(@PathVariable long id) {
        shipmentService.deleteShipment(id);
    }
}
