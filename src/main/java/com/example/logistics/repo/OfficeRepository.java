package com.example.logistics.repo;

import com.example.logistics.model.Office;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfficeRepository extends JpaRepository<Office, Long> {
    @Query("SELECT o FROM Office o WHERE o.company.id = :companyId")
    List<Office> findByCompanyId(@Param("companyId") Long companyId);

    List<Office> findByCity(String city);
}
