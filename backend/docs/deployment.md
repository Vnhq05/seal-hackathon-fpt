# Deployment Guide

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SPRING_DATASOURCE_URL` | Yes | `jdbc:postgresql://localhost:5432/seal_hackathon` | PostgreSQL connection URL |
| `SPRING_DATASOURCE_USERNAME` | Yes | `postgres` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | Yes | `postgres` | Database password |
| `JWT_SECRET` | Yes | (dev default) | Base64-encoded HMAC secret (min 256-bit) |
| `MAIL_USERNAME` | No | — | SMTP username (Gmail) |
| `MAIL_PASSWORD` | No | — | SMTP app password |
| `SPRING_PROFILES_ACTIVE` | No | — | `dev`, `prod` |

## Docker Compose (Development)

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: seal_hackathon
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/seal_hackathon
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: postgres
      JWT_SECRET: ${JWT_SECRET}
      SPRING_PROFILES_ACTIVE: prod
    depends_on:
      - postgres

volumes:
  pgdata:
```

## Dockerfile

```dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/seal-hackathon-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

## Build for Production

```bash
# Build JAR
./mvnw clean package -DskipTests -Pprod

# Build Docker image
docker build -t seal-hackathon:latest .

# Run
docker compose up -d
```

## Production Configuration

Create `application-prod.yml`:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

logging:
  level:
    com.sealhackathon: INFO
    org.hibernate.SQL: WARN
```

## Database Migration Strategy

The project uses `ddl-auto: update` for development. For production:

1. Switch to `ddl-auto: validate`
2. Use Flyway or Liquibase for schema migrations
3. Generate initial migration from current entities:
   ```bash
   ./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.jpa.properties.jakarta.persistence.schema-generation.scripts.action=create --spring.jpa.properties.jakarta.persistence.schema-generation.scripts.create-target=schema.sql"
   ```

## JWT Secret Generation

```bash
# Generate a secure 512-bit key (Base64-encoded)
openssl rand -base64 64
```

## Health Check

```bash
curl http://localhost:8080/actuator/health
```

## Swagger UI

- Development: http://localhost:8080/swagger-ui.html
- Production: Disable by setting `springdoc.swagger-ui.enabled=false`

## Monitoring

Add Spring Boot Actuator endpoints:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
```

## Security Checklist

- [ ] Change JWT_SECRET from default
- [ ] Use HTTPS in production
- [ ] Set CORS allowed origins
- [ ] Disable Swagger UI in production
- [ ] Enable rate limiting
- [ ] Configure SMTP with app-specific password
- [ ] Set `ddl-auto: validate` in production
- [ ] Enable audit log monitoring
- [ ] Configure backup strategy for PostgreSQL
