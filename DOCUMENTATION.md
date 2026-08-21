# Dkont Logistics — Backend & Database Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [Entity Relationships](#4-entity-relationships)
5. [Enums & Constants](#5-enums--constants)
6. [Security Architecture](#6-security-architecture)
7. [API Endpoints](#7-api-endpoints)
8. [Service Layer — Business Logic](#8-service-layer--business-logic)
9. [Repository Layer — Database Queries](#9-repository-layer--database-queries)
10. [Error Handling](#10-error-handling)
11. [Application Startup](#11-application-startup)

---

## 1. Project Overview

A logistics company management system that allows companies to:
- Register and track shipments between clients
- Manage offices, employees (couriers and office workers), and clients
- Enforce role-based delivery rules
- Generate reports on revenue, staff, and shipment activity

The backend is a **stateless REST API**. Every request must carry a valid JWT token in the `Authorization` header (except login and register). The frontend is a React SPA that stores the token in `localStorage`.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.5.0 |
| Security | Spring Security + JJWT 0.12.6 |
| Persistence | Spring Data JPA + Hibernate |
| Database | MySQL / MariaDB |
| Build tool | Maven |
| Utilities | Lombok (`@RequiredArgsConstructor`, `@Data`) |
| Password hashing | SHA-256 (custom, no salt) |
| Token signing | HMAC-SHA256 |

---

## 3. Database Schema

### Table: `users`
The login identity table. Every person in the system (admin, employee, client) has a row here.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | Primary key |
| `username` | VARCHAR | NOT NULL, UNIQUE | Login name |
| `password_hash` | VARCHAR | NOT NULL | SHA-256 hex hash of the password |
| `email` | VARCHAR | UNIQUE, nullable | Optional email address |
| `first_name` | VARCHAR | NOT NULL | First name |
| `last_name` | VARCHAR | NOT NULL | Last name |
| `role` | VARCHAR(ENUM) | NOT NULL | `ADMIN`, `EMPLOYEE`, or `CLIENT` |
| `created_at` | DATETIME | NOT NULL, no update | Set automatically on insert via `@PrePersist` |

**Notes:**
- `password_hash` is annotated `@JsonIgnore` — never returned in API responses
- `created_at` is set by `@PrePersist` and can never be updated after creation
- A user can be linked to either an `employee` row or a `client` row, never both

---

### Table: `company`
A logistics company. Multiple companies can exist in the system. All pricing is configured per company.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | Primary key |
| `name` | VARCHAR | NOT NULL, UNIQUE | Company display name |
| `base_price_per_kg` | DECIMAL(10,2) | NOT NULL | Price charged per kilogram of shipment weight |
| `address_surcharge` | DECIMAL(10,2) | NOT NULL | Extra charge added for door-to-door (TO_ADDRESS) deliveries |

**Notes:**
- `basePricePerKg` and `addressSurcharge` drive all price calculations in `ShipmentServiceImpl.calculatePrice()`
- Has `@OneToMany` to `offices`, `employees`, and `shipments` (all `@JsonIgnore` to prevent infinite loops)

---

### Table: `office`
A physical office branch belonging to a company. Employees work at an office. TO_OFFICE shipments are delivered to an office.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | Primary key |
| `company_id` | BIGINT | FK → `company.id`, NOT NULL | Which company this office belongs to |
| `address` | VARCHAR | NOT NULL | Street address |
| `city` | VARCHAR | NOT NULL | City |
| `phone` | VARCHAR | nullable | Office phone number |

**Notes:**
- `company` relationship is `LAZY` — only loaded when explicitly accessed
- Has `@OneToMany` to `employees` and `incomingShipments` (both `@JsonIgnore`)
- JSON serialization exposes `companyId` (flat ID) not the full company object

---

### Table: `employee`
Represents a staff member (courier or office worker). Always linked to exactly one `user` account.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | Primary key |
| `user_id` | BIGINT | FK → `users.id`, NOT NULL, UNIQUE | Linked login account (one-to-one) |
| `company_id` | BIGINT | FK → `company.id`, NOT NULL | Which company employs this person |
| `office_id` | BIGINT | FK → `office.id`, nullable | Which office they work at (nullable for couriers who may not be office-based) |
| `employee_type` | VARCHAR(ENUM) | NOT NULL | `COURIER` or `OFFICE_EMPLOYEE` |

**Notes:**
- `user` is `EAGER` — always loaded with the employee
- `company` and `office` are `LAZY` — loaded only when accessed (or forced by `@EntityGraph`)
- Delegates name/email getters to the linked `User`: `getFirstName()`, `getLastName()`, `getEmail()`
- JSON: `user`, `company`, `office` objects are `@JsonIgnore`; flat IDs `userId`, `companyId`, `officeId` are exposed instead
- The office link is critical for the delivery enforcement rule: an OFFICE_EMPLOYEE can only mark shipments as delivered if their `officeId` matches the shipment's `destinationOfficeId`

---

### Table: `client`
Represents a customer who sends or receives shipments. Always linked to a `user` account.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | Primary key |
| `user_id` | BIGINT | FK → `users.id`, NOT NULL, UNIQUE | Linked login account (one-to-one) |
| `phone` | VARCHAR | nullable | Client phone number |

**Notes:**
- Delegates name/email/username getters to the linked `User`
- Has `@OneToMany` to `sentShipments` and `receivedShipments` (both `@JsonIgnore`)
- JSON: `user` object is `@JsonIgnore`; flat `userId` is exposed

---

### Table: `shipment`
The core business entity. Tracks a package from registration through to delivery.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | Primary key |
| `company_id` | BIGINT | FK → `company.id`, NOT NULL | Which company is handling this shipment |
| `sender_id` | BIGINT | FK → `client.id`, NOT NULL | Client who is sending the package |
| `recipient_id` | BIGINT | FK → `client.id`, NOT NULL | Client who will receive the package |
| `registered_by_id` | BIGINT | FK → `employee.id`, NOT NULL | Employee who registered the shipment |
| `delivery_type` | VARCHAR(ENUM) | NOT NULL | `TO_ADDRESS` or `TO_OFFICE` |
| `delivery_address` | VARCHAR | nullable | Required when `delivery_type = TO_ADDRESS` |
| `destination_office_id` | BIGINT | FK → `office.id`, nullable | Required when `delivery_type = TO_OFFICE` |
| `description` | VARCHAR | nullable | Optional package description |
| `weight` | DECIMAL(10,3) | NOT NULL | Weight in kilograms |
| `price` | DECIMAL(10,2) | NOT NULL | Calculated server-side (never from client) |
| `status` | VARCHAR(ENUM) | NOT NULL | `REGISTERED`, `IN_TRANSIT`, `DELIVERED`, or `CANCELLED` |
| `registered_at` | DATETIME | NOT NULL, no update | Set automatically on insert via `@PrePersist` |
| `delivered_at` | DATETIME | nullable | Set when status changes to `DELIVERED` |

**Notes:**
- `@PrePersist` sets `registeredAt = now()` and `status = REGISTERED` automatically on every new shipment
- `price` is always set by `calculatePrice()` server-side — the client cannot set it
- All FK relationships are `LAZY` — avoids N+1 queries; loaded explicitly when needed
- JSON: full entity objects are `@JsonIgnore`; flat IDs are exposed (`senderClientId`, `receiverClientId`, `registeredByEmployeeId`, `destinationOfficeId`, `companyId`)
- `getSentDate()` and `getReceivedDate()` are computed properties that return the date portion (string) of the datetime columns

---

## 4. Entity Relationships

```
company (1) ─────────────────────── (N) office
company (1) ─────────────────────── (N) employee
company (1) ─────────────────────── (N) shipment

office  (1) ─────────────────────── (N) employee
office  (1) ─────────────────────── (N) shipment   [as destinationOffice]

users   (1) ─────────────────────── (1) employee
users   (1) ─────────────────────── (1) client

client  (1) ─────────────────────── (N) shipment   [as sender]
client  (1) ─────────────────────── (N) shipment   [as recipient]

employee(1) ─────────────────────── (N) shipment   [as registeredBy]
```

### Key design decisions

**Why does `Employee` point to `User`, not the other way?**
`User` is just the login record. `Employee` and `Client` are business entities. A user can be promoted or linked to business data without changing the login record.

**Why are FKs stored as separate ID columns in JSON?**
JPA entities hold full object references (e.g. `private Client sender`). But returning full nested objects in JSON would cause infinite loops (`Shipment → Client → Shipment → ...`). The solution: mark the full object `@JsonIgnore`, and expose a flat ID getter like `getSenderClientId()` that the frontend can use to look up the object from its own cached data.

---

## 5. Enums & Constants

### `Role`
Assigned to `User`. Controls what API endpoints the user can access.

| Value | Description |
|---|---|
| `ADMIN` | Full access to everything including user management |
| `EMPLOYEE` | Access to companies, offices, employees, clients, shipments |
| `CLIENT` | Access only to their own shipments and client data |

### `EmployeeType`
Assigned to `Employee`. Controls which shipments the employee can mark as delivered.

| Value | Description |
|---|---|
| `COURIER` | Can only deliver `TO_ADDRESS` shipments |
| `OFFICE_EMPLOYEE` | Can only deliver `TO_OFFICE` shipments at their own office |

### `DeliveryType`
Assigned to `Shipment`. Determines delivery method and price calculation.

| Value | Description |
|---|---|
| `TO_ADDRESS` | Door-to-door delivery. Requires `deliveryAddress`. Price includes `addressSurcharge`. |
| `TO_OFFICE` | Client picks up at an office. Requires `destinationOffice`. No surcharge. |

### `ShipmentStatus`
The lifecycle of a shipment.

| Value | Transition | Description |
|---|---|---|
| `REGISTERED` | Initial (set by `@PrePersist`) | Shipment created, not yet picked up |
| `IN_TRANSIT` | Via `PUT /api/shipment/{id}/transit` | Picked up and on the way |
| `DELIVERED` | Via `PUT /api/shipment/{id}/deliver` | Delivered to recipient |
| `CANCELLED` | Via `PUT /api/shipment/{id}/cancel` | Cancelled, excluded from revenue |

---

## 6. Security Architecture

### Password Hashing — `AuthServiceImpl.hashPassword()`
```
plaintext password
  → UTF-8 bytes
  → SHA-256 digest (32 bytes)
  → each byte to 2-char hex
  → 64-character hex string stored in DB
```
No salt is used. The same logic is registered as Spring Security's `PasswordEncoder` in `SecurityConfig`.

### JWT Token — `JwtUtil`
Structure of each token:

| Claim | Value | Source |
|---|---|---|
| `sub` (subject) | username | Stored at login |
| `role` | e.g. `"ADMIN"` | User's role at login time |
| `iat` (issued at) | timestamp | Set at token creation |
| `exp` (expiration) | iat + 24 hours | Configurable via `jwt.expiration` |
| Signature | HMAC-SHA256 | Signed with `jwt.secret` from `application.properties` |

### Request Authentication Flow
```
Every HTTP request
  │
  ▼
JwtAuthenticationFilter.doFilterInternal()
  ├── Read "Authorization" header
  ├── Strip "Bearer " prefix
  ├── JwtUtil.isTokenValid(token)
  │     ├── verifyWith(getSigningKey())  → checks HMAC-SHA256 signature
  │     └── parseSignedClaims(token)    → checks expiry date
  ├── JwtUtil.extractUsername(token)    → reads "sub" claim
  ├── userDetailsService.loadUserByUsername(username)  → DB lookup
  └── SecurityContextHolder.setAuthentication(...)
        │
        ▼
  SecurityConfig URL rules checked
  └── 401/403 if role doesn't match endpoint requirement
        │
        ▼
  Controller method executes
```

### Security Rules (from `SecurityConfig`)

| URL Pattern | Required Role |
|---|---|
| `/api/auth/**` | Public — no token needed |
| `/api/user/**` | `ADMIN` only |
| `/api/company/**` | `ADMIN` or `EMPLOYEE` |
| `/api/office/**` | `ADMIN` or `EMPLOYEE` |
| `/api/employee/**` | `ADMIN` or `EMPLOYEE` |
| `/api/client/**` | `ADMIN`, `EMPLOYEE`, or `CLIENT` |
| `/api/shipment/**` | `ADMIN`, `EMPLOYEE`, or `CLIENT` |
| `/api/gps/**` | `ADMIN` or `EMPLOYEE` |
| Everything else | Any authenticated user |

---

## 7. API Endpoints

### Auth — `/api/auth`
No token required for these endpoints.

| Method | URL | Parameters | Returns | Description |
|---|---|---|---|---|
| POST | `/api/auth/login` | `?username=&password=` (query params) | `LoginResponse` | Validate credentials, issue JWT |
| POST | `/api/auth/register` | `?username=&password=&email=` (query params) | `LoginResponse` | Create CLIENT account and issue JWT |

**`LoginResponse` fields:**
```json
{
  "token":       "eyJhbGciOi...",
  "userId":      1,
  "username":    "john",
  "email":       "john@example.com",
  "role":        "EMPLOYEE",
  "clientId":    null,
  "employeeId":  3,
  "employeeType":"COURIER",
  "officeId":    2
}
```

---

### Companies — `/api/company`
Requires `ADMIN` or `EMPLOYEE` role.

| Method | URL | Body | Returns | Description |
|---|---|---|---|---|
| GET | `/api/company` | — | `List<Company>` | All companies |
| GET | `/api/company/{id}` | — | `Company` | One company by ID |
| POST | `/api/company` | `Company` JSON | `Company` | Create a company |
| PUT | `/api/company/{id}` | `Company` JSON | `Company` | Update a company |
| DELETE | `/api/company/{id}` | — | void | Delete a company |

---

### Offices — `/api/office`
Requires `ADMIN` or `EMPLOYEE` role.

| Method | URL | Body | Returns | Description |
|---|---|---|---|---|
| GET | `/api/office` | — | `List<Office>` | All offices |
| GET | `/api/office/{id}` | — | `Office` | One office by ID |
| GET | `/api/office/company-id/{companyId}` | — | `List<Office>` | All offices for a company |
| POST | `/api/office` | `Office` JSON | `Office` | Create an office |
| PUT | `/api/office` | `Office` JSON | `Office` | Update an office |
| DELETE | `/api/office/{id}` | — | void | Delete an office |

---

### Employees — `/api/employee`
Requires `ADMIN` or `EMPLOYEE` role.

| Method | URL | Body | Returns | Description |
|---|---|---|---|---|
| GET | `/api/employee` | — | `List<Employee>` | All employees |
| GET | `/api/employee/{id}` | — | `Employee` | One employee by ID |
| GET | `/api/employee/by-user/{userId}` | — | `Employee` | Employee linked to a user ID |
| GET | `/api/employee/by-company/{companyId}` | — | `List<Employee>` | All employees at a company |
| GET | `/api/employee/by-type/{type}` | — | `List<Employee>` | All employees of a given type (`COURIER` or `OFFICE_EMPLOYEE`) |
| POST | `/api/employee` | `Employee` JSON | `Employee` | Create an employee |
| PUT | `/api/employee/{id}` | `Employee` JSON | `Employee` | Update an employee |
| DELETE | `/api/employee/{id}` | — | void | Delete an employee |

---

### Clients — `/api/client`
Requires `ADMIN`, `EMPLOYEE`, or `CLIENT` role.

| Method | URL | Body | Returns | Description |
|---|---|---|---|---|
| GET | `/api/client` | — | `List<Client>` | All clients |
| GET | `/api/client/{id}` | — | `Client` | One client by ID |
| GET | `/api/client/by-user-id/{userId}` | — | `Client` | Client linked to a user ID |
| POST | `/api/client` | `Client` JSON | `Client` | Create a client |
| PUT | `/api/client/{id}` | `Client` JSON | `Client` | Update a client |
| DELETE | `/api/client/{id}` | — | void | Delete a client |

---

### Users — `/api/user`
Requires `ADMIN` role only.

| Method | URL | Body / Params | Returns | Description |
|---|---|---|---|---|
| GET | `/api/user` | — | `List<User>` | All user accounts |
| GET | `/api/user/{id}` | — | `User` | One user by ID |
| GET | `/api/user/by-role/{role}` | — | `List<User>` | All users with a given role |
| POST | `/api/user` | `User` JSON | `User` | Create a user account |
| PUT | `/api/user/{id}` | `User` JSON | `User` | Update name and email |
| PUT | `/api/user/{id}/role` | `?role=ADMIN` (query param) | `User` | Change a user's role |
| DELETE | `/api/user/{id}` | — | void | Delete a user account |

---

### Shipments — `/api/shipment`
Requires `ADMIN`, `EMPLOYEE`, or `CLIENT` role.

| Method | URL | Body / Params | Returns | Description |
|---|---|---|---|---|
| GET | `/api/shipment` | — | `List<Shipment>` | All shipments |
| GET | `/api/shipment/{id}` | — | `Shipment` | One shipment by ID |
| GET | `/api/shipment/by-sender/{clientId}` | — | `List<Shipment>` | Shipments by sender |
| GET | `/api/shipment/by-recipient/{clientId}` | — | `List<Shipment>` | Shipments by recipient |
| GET | `/api/shipment/by-client/{clientId}` | — | `List<Shipment>` | Shipments where client is sender OR recipient |
| GET | `/api/shipment/by-employee/{employeeId}` | — | `List<Shipment>` | Shipments registered by an employee |
| GET | `/api/shipment/undelivered` | — | `List<Shipment>` | Shipments not yet DELIVERED or CANCELLED |
| GET | `/api/shipment/revenue` | `?companyId=&from=&to=` | `BigDecimal` | Total revenue for a company in a date range |
| POST | `/api/shipment` | `Shipment` JSON | `Shipment` | Register a new shipment |
| PUT | `/api/shipment/{id}` | `Shipment` JSON | `Shipment` | Update shipment details |
| PUT | `/api/shipment/{id}/deliver` | — | 204 No Content | Mark as DELIVERED (role enforced) |
| PUT | `/api/shipment/{id}/transit` | — | 204 No Content | Mark as IN_TRANSIT |
| PUT | `/api/shipment/{id}/cancel` | — | 204 No Content | Mark as CANCELLED |
| DELETE | `/api/shipment/{id}` | — | void | Delete a shipment |

**Delivery enforcement on `PUT /{id}/deliver`:**
The endpoint reads the caller's username from the JWT (not the request body) and enforces:
- `ADMIN` → always allowed
- `COURIER` → only `TO_ADDRESS` shipments
- `OFFICE_EMPLOYEE` → only `TO_OFFICE` shipments, only at their own office
- Violation → 400 Bad Request with a descriptive message

---

### GPS — `/api/gps`
Requires `ADMIN` or `EMPLOYEE` role.

| Method | URL | Body | Returns | Description |
|---|---|---|---|---|
| GET | `/api/gps` | — | `Collection<GpsPosition>` | All current GPS positions |
| POST | `/api/gps/{id}` | `{ "lat": 0.0, "lng": 0.0 }` | void | Update position for a courier ID |

**Note:** GPS data is stored in-memory in `GpsStore` — it is not persisted to the database. Data is lost on server restart.

---

## 8. Service Layer — Business Logic

### `AuthServiceImpl`

**`hashPassword(String password)`** — Static method. Runs SHA-256 on the password bytes, returns a 64-char hex string. Called during login (to compare) and registration (to store).

**`login(String username, String password)`** — Loads user from DB, hashes the input, compares to stored hash. Throws on mismatch. Returns `AuthSession` record with all session fields (role, IDs).

**`registerClient(String username, String password, String email)`** — Creates a `User` (role=CLIENT) and a linked `Client` in one transaction. Throws if username already exists.

---

### `CompanyServiceImpl`

**`getAllCompanies()`** — Returns all companies. Used to populate dropdowns and admin views.

**`getCompanyById(id)`** — Fetches one company or throws `IllegalArgumentException`. Used as a helper by update and delete.

**`createCompany(company)`** — Saves a new company with its pricing configuration.

**`updateCompany(id, updated)`** — Loads existing → copies name, basePricePerKg, addressSurcharge → saves.

**`deleteCompany(id)`** — Deletes by ID. Cascades to offices, employees, and shipments (`CascadeType.ALL`).

---

### `OfficeServiceImpl`

**`getAllOffices()`** — All offices, all companies.

**`getOfficeById(id)`** — One office or throws.

**`getOfficesByCompany(companyId)`** — All offices belonging to a specific company.

**`createOffice(office)`** — Saves a new office linked to a company.

**`updateOffice(id, updated)`** — Loads → copies address, city, phone, company → saves.

**`deleteOffice(id)`** — Removes the office.

---

### `EmployeeServiceImpl`

**`getAllEmployees()`** — Returns all employees. Repository uses `@EntityGraph` to load `user`, `company`, `office` in one JOIN query.

**`getEmployeeById(id)`** — One employee or throws.

**`getEmployeeByUserId(userId)`** — Find the employee linked to a specific user ID.

**`getEmployeesByCompany(companyId)`** — All employees at a company (used in staff reports).

**`getEmployeesByType(employeeType)`** — All COURIERs or OFFICE_EMPLOYEEs system-wide.

**`createEmployee(employee)`** — Saves new employee with their type, company, and office assignments.

**`updateEmployee(id, updated)`** — Loads → copies company, office, employeeType → saves.

**`deleteEmployee(id)`** — Removes the employee.

---

### `ClientServiceImpl`

**`getAllClients()`** — All clients.

**`getClientById(id)`** — One client or throws.

**`getClientByUserId(userId)`** — Client linked to a given user account.

**`createClient(client)`** — Saves new client.

**`updateClient(id, updated)`** — Loads → copies phone, user → saves.

**`deleteClient(id)`** — Removes the client.

---

### `UserServiceImpl`

**`getAllUsers()`** — All user accounts (admin-only view).

**`getUserById(id)`** — One user or throws.

**`getUsersByRole(role)`** — All users with a given role.

**`createUser(username, password, email, firstName, lastName, role)`** — Hashes the password and saves a new user.

**`updateUserDetails(id, firstName, lastName, email)`** — Loads → updates name and email → saves.

**`changeUserRole(id, role)`** — Loads → changes role → saves.

**`deleteUser(id)`** — Removes the user account.

---

### `ShipmentServiceImpl`

**`getAllShipments()`** — Every shipment. Used by admin and employee views.

**`getShipmentById(id)`** — One shipment or throws. Used as a helper throughout the service.

**`getShipmentsBySender(clientId)`** — Shipments where that client is the sender.

**`getShipmentsByRecipient(clientId)`** — Shipments where that client is the recipient.

**`getShipmentsByClient(clientId)`** — Shipments where client is sender **or** recipient (for CLIENT dashboard).

**`getShipmentsByEmployee(employeeId)`** — Shipments registered by a specific employee.

**`getUndeliveredShipments()`** — All shipments that are not DELIVERED and not CANCELLED (actively outstanding).

**`createShipment(shipment)`**
1. Validates required fields (sender, recipient, employee, weight, deliveryType)
2. Validates delivery-type-specific rules (TO_ADDRESS needs address, TO_OFFICE needs office)
3. Calls `attachRelations()` to replace shallow ID stubs with full entities
4. Calls `calculatePrice()` to set server-side price
5. Saves and returns

**`updateShipment(id, updated)`** — Loads existing → copies data fields → recalculates price → saves. Does not change status.

**`markDelivered(id, callerUsername)`**
- Reads caller identity from JWT (via `auth.getName()` in controller)
- ADMIN → skip checks, mark delivered
- COURIER → only allowed for `TO_ADDRESS` shipments
- OFFICE_EMPLOYEE → only allowed for `TO_OFFICE` shipments at their own office
- Anyone else → `IllegalArgumentException` → 400 response
- Sets `status = DELIVERED` and `deliveredAt = now()`

**`markInTransit(id)`** — Sets status to `IN_TRANSIT`.

**`cancelShipment(id)`** — Sets status to `CANCELLED`.

**`deleteShipment(id)`** — Hard deletes the shipment.

**`calculateRevenue(companyId, from, to)`** — Delegates to the SQL `SUM(price)` query in the repository.

**`getShipmentsByDateRange(companyId, from, to)`** — Returns the actual shipment rows for a company within a date range.

**`attachRelations(shipment)`** *(private)*
Replaces shallow `{ "id": 5 }` objects from the frontend request with fully-loaded JPA entities. Covers: company, sender, recipient, registeredBy employee, destination office.

**`calculatePrice(shipment)`** *(private)*
```
price = company.basePricePerKg × shipment.weight
if (deliveryType == TO_ADDRESS):
    price += company.addressSurcharge
```

---

## 9. Repository Layer — Database Queries

### `EmployeeRepository`
All methods use `@EntityGraph(attributePaths = {"user", "company", "office"})` to force a single JOIN query instead of N+1 separate queries.

| Method | Query Type | Description |
|---|---|---|
| `findAll()` | Overridden JPA | All employees with full relations |
| `findById(id)` | Overridden JPA | One employee with full relations |
| `findByUserId(userId)` | JPQL: `WHERE e.user.id = :userId` | Employee linked to a user |
| `findByUsername(username)` | JPQL: `WHERE e.user.username = :username` | Employee by login name (used in delivery enforcement) |
| `findByCompanyId(companyId)` | JPQL: `WHERE e.company.id = :companyId` | All employees at a company |
| `findByOfficeId(officeId)` | JPQL: `WHERE e.office.id = :officeId` | All employees at an office |
| `findByEmployeeType(type)` | Spring Data derived | All employees of a given type |
| `findByCompanyIdAndEmployeeType(companyId, type)` | JPQL | All employees of a given type at a given company |

---

### `ShipmentRepository`

| Method | Query Type | Description |
|---|---|---|
| `findBySenderId(senderId)` | JPQL: `WHERE s.sender.id = :senderId` | Shipments by sender |
| `findByRecipientId(recipientId)` | JPQL: `WHERE s.recipient.id = :recipientId` | Shipments by recipient |
| `findByRegisteredById(employeeId)` | JPQL: `WHERE s.registeredBy.id = :employeeId` | Shipments registered by an employee |
| `findByStatusNot(status)` | Spring Data derived | Shipments with any status except the given one |
| `findByStatus(status)` | Spring Data derived | Shipments with exactly the given status |
| `findAllByClientId(clientId)` | JPQL: `WHERE s.sender.id = :id OR s.recipient.id = :id` | All shipments for a client (both roles) |
| `calculateRevenue(companyId, from, to)` | JPQL: `SELECT COALESCE(SUM(s.price), 0) ...` | Total revenue — excludes cancelled shipments (no WHERE clause for status, so cancelled shipments ARE counted — worth noting) |
| `findByCompanyIdAndDateRange(companyId, from, to)` | JPQL | Shipments for a company in a date range |

---

### `UserRepository`

| Method | Description |
|---|---|
| `findByUsername(username)` | Find user by login name |
| `findByRole(role)` | All users with a given role (used by `DataSeeder`) |

---

### `CompanyRepository`, `ClientRepository`, `OfficeRepository`
Standard `JpaRepository` — use the inherited `findById`, `findAll`, `save`, `deleteById` methods. No custom queries needed.

---

## 10. Error Handling

All exceptions thrown in service methods are caught by `ApiExceptionHandler` (`@RestControllerAdvice`).

### `IllegalArgumentException`
Thrown when business validation fails (entity not found, wrong role, bad delivery type, etc.).

- If message is `"Invalid username or password"` → returns **401 Unauthorized**
- All other cases → returns **400 Bad Request**

Response format:
```json
{
  "timestamp": "2026-05-22T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Only a COURIER can mark a TO_ADDRESS shipment as delivered"
}
```

### `MissingServletRequestParameterException`
Thrown by Spring when a required query parameter is missing (e.g. forgetting `username` on `/login`).
Returns **400 Bad Request** with message: `"Missing required parameter: <name>"`

### 401 / 403 from Spring Security
- **401** — no token provided or token is expired/invalid
- **403** — valid token but the user's role doesn't have access to the requested URL

These are returned by Spring Security before the request even reaches a controller.

---

## 11. Application Startup

### `DataSeeder` — `@PostConstruct seed()`
Runs automatically once after the Spring context loads. Checks if any `ADMIN` user exists in the database. If none exists, creates one using credentials from `application.properties`:

```properties
admin.seed.username=admin
admin.seed.password=admin
admin.seed.email=admin@localhost
```

This ensures there is always at least one admin account on a fresh database. Safe to run on every restart — it skips seeding if an admin already exists.

### `application.properties` Required Keys

| Key | Example Value | Purpose |
|---|---|---|
| `spring.datasource.url` | `jdbc:mysql://localhost:3306/logistics` | Database connection URL |
| `spring.datasource.username` | `root` | DB username |
| `spring.datasource.password` | `password` | DB password |
| `jwt.secret` | `dkont-logistics-app-jwt-secret-key-2026!` | HMAC-SHA256 signing key for JWTs |
| `jwt.expiration` | `86400000` | Token lifetime in milliseconds (24 hours) |
| `admin.seed.username` | `admin` | Default admin username |
| `admin.seed.password` | `admin` | Default admin password |
| `admin.seed.email` | `admin@localhost` | Default admin email |

> **Security note:** `application.properties` should be in `.gitignore` in production and `jwt.secret` should be set via an environment variable, not committed to the repository.
