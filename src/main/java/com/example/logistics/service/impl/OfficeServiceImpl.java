package com.example.logistics.service.impl;

import com.example.logistics.model.Office;
import com.example.logistics.repo.CompanyRepository;
import com.example.logistics.repo.OfficeRepository;
import com.example.logistics.service.OfficeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class OfficeServiceImpl implements OfficeService {

    private final OfficeRepository officeRepository;
    private final CompanyRepository companyRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Office> getAllOffices() {
        return officeRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Office> getOfficesByCompany(Long companyId) {
        return officeRepository.findByCompanyId(companyId);
    }

    @Override
    @Transactional(readOnly = true)
    public Office getOfficeById(Long id) {
        Office office = officeRepository.findById(id).orElse(null);
        if (office == null) throw new IllegalArgumentException("Office not found with id: " + id);
        return office;
    }

    @Override
    public Office createOffice(Office office) {
        if (office.getCity() == null || office.getCity().isBlank()) {
            throw new IllegalArgumentException("Office city is required");
        }
        if (office.getCompany() == null || office.getCompany().getId() == null) {
            throw new IllegalArgumentException("Company is required");
        }
        office.setCompany(companyRepository.findById(office.getCompany().getId())
                .orElseThrow(() -> new IllegalArgumentException("Company not found with id: " + office.getCompany().getId())));
        return officeRepository.save(office);
    }

    @Override
    public Office updateOffice(Long id, Office updated) {
        Office existing = getOfficeById(id);
        existing.setAddress(updated.getAddress());
        existing.setCity(updated.getCity());
        existing.setPhone(updated.getPhone());
        return officeRepository.save(existing);
    }

    @Override
    public void deleteOffice(Long id) {
        officeRepository.deleteById(id);
    }
}
