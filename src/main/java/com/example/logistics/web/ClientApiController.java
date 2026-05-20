package com.example.logistics.web;


import com.example.logistics.model.Client;
import com.example.logistics.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client")
@RequiredArgsConstructor
public class ClientApiController {

    private final ClientService clientService;


// GET
    @GetMapping
    public List<Client> getClients() {
        return clientService.getAllClients();
    }

    @GetMapping("/{id}")
    public Client getClientById(@PathVariable long id) {
        return clientService.getClientById(id);
    }

    @GetMapping("/by-user-id/{userId}")
    public Client getClientByUserId(@PathVariable long userId){
        return clientService.getClientByUserId(userId);
    }
// POST, PUT

    @PostMapping
    public Client createClient(@RequestBody Client client){
        return clientService.createClient(client);
}
    @PutMapping("/{id}")
    public Client updateClientById(@PathVariable long id, @RequestBody Client client) {
        return clientService.updateClient(id, client);
    }

// DELETE

    @DeleteMapping("/{id}")
    public void deleteClient(@PathVariable long id){
        clientService.deleteClient(id);
    }

}
