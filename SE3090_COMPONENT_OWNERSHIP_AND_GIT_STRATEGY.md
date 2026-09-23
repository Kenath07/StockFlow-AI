# SE3090: SME Inventory, Order & Field-Ops Mobile Platform
## Full-Stack Component Ownership & Git Branching Strategy Guide

> **Document Type:** Team Git Collaboration, Component Ownership & Viva Defense Architecture  
> **Course:** SE3090 – Software Engineering Frameworks (Assignment 1)  
> **Standard:** SE3090 Revised Brief (Pages 7 & 8) Cross-Cutting Vertical Component Model  

---

## 1. Executive Summary & Architecture Model

In accordance with the **SE3090 Revised Project Brief**, component ownership is **vertical and cross-cutting**. No individual student is restricted to only backend or only mobile. Instead, each student owns one primary business component across the entire stack:
- **Backend API & PostgreSQL Entities**
- **React Web Portal Interfaces**
- **Flutter Mobile Client Screens**
- **Distinct Agentic AI Contribution**
- **Automated Unit & Golden Tests**

```
                           ┌──────────────────────────────────────────────┐
                           │      main Branch (Shared Core & Auth)        │
                           └──────────────────────┬───────────────────────┘
                                                  │
         ┌────────────────────────┬───────────────┴───────────────┬────────────────────────┐
         │                        │                               │                        │
┌────────▼──────────────┐ ┌───────▼───────────────┐ ┌─────────────▼─────────────┐ ┌────────▼──────────────┐
│  feature/component-a  │ │  feature/component-b  │ │    feature/component-c    │ │  feature/component-d  │
│ Inventory Management  │ │   Order Management    │ │    Field Operations       │ │  Reorder & Approvals   │
│     (Student 1)       │ │     (Student 2)       │ │       (Student 3)         │ │     (Student 4)        │
└───────────────────────┘ └───────────────────────┘ └───────────────────────────┘ └───────────────────────┘
```

---

## 2. Main Branch: Shared Core Infrastructure

The `main` branch contains the shared foundations required by all four components. According to the brief, User Management and Authentication are shared mandatory features that must not be counted as a single student's business component.

### Shared Files & Components in `main`:
1. **Repository Setup & DevOps:**
   - `StockFlow.slnx` (.NET 10 solution file)
   - `docker-compose.yml` (PostgreSQL, Backend API, Frontend Web multi-container setup)
   - `.github/workflows/ci.yml` (CI pipeline: Backend tests, React Vitest, Flutter tests)
   - `.env.example`, `.gitignore`, `README.md`
   - `docs/adr/` (Architecture Decision Records 001, 002, 003)
2. **Backend Authentication & Security (`backend/`):**
   - Entity: `backend/src/StockFlow.Domain/Entities/ApplicationUser.cs`
   - Controller: `backend/src/StockFlow.API/Controllers/AuthController.cs`
   - Service: `backend/src/StockFlow.Application/Services/AuthService.cs`
   - Security: JWT Token Generation, BCrypt Hashing, Role Claims (`Admin`, `Manager`, `Storekeeper`, `FieldSales`)
   - Persistence: `backend/src/StockFlow.Infrastructure/Persistence/AppDbContext.cs`
3. **Frontend Web Shell (`frontend-web/`):**
   - Layout: `src/components/layout/Sidebar.jsx`, `Header.jsx`, `Layout.jsx`
   - Context: `src/context/AuthContext.jsx`
   - Routes: `src/routes/AppRoutes.jsx`, `ProtectedRoute.jsx`
   - Common UI: `src/components/common/` (StatCard, Badge, LoadingSpinner, Modal)
4. **Mobile Client Shell (`mobile/`):**
   - Theme & Colors: `lib/core/theme/app_theme.dart`, `app_colors.dart`
   - Networking & Storage: `lib/core/network/api_client.dart`, `api_endpoints.dart`, `lib/core/storage/secure_vault.dart`
   - Authentication Screens: `lib/features/auth/screens/splash_screen.dart`, `login_screen.dart`, `register_screen.dart`
   - Navigation Shell: `lib/features/home/screens/main_navigation_shell.dart`
   - Settings & Profile: `lib/features/settings/screens/settings_screen.dart`

