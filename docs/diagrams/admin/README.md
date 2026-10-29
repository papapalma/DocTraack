# System Admin Diagrams Suite

> **Role:** `SYSTEM_ADMIN` (System Administrator & Governance)  
> **System:** MinSU DocTrack

---

## 1. Role Scope & Responsibilities

The System Administrator oversees user account provisioning, role assignments, immutable audit log inspections, and public landing page content management (CMS).

---

## 2. Complete 17-Diagram Specification Index

| # | Diagram Type | File Link | Focus & Description |
|---|---|---|---|
| 1 | **System Architecture** | [`system-architecture-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/system-architecture-diagram.md) | Administrative subsystem, audit ingestion, and CMS boundaries. |
| 2 | **Class Diagram** | [`class-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/class-diagram.md) | User, Session, AuditLog, and LandingPageConfig models and operations. |
| 3 | **Component Diagram** | [`component-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/component-diagram.md) | Admin UI, RBAC guard, Bcrypt hasher, and audit interfaces. |
| 4 | **Deployment Diagram** | [`deployment-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/deployment-diagram.md) | Admin workstation, reverse proxy, app container, and database tables. |
| 5 | **Object Diagram** | [`object-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/object-diagram.md) | Runtime snapshot of user provisioning and audit record linkage. |
| 6 | **Package Diagram** | [`package-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/package-diagram.md) | Codebase packages and modular boundaries for admin services. |
| 7 | **Composite Structure** | [`composite-structure-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/composite-structure-diagram.md) | Internal structure, ports, and connectors of AdminGovernanceSubsystem. |
| 8 | **Profile Diagram** | [`profile-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/profile-diagram.md) | Domain stereotypes for administrative security and audit guarantees. |
| 9 | **Data Flow (DFD)** | [`data-flow-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/data-flow-diagram.md) | Level 1 DFD tracing data movement between Admin, User Store, and Audit. |
| 10 | **Use Case Diagram** | [`use-case-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/use-case-diagram.md) | Admin actors, boundary scope, and core administrative use cases. |
| 11 | **Activity Diagram** | [`activity-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/activity-diagram.md) | User account provisioning and role assignment workflow. |
| 12 | **Sequence Diagram** | [`sequence-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/sequence-diagram.md) | Chronological message sequence for role modification and audit trail. |
| 13 | **State Machine** | [`state-machine-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/state-machine-diagram.md) | User account lifecycle (Provisioned, Active, Deactivated, Archived). |
| 14 | **Communication** | [`communication-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/communication-diagram.md) | Object links and numbered message flows for account deactivation. |
| 15 | **Interaction Overview** | [`interaction-overview-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/interaction-overview-diagram.md) | High-level control flow combining admin decisions with sequence frames. |
| 16 | **Timing Diagram** | [`timing-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/timing-diagram.md) | Admin session timeout thresholds and audit write latency constraints. |
| 17 | **Requirement (SysML)** | [`requirement-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/requirement-diagram.md) | Traceability for security, RBAC policies, and auditability requirements. |
