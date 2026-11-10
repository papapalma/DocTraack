# Student Applicant Diagrams Suite

> **Role:** `STUDENT` (Scholarship Applicant & Beneficiary)  
> **System:** MinSU DocTrack

---

## 1. Role Scope & Responsibilities

The Student Applicant interacts with MinSU DocTrack through the public landing page and the dedicated Student Portal (`/portal`). Students can register accounts using their university email, configure Microsoft Authenticator 2FA, browse published TDP scholarship calls (Annex 2), fill out online application forms with uploaded documentary proofs, track application status using unique tracking codes, maintain persistent profile details under RA 10173 data privacy locks, and view official campus announcements.

---

## 2. Diagram Index (17 Complete Architectural Views)

| File | Diagram Type | Description |
|---|---|---|
| [`system-architecture-diagram.md`](./system-architecture-diagram.md) | System Architecture | Public-facing portal multi-tier layout, edge routing, and file intake. |
| [`class-diagram.md`](./class-diagram.md) | Class Diagram | Object-oriented models for applications, attachments, profile JSON, and tracking results. |
| [`component-diagram.md`](./component-diagram.md) | Component Diagram | Modular component dependencies between portal UI, 2FA controller, upload engines, and validators. |
| [`deployment-diagram.md`](./deployment-diagram.md) | Deployment Diagram | Deployment topology across student mobile/desktop devices, edge proxy, and DB. |
| [`object-diagram.md`](./object-diagram.md) | Object Diagram | Runtime snapshot of a submitted student application and associated entities. |
| [`package-diagram.md`](./package-diagram.md) | Package Diagram | Code organization across portal routes, UI components, and utility libraries. |
| [`composite-structure-diagram.md`](./composite-structure-diagram.md) | Composite Structure | Internal collaboration parts and ports within the Student Portal Engine. |
| [`profile-diagram.md`](./profile-diagram.md) | Profile Diagram | UML stereotypes for `<<ApplicantSubmission>>`, `<<DocumentProof>>`, and `<<TrackingLookup>>`. |
| [`data-flow-diagram.md`](./data-flow-diagram.md) | Data Flow Diagram (DFD) | Level 1 DFD tracing application submission, storage, and tracking code inquiry. |
| [`use-case-diagram.md`](./use-case-diagram.md) | Use Case Diagram | Portal access, 2FA setup, online application submission, and status tracking. |
| [`activity-diagram.md`](./activity-diagram.md) | Activity Diagram | End-to-end student application workflow with validation and receipt generation. |
| [`sequence-diagram.md`](./sequence-diagram.md) | Sequence Diagram | Application submission, tracking code generation, and receipt download flow. |
| [`state-machine-diagram.md`](./state-machine-diagram.md) | State Machine Diagram | Application lifecycle states (Submitted, Under Review, Accepted, Rejected). |
| [`communication-diagram.md`](./communication-diagram.md) | Communication Diagram | Object message sequence for tracking code status inquiry. |
| [`interaction-overview-diagram.md`](./interaction-overview-diagram.md) | Interaction Overview | High-level portal browsing, application wizard, and status tracking flow. |
| [`timing-diagram.md`](./timing-diagram.md) | Timing Diagram | Application submission window, coordinator evaluation, and award timeline. |
| [`requirement-diagram.md`](./requirement-diagram.md) | Requirement Diagram (SysML) | Traceability for student accessibility, tracking codes, and document uploads. |