---

## 3. Detailed Component Breakdown (Students 1 to 4)

---

### Component A: Product & Inventory Management
* **Owner:** Student 1
* **Branch Name:** `feature/component-a-inventory-management`
* **Core Responsibilities:** Master product catalog, categories, stock tracking, real-time stock levels, movement history, threshold configuration, warehouse stock adjustments, and low-stock analysis.

#### Codebase Mapping:
| Layer | Specific File Paths |
| :--- | :--- |
| **Entities & DB** | `backend/src/StockFlow.Domain/Entities/Product.cs`<br>`backend/src/StockFlow.Domain/Entities/ProductCategory.cs`<br>`backend/src/StockFlow.Domain/Entities/StockLevel.cs`<br>`backend/src/StockFlow.Domain/Entities/StockMovement.cs`<br>`backend/src/StockFlow.Domain/Entities/LowStockThreshold.cs`<br>`backend/src/StockFlow.Domain/Entities/StockAdjustment.cs` |
| **Backend API** | `backend/src/StockFlow.API/Controllers/ProductsController.cs`<br>`backend/src/StockFlow.API/Controllers/StockController.cs`<br>`backend/src/StockFlow.Application/Services/ProductService.cs`<br>`backend/src/StockFlow.Application/Services/StockService.cs`<br>`backend/src/StockFlow.Infrastructure/Repositories/ProductRepository.cs`<br>`backend/src/StockFlow.Infrastructure/Repositories/StockRepository.cs`<br>`backend/src/StockFlow.Application/DTOs/Product/`<br>`backend/src/StockFlow.Application/DTOs/Stock/` |
| **React Web** | `frontend-web/src/features/products/` (`ProductsListPage.jsx`, `ProductDetailPage.jsx`, `ProductFormModal.jsx`)<br>`frontend-web/src/features/stock/` (`StockLevelsPage.jsx`, `StockMovementsPage.jsx`, `StockAdjustmentModal.jsx`)<br>`frontend-web/src/features/dashboard/pages/StorekeeperDashboardPage.jsx`<br>`frontend-web/src/services/api/productService.js`<br>`frontend-web/src/services/api/stockService.js` |
| **Flutter Mobile** | `mobile/lib/features/products/screens/product_list_screen.dart`<br>`mobile/lib/features/products/screens/product_detail_screen.dart`<br>`mobile/lib/features/products/screens/qr_scanner_screen.dart`<br>`mobile/lib/features/products/providers/products_provider.dart`<br>`mobile/lib/features/products/models/product_model.dart`<br>`mobile/lib/features/products/models/stock_movement_model.dart` |
| **Agentic AI** | `backend/src/StockFlow.Agents/SpecializedAgents/InventoryAnalystAgent.cs`<br>`backend/src/StockFlow.Agents/Tools/MockStockTool.cs`<br>*(Supplies stock levels, velocity, and threshold data to the orchestrator via typed Semantic Kernel functions).* |
| **Automated Tests**| `backend/tests/StockFlow.Tests/Unit/ProductStockTests.cs` |

---

### Component B: Order Management
* **Owner:** Student 2
* **Branch Name:** `feature/component-b-order-management`
* **Core Responsibilities:** Complete sales order lifecycle (Create → Confirm → Fulfill/Dispatch → Cancel), customer master profiles, order lines, stock reservation, line-item aggregates, and cancellation handling.

