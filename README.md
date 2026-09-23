# StockFlow-AI: SME Inventory, Order & Field-Ops Mobile Platform

> **SE3090 – Software Engineering Frameworks (Assignment 1)**  
> Full-Stack & Agentic AI Application with Cross-Cutting Vertical Component Architecture.

---

## 🚀 Architecture Overview

StockFlow-AI delivers a cross-platform inventory management, sales ordering, and field-ops mobile solution integrated with multi-agent orchestration and Human-in-the-Loop (HITL) approval workflows.

* **Backend:** ASP.NET Core 10, Clean Architecture, Entity Framework Core, PostgreSQL, JWT Authentication.
* **Frontend Web:** React 19, Tailwind CSS, Vite, Recharts, Lucide Icons.
* **Mobile Client:** Flutter, Provider, SQLite Offline Sync Cache, Camera Barcode/QR Scanner, Geolocation.
* **Agentic AI:** Semantic Kernel multi-agent pipeline (Coordinator, Inventory Analyst, Demand Advisor, Field Context, and Rule Validator).

---

## 👥 Cross-Cutting Vertical Component Ownership

| Component | Focus Area | Layers Owned |
| :--- | :--- | :--- |
| **Shared Core (`main`)** | Authentication & Security, Web & Mobile Shells, DevOps | Shared DB, JWT, Layouts, Theme, CI/CD |
| **Component A** | Product & Inventory Management | Product Catalog, Stock Levels, QR Scanner, InventoryAnalystAgent |
| **Component B** | Order Management & Customer Master | Sales Orders, Order Lines, Mobile Booking, DemandOrderContextAgent |
| **Component C** | Field Sales & Offline Operations | Check-in Visits, Offline SQLite DB, Background Sync, FieldContextAgent |
| **Component D** | Reorder Planning & Approval Gates | Multi-Agent Orchestrator, HITL Approvals, SMS/Email Alerts |

---

## 🛠️ Quick Start

### 1. Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/)
- [Node.js 20+](https://nodejs.org/) & npm
- [Flutter 3.x SDK](https://flutter.dev/)
- [Docker & Docker Compose](https://www.docker.com/)

### 2. Run with Docker Compose
```bash
docker compose up -d
```

### 3. Run Locally

#### Backend API:
```bash
cd backend/src/StockFlow.API
dotnet run
```

#### Frontend Web:
```bash
cd frontend-web
npm install
npm run dev
```

#### Flutter Mobile:
```bash
cd mobile
flutter pub get
flutter run
```

---

## 🧪 Testing

```bash
# Backend unit & golden tests
cd backend
dotnet test

# Frontend web unit tests
cd frontend-web
npm run test

# Flutter mobile tests
cd mobile
flutter test
```
