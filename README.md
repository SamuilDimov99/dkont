# Dkont

Educational web application for managing a logistics company. The system covers clients, employees, offices, shipments, role-based views, automatic shipment pricing, and operational reports.

## Tech Stack

- Backend: Java 21, Spring Boot 3.5, Spring MVC REST API
- Frontend: React, JSX, Vite
- Data storage: PostgreSQL through Spring Data JPA
- Build tools: Maven and npm

## Requirements

Install these before running the project:

- Java 21
- Maven 3.9+
- Node.js 20+ or newer
- npm
- Docker, if you want to run PostgreSQL with the included compose file

Check your versions:

```bash
java -version
mvn -version
node -v
npm -v
```

## Installation

Clone the repository, then install the frontend dependencies:

```bash
git clone <repository-url>
cd dkont
cd frontend
npm install
```

The backend dependencies are downloaded automatically by Maven when you run or test the backend.

## Running The Application

Use one of these PostgreSQL setup options:

Option 1: connect to an existing PostgreSQL instance on the host OS. Follow the command list in:

```text
database/admin-command-list.txt
```

Option 2: start PostgreSQL with Docker from the project root:

```bash
docker compose -f database/docker-compose.yml up -d
```

Start the backend API from the project root:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8082
```

In a second terminal, start the React frontend:

```bash
cd frontend
npm run dev
```

Open the frontend in your browser:

```text
http://localhost:5173
```

The Vite dev server proxies `/api` requests to:

```text
http://127.0.0.1:8082
```

The backend defaults to:

```text
DATABASE_URL=jdbc:postgresql://localhost:5432/dkont
DATABASE_USERNAME=dkont
DATABASE_PASSWORD=dkont
SKIP_AUTHORIZATION_ON_LOCALHOST=false
ADMIN_API_TOKEN=
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```

Override those environment variables for another PostgreSQL database.

## Demo Login

Seeded users:

```text
admin / admin
elena / demo
nikolay / demo
maria / demo
ivan / demo
stella / demo
```

You can also switch roles from the UI to inspect admin, employee, and client behavior.

Development seeds the administrator as `admin / admin`.

Production profile seeds the administrator as:

```text
admin / 5vbwGBIp4vVX5g8ft89erjloPCokOUM4H9muU5dgQv2tFkaph3fHsq5mjQUeslIk
```

Use `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables to override either profile before the database is seeded.

## Admin API Scripts

Start the backend, then run administrative user scripts from the project root:

```bash
scripts/admin/list-users.sh
scripts/admin/add-user.sh petar demo petar@example.test EMPLOYEE
scripts/admin/change-role.sh maria ADMIN
scripts/admin/remove-user.sh stella
```

Available roles are `ADMIN`, `EMPLOYEE`, and `CLIENT`.

The scripts call the backend API at `http://localhost:8082` by default. Override with `API_BASE_URL`:

```bash
API_BASE_URL=http://localhost:9000 scripts/admin/list-users.sh
```

For local development, set `SKIP_AUTHORIZATION_ON_LOCALHOST=true` before starting the backend to allow admin API calls from localhost without a token:

```bash
SKIP_AUTHORIZATION_ON_LOCALHOST=true mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8082
```

For non-localhost requests, set `ADMIN_API_TOKEN` on the backend and pass the same environment variable when running scripts. The scripts send it as the `X-Admin-Token` header.

Admin changes are persisted in PostgreSQL.

## Testing

Run backend tests:

```bash
mvn test
```

Build the frontend:

```bash
cd frontend
npm run build
```

Build the frontend for production without developer pages (`/checklist`, `/assignment`, `/documentation`):

```bash
cd frontend
npm run build:prod
```

## Main Features

- Role views for administrator, employee, and client
- Clients see only shipments where they are sender or receiver
- CRUD flows for clients, employees, offices, and shipments
- Mark shipment as delivered
- Automatic price calculation: `5 + weight * 2`, plus `5` for address delivery
- Revenue report by date range
- Report for sent but undelivered shipments
- Responsive React interface

## API Endpoints

- `GET /api/snapshot`
- `POST /api/login`
- `POST /api/register`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/{username}/role`
- `DELETE /api/admin/users/{username}`
- `GET /api/shipments?role=CLIENT&clientId=1`
- `GET /api/reports?from=2026-05-01&to=2026-05-13`
- `POST /api/clients`
- `POST /api/employees`
- `POST /api/offices`
- `POST /api/shipments`
- `POST /api/shipments/{id}/deliver`
- `DELETE /api/{resource}/{id}`

## Project Structure

```text
.
├── pom.xml
├── database/
│   ├── docker-compose.yml
│   └── README.md
├── src/
│   ├── main/java/com/example/logistics/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   └── model/
│   └── test/java/com/example/logistics/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
└── README.md
```

## Git Notes

Generated files are ignored:

- `target/`
- `frontend/node_modules/`
- `frontend/dist/`
- `.idea/`

Do not commit generated build output or installed dependencies.

## Architecture Layers

- Controller layer: `src/main/java/com/example/logistics/controller`
- Service layer: `src/main/java/com/example/logistics/service`
- Repository layer: `src/main/java/com/example/logistics/repository`
- Database: `database/` plus `src/main/resources/application.properties`