#### Codebase Mapping:
| Layer | Specific File Paths |
| :--- | :--- |
| **Entities & DB** | `backend/src/StockFlow.Domain/Entities/SalesOrder.cs`<br>`backend/src/StockFlow.Domain/Entities/OrderLine.cs`<br>`backend/src/StockFlow.Domain/Entities/OrderStatusHistory.cs`<br>`backend/src/StockFlow.Domain/Entities/Customer.cs`<br>`backend/src/StockFlow.Domain/Entities/PaymentReference.cs`<br>`backend/src/StockFlow.Domain/Enums/OrderStatus.cs` |
| **Backend API** | `backend/src/StockFlow.API/Controllers/OrdersController.cs`<br>`backend/src/StockFlow.API/Controllers/CustomersController.cs`<br>`backend/src/StockFlow.Application/Services/OrderService.cs`<br>`backend/src/StockFlow.Application/Services/CustomerService.cs`<br>`backend/src/StockFlow.Infrastructure/Repositories/OrderRepository.cs`<br>`backend/src/StockFlow.Infrastructure/Repositories/CustomerRepository.cs`<br>`backend/src/StockFlow.Application/DTOs/Order/`<br>`backend/src/StockFlow.Application/DTOs/Customer/` |
| **React Web** | `frontend-web/src/features/orders/` (`OrdersListPage.jsx`, `OrderDetailPage.jsx`, `CreateOrderModal.jsx`)<br>`frontend-web/src/features/customers/` (`CustomersListPage.jsx`, `CustomerDetailPage.jsx`)<br>`frontend-web/src/services/api/orderService.js`<br>`frontend-web/src/services/api/customerService.js` |
| **Flutter Mobile** | `mobile/lib/features/orders/screens/my_orders_screen.dart`<br>`mobile/lib/features/orders/screens/order_detail_screen.dart`<br>`mobile/lib/features/orders/screens/create_order_screen.dart`<br>`mobile/lib/features/orders/providers/orders_provider.dart`<br>`mobile/lib/features/orders/models/order_models.dart` |
| **Agentic AI** | `backend/src/StockFlow.Agents/SpecializedAgents/DemandOrderContextAgent.cs`<br>*(Supplies historical sales patterns, customer frequency, and demand signals to the reorder pipeline).* |
| **Automated Tests**| `backend/tests/StockFlow.Tests/Unit/OrderLifecycleTests.cs` |

---

### Component C: Field Sales / Mobile Operations
* **Owner:** Student 3
* **Branch Name:** `feature/component-c-field-ops-mobile`
* **Core Responsibilities:** Field agent mobility, GPS customer check-in/visit tracking, device capture payloads (QR/GPS metadata), offline SQLite local database, and background synchronization queue.

#### Codebase Mapping:
| Layer | Specific File Paths |
| :--- | :--- |
| **Entities & DB** | `backend/src/StockFlow.Domain/Entities/FieldAgentProfile.cs`<br>`backend/src/StockFlow.Domain/Entities/CustomerVisit.cs`<br>`backend/src/StockFlow.Domain/Entities/DeviceCapture.cs`<br>`backend/src/StockFlow.Domain/Entities/OfflineSyncQueue.cs` |
| **Backend API** | `backend/src/StockFlow.API/Controllers/FieldController.cs`<br>`backend/src/StockFlow.Application/Services/FieldService.cs`<br>`backend/src/StockFlow.Infrastructure/Repositories/FieldRepository.cs`<br>`backend/src/StockFlow.Application/DTOs/Field/` |
| **React Web** | `frontend-web/src/features/field/` (`FieldAgentsPage.jsx`, `AgentDetailPage.jsx`, `VisitHistoryMapPage.jsx`, `SyncStatusMonitorPage.jsx`)<br>`frontend-web/src/services/api/fieldService.js` |
| **Flutter Mobile** | `mobile/lib/features/visits/screens/customer_list_screen.dart`<br>`mobile/lib/features/visits/screens/visit_checkin_screen.dart`<br>`mobile/lib/features/visits/screens/visit_detail_screen.dart`<br>`mobile/lib/features/visits/screens/visit_history_screen.dart`<br>`mobile/lib/features/visits/providers/visits_provider.dart`<br>`mobile/lib/features/visits/models/visit_models.dart`<br>`mobile/lib/features/sync/screens/sync_queue_screen.dart`<br>`mobile/lib/features/sync/providers/sync_provider.dart`<br>`mobile/lib/core/storage/local_database.dart` (Offline SQLite schema & queries)<br>`mobile/lib/features/home/screens/home_dashboard_screen.dart` (Field Officer Desk UI) |
| **Agentic AI** | `backend/src/StockFlow.Agents/SpecializedAgents/FieldContextAgent.cs`<br>*(Enriches reorder workflows with GPS coordinates and physical store verification metadata).* |
| **Automated Tests**| `backend/tests/StockFlow.Tests/Unit/FieldVisitTests.cs` |

