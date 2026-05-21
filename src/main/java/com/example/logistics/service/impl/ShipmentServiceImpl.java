package com.example.logistics.service.impl;

import com.example.logistics.model.DeliveryType;
import com.example.logistics.model.Employee;
import com.example.logistics.model.EmployeeType;
import com.example.logistics.model.Role;
import com.example.logistics.model.Shipment;
import com.example.logistics.model.ShipmentStatus;
import com.example.logistics.model.User;
import com.example.logistics.repo.ClientRepository;
import com.example.logistics.repo.CompanyRepository;
import com.example.logistics.repo.EmployeeRepository;
import com.example.logistics.repo.OfficeRepository;
import com.example.logistics.repo.ShipmentRepository;
import com.example.logistics.repo.UserRepository;
import com.example.logistics.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Core business logic for shipment management.
 *
 * Responsibilities:
 *  - CRUD operations for shipments
 *  - Automatic price calculation based on weight and delivery type
 *  - Status lifecycle transitions: REGISTERED → IN_TRANSIT → DELIVERED / CANCELLED
 *  - Queries needed for the Reports section (by employee, by client, undelivered, revenue)
 */
@Service
@Transactional
@RequiredArgsConstructor
public class ShipmentServiceImpl implements ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final CompanyRepository  companyRepository;
    private final ClientRepository   clientRepository;
    private final EmployeeRepository employeeRepository;
    private final OfficeRepository   officeRepository;
    private final UserRepository     userRepository;

    // ── Read operations ───────────────────────────────────────────────────────

    /** Returns all shipments in the system (used by employee and admin views). */
    @Override
    @Transactional(readOnly = true)
    public List<Shipment> getAllShipments() {
        return shipmentRepository.findAll();
    }

    /** Returns shipments where the given client is the sender. Used in Reports → By Sender. */
    @Override
    @Transactional(readOnly = true)
    public List<Shipment> getShipmentsBySender(Long clientId) {
        return shipmentRepository.findBySenderId(clientId);
    }

    /** Returns shipments where the given client is the recipient. Used in Reports → By Receiver. */
    @Override
    @Transactional(readOnly = true)
    public List<Shipment> getShipmentsByRecipient(Long clientId) {
        return shipmentRepository.findByRecipientId(clientId);
    }

    /** Returns all shipments where the client appears as either sender or recipient. */
    @Override
    @Transactional(readOnly = true)
    public List<Shipment> getShipmentsByClient(Long clientId) {
        return shipmentRepository.findAllByClientId(clientId);
    }

    /** Returns all shipments registered by a specific employee. Used in Reports → By Employee. */
    @Override
    @Transactional(readOnly = true)
    public List<Shipment> getShipmentsByEmployee(Long employeeId) {
        return shipmentRepository.findByRegisteredById(employeeId);
    }

    /**
     * Returns shipments that are active (not yet delivered and not cancelled).
     * Used in Reports → Undelivered to show outstanding deliveries.
     */
    @Override
    @Transactional(readOnly = true)
    public List<Shipment> getUndeliveredShipments() {
        return shipmentRepository.findByStatusNot(ShipmentStatus.DELIVERED)
                .stream()
                .filter(s -> s.getStatus() != ShipmentStatus.CANCELLED)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Shipment getShipmentById(Long id) {
        return shipmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found with id: " + id));
    }

    // ── Write operations ──────────────────────────────────────────────────────

    /**
     * Registers a new shipment.
     *
     * Validation:
     *  - Sender, recipient, registering employee, weight and delivery type are mandatory.
     *  - TO_ADDRESS shipments require a delivery address.
     *  - TO_OFFICE shipments require a destination office.
     *
     * After validation, related entities are fetched from the database (attachRelations)
     * to ensure the JPA graph is consistent, and the price is calculated automatically.
     */
    @Override
    public Shipment createShipment(Shipment shipment) {
        if (shipment.getSender()       == null) throw new IllegalArgumentException("Sender is required");
        if (shipment.getRecipient()    == null) throw new IllegalArgumentException("Recipient is required");
        if (shipment.getRegisteredBy() == null) throw new IllegalArgumentException("Registering employee is required");
        if (shipment.getWeight()       == null) throw new IllegalArgumentException("Weight is required");
        if (shipment.getDeliveryType() == null) throw new IllegalArgumentException("Delivery type is required");

        if (shipment.getDeliveryType() == DeliveryType.TO_ADDRESS
                && (shipment.getDeliveryAddress() == null || shipment.getDeliveryAddress().isBlank())) {
            throw new IllegalArgumentException("Delivery address is required for TO_ADDRESS shipments");
        }
        if (shipment.getDeliveryType() == DeliveryType.TO_OFFICE
                && shipment.getDestinationOffice() == null) {
            throw new IllegalArgumentException("Destination office is required for TO_OFFICE shipments");
        }

        // Replace shallow ID-only references with fully loaded JPA entities
        attachRelations(shipment);

        // Price is always calculated server-side so clients cannot submit arbitrary prices
        shipment.setPrice(calculatePrice(shipment));

        return shipmentRepository.save(shipment);
    }

    /**
     * Updates an existing shipment's details and recalculates the price.
     * Status is not changed here — use the dedicated status-transition endpoints.
     */
    @Override
    public Shipment updateShipment(Long id, Shipment updated) {
        Shipment existing = getShipmentById(id);
        existing.setSender(updated.getSender());
        existing.setRecipient(updated.getRecipient());
        existing.setDeliveryType(updated.getDeliveryType());
        existing.setDeliveryAddress(updated.getDeliveryAddress());
        existing.setDestinationOffice(updated.getDestinationOffice());
        existing.setWeight(updated.getWeight());
        existing.setDescription(updated.getDescription());
        existing.setPrice(calculatePrice(existing));
        return shipmentRepository.save(existing);
    }

    // ── Status transitions ────────────────────────────────────────────────────

    /**
     * Marks a shipment as DELIVERED, enforcing who is allowed to do so:
     *
     *   TO_ADDRESS  → only a COURIER can deliver it (they physically drive to the address)
     *   TO_OFFICE   → only an OFFICE_EMPLOYEE can mark it collected (client picks it up at the counter)
     *
     * ADMINs bypass the check entirely so they can correct mistakes without restrictions.
     * Any other role combination throws an IllegalArgumentException which the global
     * exception handler converts to a 400 response with a human-readable message.
     */
    @Override
    public Shipment markDelivered(Long id, String callerUsername) {
        Shipment shipment = getShipmentById(id);

        // ADMINs can mark any shipment delivered regardless of type
        User caller = userRepository.findByUsername(callerUsername);
        if (caller != null && caller.getRole() == Role.ADMIN) {
            shipment.setStatus(ShipmentStatus.DELIVERED);
            shipment.setDeliveredAt(LocalDateTime.now());
            return shipmentRepository.save(shipment);
        }

        // For all other callers, load the linked Employee record and check their type
        Employee employee = employeeRepository.findByUsername(callerUsername);
        if (employee == null) {
            throw new IllegalArgumentException("Only employees or admins can mark shipments as delivered");
        }

        if (shipment.getDeliveryType() == DeliveryType.TO_ADDRESS) {
            // Door-to-door delivery — only the courier physically goes to the address
            if (employee.getEmployeeType() != EmployeeType.COURIER) {
                throw new IllegalArgumentException(
                        "Only a COURIER can mark a TO_ADDRESS shipment as delivered");
            }
        } else if (shipment.getDeliveryType() == DeliveryType.TO_OFFICE) {
            // Office pickup — client comes to the counter, office employee hands it over
            if (employee.getEmployeeType() != EmployeeType.OFFICE_EMPLOYEE) {
                throw new IllegalArgumentException(
                        "Only an OFFICE_EMPLOYEE can mark a TO_OFFICE shipment as delivered");
            }
            // The employee must work at the exact office the shipment is going to —
            // they cannot mark deliveries on behalf of a different branch
            Long employeeOfficeId    = employee.getOffice()                == null ? null : employee.getOffice().getId();
            Long destinationOfficeId = shipment.getDestinationOffice()     == null ? null : shipment.getDestinationOffice().getId();
            if (employeeOfficeId == null || !employeeOfficeId.equals(destinationOfficeId)) {
                throw new IllegalArgumentException(
                        "You can only mark shipments as delivered for your own office");
            }
        }

        shipment.setStatus(ShipmentStatus.DELIVERED);
        shipment.setDeliveredAt(LocalDateTime.now());
        return shipmentRepository.save(shipment);
    }

    /** Marks a shipment as IN_TRANSIT (picked up, on its way to the destination). */
    @Override
    public Shipment markInTransit(Long id) {
        Shipment shipment = getShipmentById(id);
        shipment.setStatus(ShipmentStatus.IN_TRANSIT);
        return shipmentRepository.save(shipment);
    }

    /** Cancels a shipment. Cancelled shipments are excluded from revenue calculations. */
    @Override
    public Shipment cancelShipment(Long id) {
        Shipment shipment = getShipmentById(id);
        shipment.setStatus(ShipmentStatus.CANCELLED);
        return shipmentRepository.save(shipment);
    }

    @Override
    public void deleteShipment(Long id) {
        shipmentRepository.deleteById(id);
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    /** Calculates total revenue (sum of shipment prices) for a company within a date range. */
    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateRevenue(Long companyId, LocalDateTime from, LocalDateTime to) {
        return shipmentRepository.calculateRevenue(companyId, from, to);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Shipment> getShipmentsByDateRange(Long companyId, LocalDateTime from, LocalDateTime to) {
        return shipmentRepository.findByCompanyIdAndDateRange(companyId, from, to);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Replaces the shallow ID-only entity references that arrive from the frontend
     * with fully loaded JPA entities. This is necessary because the request body
     * contains objects like { "id": 5 } rather than complete entity graphs.
     */
    private void attachRelations(Shipment shipment) {
        if (shipment.getCompany() != null && shipment.getCompany().getId() != null) {
            shipment.setCompany(companyRepository.findById(shipment.getCompany().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Company not found")));
        }
        shipment.setSender(clientRepository.findById(shipment.getSender().getId())
                .orElseThrow(() -> new IllegalArgumentException("Sender not found")));
        shipment.setRecipient(clientRepository.findById(shipment.getRecipient().getId())
                .orElseThrow(() -> new IllegalArgumentException("Recipient not found")));
        shipment.setRegisteredBy(employeeRepository.findById(shipment.getRegisteredBy().getId())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found")));
        if (shipment.getDestinationOffice() != null && shipment.getDestinationOffice().getId() != null) {
            shipment.setDestinationOffice(officeRepository.findById(shipment.getDestinationOffice().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Office not found")));
        }
    }

    /**
     * Calculates the shipment price using the company's configured rates.
     * Formula: price = basePricePerKg × weight [ + addressSurcharge if TO_ADDRESS ]
     * Delivery to an office is cheaper than delivery to a specific address.
     */
    private BigDecimal calculatePrice(Shipment shipment) {
        BigDecimal price = shipment.getCompany().getBasePricePerKg()
                                   .multiply(shipment.getWeight());
        if (shipment.getDeliveryType() == DeliveryType.TO_ADDRESS) {
            price = price.add(shipment.getCompany().getAddressSurcharge());
        }
        return price;
    }
}
