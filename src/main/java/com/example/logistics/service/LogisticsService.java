//package com.example.logistics.service;
//
//import com.example.logistics.model.*;
//import com.example.logistics.repo.*;
//import jakarta.annotation.PostConstruct;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.math.BigDecimal;
//import java.nio.charset.StandardCharsets;
//import java.security.MessageDigest;
//import java.security.NoSuchAlgorithmException;
//import java.time.LocalDateTime;
//import java.util.Comparator;
//import java.util.List;
//import java.util.stream.Stream;
//
//@Service
//@Transactional
//public class LogisticsService {
//
//    private final UserRepository users;
//    private final CompanyRepository companies;
//    private final EmployeeRepository employees;
//    private final ClientRepository clients;
//    private final OfficeRepository offices;
//    private final ShipmentRepository shipments;
//    private final String seedAdminUsername;
//    private final String seedAdminPassword;
//
//    public LogisticsService(
//            UserRepository users,
//            CompanyRepository companies,
//            EmployeeRepository employees,
//            ClientRepository clients,
//            OfficeRepository offices,
//            ShipmentRepository shipments,
//            @Value("${admin.seed.username:admin}") String seedAdminUsername,
//            @Value("${admin.seed.password:admin}") String seedAdminPassword) {
//        this.users = users;
//        this.companies = companies;
//        this.employees = employees;
//        this.clients = clients;
//        this.offices = offices;
//        this.shipments = shipments;
//        this.seedAdminUsername = seedAdminUsername;
//        this.seedAdminPassword = seedAdminPassword;
//    }
//
//    // -------------------------------------------------------------------------
//    // Seed
//    // -------------------------------------------------------------------------
//
//    @PostConstruct
//    public void seedIfEmpty() {
//        if (companies.count() == 0 && users.count() == 0) {
//            seed();
//        }
//    }
//
//    // -------------------------------------------------------------------------
//    // Auth
//    // -------------------------------------------------------------------------
//
//    @Transactional(readOnly = true)
//    public AuthSession login(String username, String password) {
//        User user = users.findByUsername(username);
//        if (user == null || !user.getPasswordHash().equals(hashPassword(password))) {
//            throw new IllegalArgumentException("Invalid username or password");
//        }
//        Client client = clients.findByUserId(user.getId());
//        Employee employee = employees.findByUserId(user.getId());
//        Long clientId = client == null ? null : client.getId();
//        Long employeeId = employee == null ? null : employee.getId();
//        EmployeeType employeeType = employee == null ? null : employee.getEmployeeType();
//        Long officeId = (employee == null || employee.getOffice() == null) ? null : employee.getOffice().getId();
//        return new AuthSession(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), clientId, employeeId, employeeType, officeId);
//    }
//
//    public AuthSession registerClient(RegisterClientRequest request) {
//        if (users.existsByUsername(request.username())) {
//            throw new IllegalArgumentException("Username already exists");
//        }
//        User user = addUser(request.username(), request.password(), request.email(), Role.CLIENT);
//        Client client = new Client();
//        client.setUser(user);
//        clients.save(client);
//        return new AuthSession(user.getId(), user.getUsername(), user.getEmail(), Role.CLIENT, client.getId(), null, null, null);
//    }
//
//    // -------------------------------------------------------------------------
//    // Snapshot (read everything for admin/employee views)
//    // -------------------------------------------------------------------------
//
//    @Transactional(readOnly = true)
//    public Snapshot snapshot() {
//        return new Snapshot(
//                sortById(users.findAll()),
//                sortById(companies.findAll()),
//                sortById(employees.findAll()),
//                sortById(clients.findAll()),
//                sortById(offices.findAll()),
//                sortById(shipments.findAll())
//        );
//    }
//
//    // -------------------------------------------------------------------------
//    // Users
//    // -------------------------------------------------------------------------
//
//    @Transactional(readOnly = true)
//    public List<User> getAllUsers() {
//        return sortById(users.findAll());
//    }
//
//    public User createUser(String username, String password, String email, Role role) {
//        requireText(username, "Username is required");
//        requireText(password, "Password is required");
//        requireText(email, "Email is required");
//        if (role == null) throw new IllegalArgumentException("Role is required");
//        if (users.existsByUsername(username)) throw new IllegalArgumentException("Username already exists: " + username);
//        return addUser(username, password, email, role);
//    }
//
//    public User changeUserRole(Long userId, Role role) {
//        if (role == null) throw new IllegalArgumentException("Role is required");
//        User user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
//        user.setRole(role);
//        return users.save(user);
//    }
//
//    public void deleteUser(Long userId) {
//        User user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
//        Client client = clients.findByUserId(userId);
//        if (client != null) clients.delete(client);
//        Employee employee = employees.findByUserId(userId);
//        if (employee != null) employees.delete(employee);
//        users.delete(user);
//    }
//
//    // -------------------------------------------------------------------------
//    // Companies
//    // -------------------------------------------------------------------------
//
//    public Company saveCompany(Company company) {
//        return companies.save(company);
//    }
//
//    public void deleteCompany(Long id) {
//        companies.deleteById(id);
//    }
//
//    // -------------------------------------------------------------------------
//    // Offices
//    // -------------------------------------------------------------------------
//
//    public Office saveOffice(Office office) {
//        return offices.save(office);
//    }
//
//    public void deleteOffice(Long id) {
//        offices.deleteById(id);
//    }
//
//    // -------------------------------------------------------------------------
//    // Employees
//    // -------------------------------------------------------------------------
//
//    public Employee saveEmployee(Employee employee) {
//        return employees.save(employee);
//    }
//
//    public void deleteEmployee(Long id) {
//        employees.deleteById(id);
//    }
//
//    // -------------------------------------------------------------------------
//    // Clients
//    // -------------------------------------------------------------------------
//
//    public Client saveClient(Client client) {
//        return clients.save(client);
//    }
//
//    public void deleteClient(Long id) {
//        clients.deleteById(id);
//    }
//
//    // -------------------------------------------------------------------------
//    // Shipments
//    // -------------------------------------------------------------------------
//
//    public Shipment saveShipment(Shipment shipment) {
//        // Calculate price from the company's rates
//        Company company = shipment.getCompany();
//        BigDecimal price = company.getBasePricePerKg().multiply(shipment.getWeight());
//        if (shipment.getDeliveryType() == DeliveryType.TO_ADDRESS) {
//            price = price.add(company.getAddressSurcharge());
//        }
//        shipment.setPrice(price);
//        return shipments.save(shipment);
//    }
//
//    public Shipment markDelivered(Long id) {
//        Shipment shipment = shipments.findById(id)
//                .orElseThrow(() -> new IllegalArgumentException("Shipment not found"));
//        shipment.setStatus(ShipmentStatus.DELIVERED);
//        shipment.setDeliveredAt(LocalDateTime.now());
//        return shipments.save(shipment);
//    }
//
//    public Shipment markInTransit(Long id) {
//        Shipment shipment = shipments.findById(id)
//                .orElseThrow(() -> new IllegalArgumentException("Shipment not found"));
//        shipment.setStatus(ShipmentStatus.IN_TRANSIT);
//        return shipments.save(shipment);
//    }
//
//    public Shipment cancelShipment(Long id) {
//        Shipment shipment = shipments.findById(id)
//                .orElseThrow(() -> new IllegalArgumentException("Shipment not found"));
//        shipment.setStatus(ShipmentStatus.CANCELLED);
//        return shipments.save(shipment);
//    }
//
//    public void deleteShipment(Long id) {
//        shipments.deleteById(id);
//    }
//
//    // -------------------------------------------------------------------------
//    // Queries / Reports
//    // -------------------------------------------------------------------------
//
//    @Transactional(readOnly = true)
//    public List<Shipment> getShipmentsForClient(Long clientId) {
//        return shipments.findAllByClientId(clientId);
//    }
//
//    @Transactional(readOnly = true)
//    public List<Shipment> getShipmentsBySender(Long clientId) {
//        return shipments.findBySenderId(clientId);
//    }
//
//    @Transactional(readOnly = true)
//    public List<Shipment> getShipmentsByRecipient(Long clientId) {
//        return shipments.findByRecipientId(clientId);
//    }
//
//    @Transactional(readOnly = true)
//    public List<Shipment> getShipmentsByEmployee(Long employeeId) {
//        return shipments.findByRegisteredById(employeeId);
//    }
//
//    @Transactional(readOnly = true)
//    public List<Shipment> getUndeliveredShipments() {
//        // Everything that is not DELIVERED and not CANCELLED
//        return shipments.findAll().stream()
//                .filter(s -> s.getStatus() != ShipmentStatus.DELIVERED
//                        && s.getStatus() != ShipmentStatus.CANCELLED)
//                .sorted(Comparator.comparing(Shipment::getId))
//                .toList();
//    }
//
//    @Transactional(readOnly = true)
//    public List<Employee> getAllEmployees() {
//        return sortById(employees.findAll());
//    }
//
//    @Transactional(readOnly = true)
//    public List<Client> getAllClients() {
//        return sortById(clients.findAll());
//    }
//
//    @Transactional(readOnly = true)
//    public List<Shipment> getAllShipments() {
//        return sortById(shipments.findAll());
//    }
//
//    @Transactional(readOnly = true)
//    public Reports reports(LocalDateTime from, LocalDateTime to) {
//        LocalDateTime start = from == null ? LocalDateTime.now().minusMonths(1) : from;
//        LocalDateTime end   = to   == null ? LocalDateTime.now()               : to;
//
//        Company company = companies.findAll().stream().findFirst()
//                .orElseThrow(() -> new IllegalStateException("No company configured"));
//
//        List<Shipment> periodShipments = shipments.findByCompanyIdAndDateRange(company.getId(), start, end);
//        BigDecimal revenue = shipments.calculateRevenue(company.getId(), start, end);
//        List<Shipment> undelivered = getUndeliveredShipments();
//
//        return new Reports(
//                getAllEmployees(),
//                getAllClients(),
//                getAllShipments(),
//                undelivered,
//                start,
//                end,
//                revenue
//        );
//    }
//
//    // -------------------------------------------------------------------------
//    // Helpers
//    // -------------------------------------------------------------------------
//
//    private User addUser(String username, String password, String email, Role role) {
//        User user = new User();
//        user.setUsername(username);
//        user.setPasswordHash(hashPassword(password));
//        user.setEmail(email);
//        user.setFirstName(defaultFirstName(username));
//        user.setLastName("User");
//        user.setRole(role);
//        return users.save(user);
//    }
//
//    private String defaultFirstName(String username) {
//        if (username == null || username.isBlank()) return "User";
//        return username.substring(0, 1).toUpperCase() + username.substring(1);
//    }
//
//    private String hashPassword(String password) {
//        try {
//            MessageDigest digest = MessageDigest.getInstance("SHA-256");
//            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
//            StringBuilder builder = new StringBuilder();
//            for (byte b : hash) builder.append(String.format("%02x", b));
//            return builder.toString();
//        } catch (NoSuchAlgorithmException e) {
//            throw new IllegalStateException("SHA-256 is not available", e);
//        }
//    }
//
//    private void requireText(String value, String message) {
//        if (value == null || value.isBlank()) throw new IllegalArgumentException(message);
//    }
//
//    private <T> List<T> sortById(List<T> items) {
//        return items.stream()
//                .sorted(Comparator.comparing(item -> {
//                    try {
//                        return ((Number) item.getClass().getMethod("getId").invoke(item)).longValue();
//                    } catch (ReflectiveOperationException e) {
//                        throw new IllegalStateException("Could not read id from " + item.getClass().getName(), e);
//                    }
//                }))
//                .toList();
//    }
//
//    private void seed() {
//        Company company = new Company();
//        company.setName("Dkont");
//        company.setBasePricePerKg(new BigDecimal("2.00"));
//        company.setAddressSurcharge(new BigDecimal("5.00"));
//        company = companies.save(company);
//
//        Office sofia = makeOffice(company, "Sofia", "12 Shipka St.");
//        Office plovdiv = makeOffice(company, "Plovdiv", "44 Maritsa Blvd.");
//        Office varna = makeOffice(company, "Varna", "8 Primorski Blvd.");
//
//        User adminUser  = addUser(seedAdminUsername, seedAdminPassword, "admin@example.test", Role.ADMIN);
//        User elenaUser  = addUser("elena",   "demo", "elena@example.test",   Role.EMPLOYEE);
//        User mariaUser  = addUser("maria",   "demo", "maria@example.test",   Role.CLIENT);
//        User ivanUser   = addUser("ivan",    "demo", "ivan@example.test",    Role.CLIENT);
//
//        Employee admin = makeEmployee(adminUser, company, sofia, EmployeeType.OFFICE_EMPLOYEE);
//        Employee elena = makeEmployee(elenaUser, company, sofia, EmployeeType.OFFICE_EMPLOYEE);
//
//        Client maria = makeClient(mariaUser);
//        Client ivan  = makeClient(ivanUser);
//
//        // Sample shipment: maria sends to ivan, delivered to plovdiv office
//        Shipment s = new Shipment();
//        s.setCompany(company);
//        s.setSender(maria);
//        s.setRecipient(ivan);
//        s.setRegisteredBy(elena);
//        s.setDeliveryType(DeliveryType.TO_OFFICE);
//        s.setDestinationOffice(plovdiv);
//        s.setWeight(new BigDecimal("2.500"));
//        s.setStatus(ShipmentStatus.IN_TRANSIT);
//        saveShipment(s);
//    }
//
//    private Office makeOffice(Company company, String city, String address) {
//        Office o = new Office();
//        o.setCompany(company);
//        o.setCity(city);
//        o.setAddress(address);
//        return offices.save(o);
//    }
//
//    private Employee makeEmployee(User user, Company company, Office office, EmployeeType type) {
//        Employee e = new Employee();
//        e.setUser(user);
//        e.setCompany(company);
//        e.setOffice(office);
//        e.setEmployeeType(type);
//        return employees.save(e);
//    }
//
//    private Client makeClient(User user) {
//        Client c = new Client();
//        c.setUser(user);
//        return clients.save(c);
//    }
//
//    // -------------------------------------------------------------------------
//    // Records
//    // -------------------------------------------------------------------------
//
//    public record Snapshot(
//            List<User> users,
//            List<Company> companies,
//            List<Employee> employees,
//            List<Client> clients,
//            List<Office> offices,
//            List<Shipment> shipments) {}
//
//    public record Reports(
//            List<Employee> employees,
//            List<Client> clients,
//            List<Shipment> shipments,
//            List<Shipment> undeliveredShipments,
//            LocalDateTime from,
//            LocalDateTime to,
//            BigDecimal revenue) {}
//
//    public record RegisterClientRequest(
//            String username,
//            String password,
//            String email) {}
//
//    public record AuthSession(
//            long userId,
//            String username,
//            String email,
//            Role role,
//            Long clientId,
//            Long employeeId,
//            EmployeeType employeeType,
//            Long officeId) {}
//}
