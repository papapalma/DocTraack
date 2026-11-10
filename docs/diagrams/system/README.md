# System Architecture & Global Diagrams Suite

> **Mindoro State University (MinSU) — Tulong Dunong Program (TDP)**  
> **Global System Architecture Specifications (Whole System)**

---

## 1. Purpose

This directory contains the system-level architectural specifications for the entire MinSU DocTrack application. These diagrams describe the fullstack structure, deployment topography, domain entities, package boundaries, end-to-end semester workflows, and system-wide SysML requirement traceability.

---

## 2. Diagram Index (17 Complete Architectural Views)

| File | Diagram Type | Description |
|---|---|---|
| [`system-architecture-diagram.md`](./system-architecture-diagram.md) | System Architecture | High-level multi-tier architecture, edge ingress, services, and storage zones. |
| [`class-diagram.md`](./class-diagram.md) | Class Diagram | Prisma domain entities, models, relationships, and multiplicity. |
| [`component-diagram.md`](./component-diagram.md) | Component Diagram | Software modular services, provided interfaces, and required dependencies. |
| [`deployment-diagram.md`](./deployment-diagram.md) | Deployment Diagram | Physical and virtual nodes, containers, runtimes, and storage mapping. |
| [`object-diagram.md`](./object-diagram.md) | Object Diagram | System-wide runtime instance snapshot during mid-semester operations. |
| [`package-diagram.md`](./package-diagram.md) | Package Diagram | Codebase organizational structure, layers, and dependency directions. |
| [`composite-structure-diagram.md`](./composite-structure-diagram.md) | Composite Structure | Internal collaboration parts and communication ports of the Document Engine. |
| [`profile-diagram.md`](./profile-diagram.md) | Profile Diagram | Domain stereotypes and tagged values for MinSU TDP Annex governance. |
| [`data-flow-diagram.md`](./data-flow-diagram.md) | Data Flow Diagram (DFD) | Level 0 Context and Level 1 System DFD mapping global data pipelines. |
| [`use-case-diagram.md`](./use-case-diagram.md) | Use Case Diagram | Comprehensive system-wide Use Case diagram integrating all actors and roles. |
| [`activity-diagram.md`](./activity-diagram.md) | Activity Diagram | End-to-end semester-wide institutional workflow with cross-functional swimlanes. |
| [`sequence-diagram.md`](./sequence-diagram.md) | Sequence Diagram | Cross-role transaction lifecycle sequence from application to CHED dispatch. |
| [`state-machine-diagram.md`](./state-machine-diagram.md) | State Machine Diagram | Unified state machine governing documents, student application, and verification lifecycles. |
| [`communication-diagram.md`](./communication-diagram.md) | Communication Diagram | Cross-subsystem messaging map and high-traffic collaboration analysis. |
| [`interaction-overview-diagram.md`](./interaction-overview-diagram.md) | Interaction Overview | Macro-level orchestration connecting auth, intake, review, and liquidation. |
| [`timing-diagram.md`](./timing-diagram.md) | Timing Diagram | Academic semester TDP lifecycle, SLA deadlines, and audit constraints. |
| [`requirement-diagram.md`](./requirement-diagram.md) | Requirement Diagram (SysML) | System-wide requirement traceability connecting blocks and test cases. |
