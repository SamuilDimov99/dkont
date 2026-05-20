package com.example.logistics.service.impl;

import com.example.logistics.model.Company;
import com.example.logistics.repo.CompanyRepository;
import com.example.logistics.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Company getCompanyById(Long id) {
        Company company = companyRepository.findById(id).orElse(null);
        if (company == null) throw new IllegalArgumentException("Company not found with id: " + id);
        return company;
    }

    @Override
    public Company createCompany(Company company) {
        if (company.getName() == null || company.getName().isBlank()) {
            throw new IllegalArgumentException("Company name is required");
        }
        return companyRepository.save(company);
    }

    @Override
    public Company updateCompany(Long id, Company updated) {
        Company existing = getCompanyById(id);
        existing.setName(updated.getName());
        existing.setBasePricePerKg(updated.getBasePricePerKg());
        existing.setAddressSurcharge(updated.getAddressSurcharge());
        return companyRepository.save(existing);
    }

    @Override
    public void deleteCompany(Long id) {
        companyRepository.deleteById(id);
    }
}
