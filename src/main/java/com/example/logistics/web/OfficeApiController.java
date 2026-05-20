package com.example.logistics.web;

import com.example.logistics.model.Client;
import com.example.logistics.model.Office;
import com.example.logistics.service.OfficeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/office")
public class OfficeApiController {

    private final OfficeService officeService;


    // GET
    @GetMapping
    public List<Office> getAllOffices(){
        return officeService.getAllOffices();
    }

    @GetMapping("/{id}")
    public Office getOfficeById(@PathVariable long id){
        return officeService.getOfficeById(id);
    }


    @GetMapping("/company-id/{companyId}")
    public List<Office> getOfficesByCompanyId(@PathVariable long companyId){
        return officeService.getOfficesByCompany(companyId);
    }

    // POST, PUT

    @PostMapping
    public Office createOffice(@RequestBody Office office){
        return officeService.createOffice(office);
    }

    @PutMapping
    public Office updateOfficeById(@RequestBody Office office, @PathVariable long id){
        return officeService.updateOffice(id, office);
    }

// DELETE

    @DeleteMapping("/{id}")
    public void deleteOffice(@PathVariable long id){
        officeService.deleteOffice(id);
    }

}
