# Database Layer

This folder contains the PostgreSQL runtime setup for the Spring Boot app.

Start PostgreSQL:

```bash
docker compose -f database/docker-compose.yml up -d
```

The default application connection settings are:

```text
DATABASE_URL=jdbc:postgresql://localhost:5432/dkont
DATABASE_USERNAME=dkont
DATABASE_PASSWORD=dkont
```

Spring Data JPA creates and updates the schema with `spring.jpa.hibernate.ddl-auto=update`.
