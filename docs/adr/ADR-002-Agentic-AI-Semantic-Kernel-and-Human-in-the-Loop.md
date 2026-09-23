# ADR 002: Semantic Kernel Agentic Orchestration with Human-in-the-Loop (HITL) Approval Gates

## Status
Accepted

## Context
Automated inventory reordering presents financial risk if autonomous AI agents trigger uncontrolled purchasing orders without oversight. The system requires an autonomous AI advisor to detect low stock and calculate replenishment needs, but must prevent unverified execution.

## Decision
We implemented an **Agentic AI Architecture** using **Microsoft Semantic Kernel**:
1. **ReorderAdvisorAgent**: Autonomous agent utilizing typed Kernel Tools (`MockStockTool`, `SupplierCatalogTool`) to analyze inventory velocity and generate `ReorderProposals`.
2. **Approval Gate Constraint**: Proposals exceeding risk or budget thresholds cannot automatically dispatch purchase orders. Instead, they transition into an `ApprovalGate` state (`Pending`).
3. **Human-in-the-Loop (HITL)**: Requires an authorized Manager or Admin to inspect the proposal in the Web Portal (`PendingApprovalsPage`), verify quantity and estimated cost, and manually click **Approve** or **Reject**.

## Consequences
- **Pros**: Mitigates hallucination and financial overspend; full auditability via `WorkflowSteps` and `ToolCallLogs` database tables.
- **Cons**: Introduces asynchronous latency waiting for human review before execution.
