# ADR 001: Adoption of Clean Architecture and .NET 10 for Backend Core

## Status
Accepted

## Context
StockFlow-AI requires an enterprise-grade backend to handle distributed SME inventory, field operations, real-time telemetry, and multi-agent AI orchestration. The system must support high testability, domain separation, and maintainability across multiple developers.

## Decision
We adopted **Clean Architecture** (Onion/Hexagonal pattern) powered by **.NET 10 Web API** and **PostgreSQL** using Entity Framework Core.

The solution is partitioned into 4 distinct layers:
1. **StockFlow.Domain**: Core enterprise entities (`SalesOrder`, `Product`, `StockLevel`), Value Objects, and Domain Enums (`OrderStatus`, `UserRole`) with zero external dependencies.
2. **StockFlow.Application**: Use cases, CQRS/Service layer (`OrderService`, `AuthService`, `StockService`), DTOs, interfaces, and business validation rules.
3. **StockFlow.Infrastructure**: Persistence implementation (`AppDbContext`), EF Core migrations, PostgreSQL repositories, security (BCrypt/JWT), and external adapters (Twilio/SendGrid).
4. **StockFlow.API**: RESTful controllers (`OrdersController`, `AuthController`), middleware, role-based authorization, and Scalar/OpenAPI documentation.

## Consequences
- **Pros**: Complete separation of concerns; database or external services can be replaced or mocked without touching business domain logic.
- **Cons**: Requires mapping boilerplate (DTOs to Entities) and multiple project files, which is managed via modern C# records.
