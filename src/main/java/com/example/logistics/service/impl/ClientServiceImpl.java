package com.example.logistics.service.impl;

import com.example.logistics.model.Client;
import com.example.logistics.repo.ClientRepository;
import com.example.logistics.repo.UserRepository;
import com.example.logistics.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Client getClientById(Long id) {
        Client client = clientRepository.findById(id).orElse(null);
        if (client == null) throw new IllegalArgumentException("Client not found with id: " + id);
        return client;
    }

    @Override
    @Transactional(readOnly = true)
    public Client getClientByUserId(Long userId) {
        Client client = clientRepository.findByUserId(userId);
        if (client == null) throw new IllegalArgumentException("Client not found for user id: " + userId);
        return client;
    }

    @Override
    public Client createClient(Client client) {
        if (client.getUser() == null || client.getUser().getId() == null) {
            throw new IllegalArgumentException("User is required for client");
        }
        client.setUser(userRepository.findById(client.getUser().getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + client.getUser().getId())));
        return clientRepository.save(client);
    }

    @Override
    public Client updateClient(Long id, Client updated) {
        Client existing = getClientById(id);
        existing.setPhone(updated.getPhone());
        return clientRepository.save(existing);
    }

    @Override
    public void deleteClient(Long id) {
        clientRepository.deleteById(id);
    }
}
