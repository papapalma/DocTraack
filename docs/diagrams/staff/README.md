# Staff Coordinator Diagrams Suite

> **Role:** `STAFF` (Staff Coordinator & Annex Operations)  
> **System:** MinSU DocTrack

---

## 1. Role Scope & Responsibilities

The Staff Coordinator is the primary operational user in MinSU DocTrack. Staff members create and edit Annexes 1 through 5 and 10, configure dynamic TDP applicant calls, validate student registration queues (`/registrations`), execute 3-way tripartite verification cross-matching (`/verification`), manually resolve candidate discrepancies, design award certificate templates (`/certificate-editor`), publish campus announcements (`/announcements`), export native multi-tab Excel workbooks, upload wet-ink signed scans, and record external transmittals in the Outgoing Registry.

---

## 2. Complete 17-Diagram Specification Index

| # | Diagram Type | File Link | Focus & Description |
|---|---|---|---|
| 1 | **System Architecture** | [`system-architecture-diagram.md`](./system-architecture-diagram.md) | Operations subsystem, verification engine, form builders, file volumes, and registry. |
| 2 | **Class Diagram** | [`class-diagram.md`](./class-diagram.md) | Document, ApplicantCall, Application, VerificationRun, and Transmittal models. |
| 3 | **Component Diagram** | [`component-diagram.md`](./component-diagram.md) | Form builders, verification engine, certificate designer, scan uploader, and storage adapters. |
| 4 | **Deployment Diagram** | [`deployment-diagram.md`](./deployment-diagram.md) | Staff workstation, mounted disk volumes, and external Google Drive links. |
| 5 | **Object Diagram** | [`object-diagram.md`](./object-diagram.md) | Runtime snapshot of grantee acceptance, 3-way verification run, and Annex compilation. |
| 6 | **Package Diagram** | [`package-diagram.md`](./package-diagram.md) | Codebase packages, form components, verification modules, and validation schemas. |
| 7 | **Composite Structure** | [`composite-structure-diagram.md`](./composite-structure-diagram.md) | Internal structure, ports, and connectors of StaffOperationsEngine. |
| 8 | **Profile Diagram** | [`profile-diagram.md`](./profile-diagram.md) | Domain stereotypes for verification checks, scan limits, and transmittal manifests. |
| 9 | **Data Flow (DFD)** | [`data-flow-diagram.md`](./data-flow-diagram.md) | Level 1 DFD tracing applicant evaluations, CSV verification runs, and transmittals. |
| 10 | **Use Case Diagram** | [`use-case-diagram.md`](./use-case-diagram.md) | Staff preparation, 3-way verification, certificate design, call management, and transmittals. |
| 11 | **Activity Diagram** | [`activity-diagram.md`](./activity-diagram.md) | End-to-end workflow from draft preparation and verification to external transmittal. |
| 12 | **Sequence Diagram** | [`sequence-diagram.md`](./sequence-diagram.md) | Verification run, Annex creation, signed scan upload, and transmittal logging. |
| 13 | **State Machine** | [`state-machine-diagram.md`](./state-machine-diagram.md) | Applicant Call and Verification Result lifecycles. |
| 14 | **Communication** | [`communication-diagram.md`](./communication-diagram.md) | Object links and numbered message flows during transmittal registration and verification. |
| 15 | **Interaction Overview** | [`interaction-overview-diagram.md`](./interaction-overview-diagram.md) | Workflow orchestration linking preparation, verification, scan uploads, and transmittals. |
| 16 | **Timing Diagram** | [`timing-diagram.md`](./timing-diagram.md) | Annex 2 application intake deadlines, CSV match execution, and Annex 1 compilation schedule. |
| 17 | **Requirement (SysML)** | [`requirement-diagram.md`](./requirement-diagram.md) | Traceability for Annex creation, 3-way verification, Excel generation, and transmittal tracking. |
