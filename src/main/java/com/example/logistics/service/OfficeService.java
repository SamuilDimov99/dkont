package com.example.logistics.service;

import com.example.logistics.model.Office;

import java.util.List;

public interface OfficeService {
    List<Office> getAllOffices();
    List<Office> getOfficesByCompany(Long companyId);
    Office getOfficeById(Long id);
    Office createOffice(Office office);
    Office updateOffice(Long id, Office office);
    void deleteOffice(Long id);
}