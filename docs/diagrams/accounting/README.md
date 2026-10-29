# Accounting Officer Diagrams Suite

> **Role:** `ACCOUNTING` (Financial Compliance & Disbursement)  
> **System:** MinSU DocTrack

---

## 1. Role Scope & Responsibilities

The Accounting Officer is responsible for verifying, calculating, and submitting financial TDP Annexes:
- **Annex 6**: Certificate of Fund Utilization
- **Annex 7**: Report of Advice to Debit Account Issued
- **Annex 8**: Report of Checks Issued
- **Annex 9**: TDP Beneficiary Payroll

The Accounting Officer ensures precision in Philippine Peso calculations (`₱#,##0.00`), checks bank account debits, and enforces fiscal compliance before executive review.

---

## 2. Diagram Index (17 Complete Architectural Views)

| File | Diagram Type | Description |
|---|---|---|
| [`system-architecture-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/system-architecture-diagram.md) | System Architecture | Architectural layout of accounting forms, math engine, and database persistence. |
| [`class-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/class-diagram.md) | Class Diagram | Object-oriented models for financial documents, metadata, and status history. |
| [`component-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/component-diagram.md) | Component Diagram | Modular component dependencies between math engines, validators, and repositories. |
| [`deployment-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/deployment-diagram.md) | Deployment Diagram | Runtime deployment topologies spanning workstation, proxy, app server, and database. |
| [`object-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/object-diagram.md) | Object Diagram | Runtime snapshot of a balanced Annex 9 Payroll submission with zero variance. |
| [`package-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/package-diagram.md) | Package Diagram | Code organization across app routes, financial UI components, and utility libraries. |
| [`composite-structure-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/composite-structure-diagram.md) | Composite Structure | Internal collaboration parts and ports within the Financial Verification Subsystem. |
| [`profile-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/profile-diagram.md) | Profile Diagram | UML stereotypes for `<<FinancialAnnex>>`, `<<CurrencyPrecision>>`, and `<<ZeroVarianceRule>>`. |
| [`data-flow-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/data-flow-diagram.md) | Data Flow Diagram (DFD) | Data flow between Accounting, Bank Accounts, Payroll Records, and Documents. |
| [`use-case-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/use-case-diagram.md) | Use Case Diagram | Financial Annex creation, balance reconciliation, and payroll compilation. |
| [`activity-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/activity-diagram.md) | Activity Diagram | Disbursement reconciliation and fiscal report submission workflow. |
| [`sequence-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/sequence-diagram.md) | Sequence Diagram | Financial balance calculation and submission message sequence. |
| [`state-machine-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/state-machine-diagram.md) | State Machine Diagram | Lifecycle transitions and guards from Draft through Approval and Archival. |
| [`communication-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/communication-diagram.md) | Communication Diagram | Object message exchanges during Annex 6 allocation reconciliation. |
| [`interaction-overview-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/interaction-overview-diagram.md) | Interaction Overview | High-level financial preparation, balance verification, and director approval flow. |
| [`timing-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/timing-diagram.md) | Timing Diagram | Fiscal cycle milestones, grace periods, and submission deadlines. |
| [`requirement-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/accounting/requirement-diagram.md) | Requirement Diagram (SysML) | Traceability for financial accuracy, peso rounding, and audit compliance. |
