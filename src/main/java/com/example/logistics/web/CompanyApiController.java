package com.example.logistics.web;

import com.example.logistics.model.Company;
import com.example.logistics.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/company")
@RequiredArgsConstructor
public class CompanyApiController {

    private final CompanyService companyService;

    // GET
    @GetMapping({"", "/"})
    public List<Company> getAllCompanies() {
        return companyService.getAllCompanies();
    }

    @GetMapping("/{id}")
    public Company getCompanyById(@PathVariable long id) {
        return companyService.getCompanyById(id);
    }

    // POST, PUT
    @PostMapping({"", "/"})
    public Company createCompany(@RequestBody Company company) {
        return companyService.createCompany(company);
    }

    @PutMapping("/{id}")
    public Company updateCompany(@RequestBody Company company, @PathVariable long id) {
        return companyService.updateCompany(id, company);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteCompany(@PathVariable long id) {
        companyService.deleteCompany(id);
    }
}