---

### Component D: Reorder Planning, Approval & Notifications
* **Owner:** Student 4
* **Branch Name:** `feature/component-d-reorder-approval-ai`
* **Core Responsibilities:** Multi-agent orchestration, Human-in-the-Loop (HITL) manager approval gates, reorder proposal generation, deterministic schema/rule validation, and third-party SMS/email notification gateways.

#### Codebase Mapping:
| Layer | Specific File Paths |
| :--- | :--- |
| **Entities & DB** | `backend/src/StockFlow.Domain/Entities/AgentWorkflow.cs`<br>`backend/src/StockFlow.Domain/Entities/ReorderProposal.cs`<br>`backend/src/StockFlow.Domain/Entities/WorkflowStep.cs`<br>`backend/src/StockFlow.Domain/Entities/ToolCallLog.cs`<br>`backend/src/StockFlow.Domain/Entities/ValidationResult.cs`<br>`backend/src/StockFlow.Domain/Entities/NotificationLog.cs`<br>`backend/src/StockFlow.Domain/Entities/ApprovalGate.cs` |
| **Backend API** | `backend/src/StockFlow.API/Controllers/AgentWorkflowsController.cs`<br>`backend/src/StockFlow.API/Controllers/NotificationsController.cs`<br>`backend/src/StockFlow.API/Controllers/ReportsController.cs`<br>`backend/src/StockFlow.Application/Services/AgentWorkflowService.cs`<br>`backend/src/StockFlow.Application/Services/NotificationService.cs`<br>`backend/src/StockFlow.Application/Services/ReportService.cs`<br>`backend/src/StockFlow.Infrastructure/Notifications/TwilioSmsService.cs`<br>`backend/src/StockFlow.Infrastructure/Notifications/SmtpEmailService.cs`<br>`backend/src/StockFlow.Application/DTOs/Agent/`<br>`backend/src/StockFlow.Application/DTOs/Notification/` |
| **React Web** | `frontend-web/src/features/agent/` (`WorkflowsListPage.jsx`, `WorkflowDetailPage.jsx`, `PendingApprovalsPage.jsx`)<br>`frontend-web/src/features/reports/` (`ReportsPage.jsx`, `LowStockReportPage.jsx`)<br>`frontend-web/src/features/notifications/` (`NotificationsPage.jsx`)<br>`frontend-web/src/features/dashboard/pages/ManagerDashboardPage.jsx`<br>`frontend-web/src/components/common/TriggerBadge.jsx`<br>`frontend-web/src/services/api/agentWorkflowService.js`<br>`frontend-web/src/services/api/notificationService.js`<br>`frontend-web/src/services/api/reportService.js` |
| **Flutter Mobile** | `mobile/lib/features/notifications/screens/notifications_screen.dart`<br>`mobile/lib/features/notifications/providers/notifications_provider.dart`<br>`mobile/lib/features/home/screens/home_dashboard_screen.dart` (Warehouse Desk Telemetry & Dispatch actions) |
| **Agentic AI** | `backend/src/StockFlow.Agents/Coordinator/CoordinatorAgent.cs`<br>`backend/src/StockFlow.Agents/ReorderAdvisor/ReorderAdvisorAgent.cs`<br>`backend/src/StockFlow.Agents/Validator/ValidatorAgent.cs`<br>`backend/src/StockFlow.Agents/Orchestrator/MultiAgentOrchestrator.cs`<br>`backend/src/StockFlow.Agents/Tools/SupplierCatalogTool.cs` |
| **Automated Tests**| `backend/tests/StockFlow.Tests/Agents/AgentPipelineGoldenTests.cs` |

---

## 4. Team Git Execution Workflow

Follow this procedure to guarantee clear contribution graphs and verified Pull Requests for all four members:

```
[Personal Backup Repo]  ─────────> Team Members Download/Clone Code
                                            │
                                            ▼
[Official University Repo] <────── Push from Member PCs via Feature Branches
                                            │
                                            ▼
[Pull Requests & Reviews]  ──────> Merge into main with Evaluator Evidence
```

