package com.example.logistics.repo;

import com.example.logistics.model.Shipment;
import com.example.logistics.model.ShipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    // All shipments by a specific sender (client)
    @Query("SELECT s FROM Shipment s WHERE s.sender.id = :senderId")
    List<Shipment> findBySenderId(@Param("senderId") Long senderId);

    // All shipments for a specific recipient (client)
    @Query("SELECT s FROM Shipment s WHERE s.recipient.id = :recipientId")
    List<Shipment> findByRecipientId(@Param("recipientId") Long recipientId);

    // All shipments registered by a specific employee
    @Query("SELECT s FROM Shipment s WHERE s.registeredBy.id = :employeeId")
    List<Shipment> findByRegisteredById(@Param("employeeId") Long employeeId);

    // All shipments that are sent but not yet delivered
    List<Shipment> findByStatusNot(ShipmentStatus status);

    // All shipments by status
    List<Shipment> findByStatus(ShipmentStatus status);

    // All shipments a client is involved in (sent or received) - for client dashboard
    @Query("SELECT s FROM Shipment s WHERE s.sender.id = :clientId OR s.recipient.id = :clientId")
    List<Shipment> findAllByClientId(@Param("clientId") Long clientId);

    // Total revenue for a company within a date range
    @Query("SELECT COALESCE(SUM(s.price), 0) FROM Shipment s " +
            "WHERE s.company.id = :companyId " +
            "AND s.registeredAt BETWEEN :from AND :to")
    BigDecimal calculateRevenue(@Param("companyId") Long companyId,
                                @Param("from") LocalDateTime from,
                                @Param("to") LocalDateTime to);

    // All shipments for a company within a date range (for detailed revenue report)
    @Query("SELECT s FROM Shipment s " +
            "WHERE s.company.id = :companyId " +
            "AND s.registeredAt BETWEEN :from AND :to")
    List<Shipment> findByCompanyIdAndDateRange(@Param("companyId") Long companyId,
                                               @Param("from") LocalDateTime from,
                                               @Param("to") LocalDateTime to);
}
