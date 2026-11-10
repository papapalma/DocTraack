# Accounting Officer Diagrams Suite

> **Role:** `ACCOUNTING` (Financial Compliance & Disbursement)  
> **System:** MinSU DocTrack

---

## 1. Role Scope & Responsibilities

The Accounting Officer is responsible for verifying, calculating, and submitting financial TDP Annexes:
- **Annex 6**: Certificate of Fund Utilization (FUR)
- **Annex 7**: Report of Advice to Debit Account Issued (RADAI / ADA)
- **Annex 8**: Report of Checks Issued (RCI)
- **Annex 9**: TDP Beneficiary General Payroll

The Accounting Officer ensures precision in Philippine Peso calculations (`₱#,##0.00`), checks bank account debits, enforces zero variance against official government sub-allotments, and exports native multi-tab Excel workbooks.

---

## 2. Diagram Index (17 Complete Architectural Views)

| File | Diagram Type | Description |
|---|---|---|
| [`system-architecture-diagram.md`](./system-architecture-diagram.md) | System Architecture | Architectural layout of accounting forms, math engine, and database persistence. |
| [`class-diagram.md`](./class-diagram.md) | Class Diagram | Object-oriented models for financial documents, metadata, and status history. |
| [`component-diagram.md`](./component-diagram.md) | Component Diagram | Modular component dependencies between math engines, validators, and Excel exporters. |
| [`deployment-diagram.md`](./deployment-diagram.md) | Deployment Diagram | Runtime deployment topologies spanning workstation, proxy, app server, and database. |
| [`object-diagram.md`](./object-diagram.md) | Object Diagram | Runtime snapshot of a balanced Annex 9 Payroll submission with zero variance. |
| [`package-diagram.md`](./package-diagram.md) | Package Diagram | Code organization across app routes, financial UI components, and utility libraries. |
| [`composite-structure-diagram.md`](./composite-structure-diagram.md) | Composite Structure | Internal collaboration parts and ports within the Financial Verification Subsystem. |
| [`profile-diagram.md`](./profile-diagram.md) | Profile Diagram | UML stereotypes for `<<FinancialAnnex>>`, `<<CurrencyPrecision>>`, and `<<ZeroVarianceRule>>`. |
| [`data-flow-diagram.md`](./data-flow-diagram.md) | Data Flow Diagram (DFD) | Data flow between Accounting, Bank Accounts, Payroll Records, and Documents. |
| [`use-case-diagram.md`](./use-case-diagram.md) | Use Case Diagram | Financial Annex creation, balance reconciliation, payroll compilation, and Excel export. |
| [`activity-diagram.md`](./activity-diagram.md) | Activity Diagram | Disbursement reconciliation and fiscal report submission workflow. |
| [`sequence-diagram.md`](./sequence-diagram.md) | Sequence Diagram | Financial balance calculation and submission message sequence. |
| [`state-machine-diagram.md`](./state-machine-diagram.md) | State Machine Diagram | Lifecycle transitions and guards from Draft through Approval and Archival. |
| [`communication-diagram.md`](./communication-diagram.md) | Communication Diagram | Object message exchanges during Annex 6 allocation reconciliation. |
| [`interaction-overview-diagram.md`](./interaction-overview-diagram.md) | Interaction Overview | High-level financial preparation, balance verification, and director approval flow. |
| [`timing-diagram.md`](./timing-diagram.md) | Timing Diagram | Fiscal cycle milestones, grace periods, and submission deadlines. |
| [`requirement-diagram.md`](./requirement-diagram.md) | Requirement Diagram (SysML) | Traceability for financial accuracy, peso rounding, and audit compliance. |