### Step 1: Initialize the University Repository
1. Create the repository on the official University Git server (or team organization).
2. Invite all 4 group members with **Write/Collaborator** permissions.
3. Push the `main` branch (Shared Core Infrastructure) first.

### Step 2: Individual Feature Branch Setup on Each Student's PC
Each member must configure their git identity on their own laptop so commits are credited to their profile:
```bash
# Set individual author identity
git config --global user.name "Student Name"
git config --global user.email "student.id@my.sliit.lk"

# Clone the repository
git clone <UNIVERSITY_REPO_URL>
cd StockFlow-AI

# Create and switch to assigned component branch
# Example for Student 1:
git checkout -b feature/component-a-inventory-management

# Example for Student 2:
git checkout -b feature/component-b-order-management

# Example for Student 3:
git checkout -b feature/component-c-field-ops-mobile

# Example for Student 4:
git checkout -b feature/component-d-reorder-approval-ai
```

### Step 3: Making Meaningful Commits
Instead of pushing one monolithic commit, each student should make logical, granular commits:
```bash
# Example for Student 1 (Component A):
git add backend/src/StockFlow.Domain/Entities/Product.cs backend/src/StockFlow.Domain/Entities/StockLevel.cs
git commit -m "feat(inventory): add product and stock level domain entities"

git add backend/src/StockFlow.API/Controllers/ProductsController.cs backend/src/StockFlow.Application/Services/ProductService.cs
git commit -m "feat(inventory): implement product catalog REST APIs and service layer"

git add frontend-web/src/features/products/ frontend-web/src/features/stock/
git commit -m "feat(inventory-web): add React stock level management and movement history"

git add mobile/lib/features/products/
git commit -m "feat(inventory-mobile): implement Flutter product lookup and QR barcode scanner"

git add backend/src/StockFlow.Agents/SpecializedAgents/InventoryAnalystAgent.cs
git commit -m "feat(ai-agent): implement InventoryAnalystAgent for stock velocity data extraction"

git add backend/tests/StockFlow.Tests/Unit/ProductStockTests.cs
git commit -m "test(inventory): add unit tests for stock adjustments and threshold validation"
```

### Step 4: Push Feature Branch & Open Pull Request
```bash
git push -u origin feature/component-a-inventory-management
```
1. Open GitHub / GitLab Web UI.
2. Click **New Pull Request** targeting `base: main` from `compare: feature/component-...`.
3. Provide a structured PR summary matching the SE3090 rubric:
   - **Component Name & Student ID**
   - **Backend Endpoints Added**
   - **Web & Mobile Surfaces Implemented**
   - **Agent Contribution & Tool Integration**
   - **Test Results**
4. Another teammate reviews the PR, submits an **Approved** review, and merges the PR.

---

## 5. Viva Defense Quick Reference

When evaluators ask you to defend your component, use this table:

| Student | Component | Cross-Platform Flow to Demonstrate |
| :--- | :--- | :--- |
| **Student 1** | Component A | Open **Storekeeper Dashboard** on Web ➔ Show real-time Stock Levels ➔ Open Mobile App ➔ Scan Product Barcode ➔ Perform stock adjustment ➔ Verify instant update in PostgreSQL and Web UI. |
| **Student 2** | Component B | Create a new Sales Order on Mobile / Web ➔ Demonstrate Order status transitions (`Submitted` ➔ `Confirmed` ➔ `Dispatched`) ➔ Show stock quantity reservation in Database ➔ Review line-item totals. |
| **Student 3** | Component C | Open Mobile App ➔ Trigger **Start Visit** with GPS Location Capture ➔ Turn on Airplane Mode (Offline) ➔ Book order in SQLite ➔ Turn network back on ➔ Show automatic background sync queue. |
| **Student 4** | Component D | Trigger reorder recommendation workflow ➔ Show Coordinator delegating to Analyst, Demand, and Field agents ➔ Show workflow pause at **PendingManagerApproval** ➔ Click **Approve** in React ➔ Inspect Twilio/SendGrid notification logs. |
