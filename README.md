# Dkont — Logistics Company Management System

Full-stack web application for running a courier/logistics company: clients, employees, offices, shipments with a full lifecycle, role-based access control, automatic server-side pricing, live courier GPS tracking on a map, and revenue reports.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.5 (Spring MVC REST API) |
| Security | Spring Security, JWT (JJWT), stateless auth |
| Persistence | Spring Data JPA / Hibernate |
| Database | MySQL / MariaDB |
| Frontend | React 19, Vite 7, React Router 7 |
| Maps | MapLibre GL + PMTiles (live courier tracking) |
| i18n | i18next / react-i18next (Bulgarian & English) |
| UI | Framer Motion, Lucide icons |
| Build | Maven, npm |

## Key Features

- **JWT authentication** — stateless REST API; every request (except login/register) carries a signed token. Admin user is seeded on first startup.
- **Role-based access control** — three roles with different views and permissions:

  | Role | What they can do |
  |---|---|
  | `ADMIN` | Full CRUD over companies, offices, employees, clients, users |
  | `EMPLOYEE` | Register and process shipments; **couriers** handle only address deliveries, **office employees** only shipments of their own office |
  | `CLIENT` | Sees only shipments where they are sender or recipient |

- **Shipment lifecycle** — `REGISTERED → IN_TRANSIT → DELIVERED` (or `CANCELLED`), with delivery either to an office (`TO_OFFICE`) or to an address (`TO_ADDRESS`).
- **Automatic pricing** — price is always calculated server-side (`basePricePerKg × weight + address surcharge`) so clients can never submit arbitrary prices.
- **Live GPS tracking** — couriers report positions via the API; the frontend renders them in real time on a MapLibre map.
- **Reports** — revenue per company for a date range; sent-but-undelivered shipments.
- **Bilingual UI** — Bulgarian and English via i18next.

## Architecture

```
frontend/  React SPA (Vite) ── /api proxy ──► Spring Boot REST API (port 8082)
                                                │
src/main/java/com/example/logistics/            │
├── web/        REST controllers + error handling
├── service/    business logic (pricing, role rules, reports)
├── repo/       Spring Data JPA repositories
├── model/      JPA entities + enums
└── security/   JWT filter, user details, security config
                                                │
                                          MySQL / MariaDB
```

## Getting Started

Prerequisites: Java 21, Maven 3.9+, Node.js 20+, a running MySQL/MariaDB instance.

```bash
# 1. Backend (creates the schema automatically on first run)
mvn spring-boot:run

# 2. Frontend (second terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the Vite dev server proxies `/api` to the backend on port 8082.

Database credentials and the JWT secret are configured in `src/main/resources/application.properties`; override them for your environment.

## API Overview

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/register` |
| Shipments | CRUD + `/by-sender`, `/by-recipient`, `/by-client`, `/by-employee`, `/undelivered`, `/revenue`, and status transitions `/{id}/transit`, `/{id}/deliver`, `/{id}/cancel` |
| Companies / Offices / Employees / Clients / Users | standard CRUD + lookups (`/by-company`, `/by-type`, `/by-role`, …) |
| GPS | `POST /api/gps/{id}` — courier position updates |

Full backend and database documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## Testing

```bash
mvn test            # backend tests
cd frontend && npm run build   # production frontend build
```
