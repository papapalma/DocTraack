# MinSU DocTrack — System & Role Diagrams Suite

> **Mindoro State University (MinSU)**  
> **Tulong Dunong Program (TDP) Annex Management, Verification & Document Tracking System**

---

## 1. Overview

This directory contains the complete architecture and Unified Modeling Language (UML) specifications for **MinSU DocTrack**. The documentation strictly adheres to ASD-STE100 Simplified Technical English (STE). Every role and the whole system receive the full suite of 17 UML and architectural diagrams, totaling **85 role-specific diagrams** plus **17 whole-system architecture diagrams** (102 architectural diagram documents plus 7 index guides, totaling 103 markdown documents).

### 1.1. Core Subsystems Documented

The diagram specifications comprehensively capture the 9 core functional subsystems:
1. **Microsoft Authenticator & 2FA Extensions:** TOTP authentication, dynamic QR codes, backup recovery codes, and account lockout defense.
2. **3-Way Tripartite Verification Engine:** Tripartite automated cross-matching of CHED CSV, Registrar Enrollment CSV, and MinSU System Masterlist records with fuzzy confidence scoring and manual discrepancy resolution.
3. **Student Masterlist & Registration Queue:** Staff Coordinator validation queue (`/registrations`), slot quota tracking, and RA 10173 data privacy lock protecting student identity.
4. **Certificate of No Other Scholarship & Certificate Designer:** Customizable layout, typography, dimensions (Letter, A4, Legal, Folio), orientation (Portrait, Landscape), dynamic signatories, and live canvas preview.
5. **Campus & Public Announcements Hub:** Category tagging (`GENERAL`, `URGENT`, `DEADLINE`, `REQUIREMENTS`, `PAYROLL`), pinning, multi-tier audience targeting (`ALL`, `STUDENTS`, `PUBLIC`), and push notifications.
6. **Native Multi-Format Document Generation:** Dual-mode suites, native multi-tab `ExcelJS` workbooks (Annexes 1, 3, 4, 5, 6, 7, 8, 9), Word `.doc` generation (Annex 10), and `@media print` optimized PDF rendering.
7. **Landing Page CMS Split-Screen Editor:** Drag-and-drop section manager with live responsive preview frames (Desktop, Tablet, Mobile) and draft vs. published workflow.
8. **Institutional Branding & Logo Asset Management:** Multi-agency logo uploads, MIME verification, and SVG XSS CSP mitigation.
9. **Rate Limiting & Security Hardening:** Sliding-window rate limiting with administrator toggle, tamper-resistant audit logs, and edge security headers.

---

## 2. Master Navigation Matrix (17 Diagrams × 6 Scopes)

| # | Diagram Type | [`admin/`](./admin/README.md) | [`director/`](./director/README.md) | [`staff/`](./staff/README.md) | [`accounting/`](./accounting/README.md) | [`student/`](./student/README.md) | [`system/`](./system/README.md) |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **System Architecture** | [View](./admin/system-architecture-diagram.md) | [View](./director/system-architecture-diagram.md) | [View](./staff/system-architecture-diagram.md) | [View](./accounting/system-architecture-diagram.md) | [View](./student/system-architecture-diagram.md) | [View](./system/system-architecture-diagram.md) |
| 2 | **Class** | [View](./admin/class-diagram.md) | [View](./director/class-diagram.md) | [View](./staff/class-diagram.md) | [View](./accounting/class-diagram.md) | [View](./student/class-diagram.md) | [View](./system/class-diagram.md) |
| 3 | **Component** | [View](./admin/component-diagram.md) | [View](./director/component-diagram.md) | [View](./staff/component-diagram.md) | [View](./accounting/component-diagram.md) | [View](./student/component-diagram.md) | [View](./system/component-diagram.md) |
| 4 | **Deployment** | [View](./admin/deployment-diagram.md) | [View](./director/deployment-diagram.md) | [View](./staff/deployment-diagram.md) | [View](./accounting/deployment-diagram.md) | [View](./student/deployment-diagram.md) | [View](./system/deployment-diagram.md) |
| 5 | **Object** | [View](./admin/object-diagram.md) | [View](./director/object-diagram.md) | [View](./staff/object-diagram.md) | [View](./accounting/object-diagram.md) | [View](./student/object-diagram.md) | [View](./system/object-diagram.md) |
| 6 | **Package** | [View](./admin/package-diagram.md) | [View](./director/package-diagram.md) | [View](./staff/package-diagram.md) | [View](./accounting/package-diagram.md) | [View](./student/package-diagram.md) | [View](./system/package-diagram.md) |
| 7 | **Composite Structure** | [View](./admin/composite-structure-diagram.md) | [View](./director/composite-structure-diagram.md) | [View](./staff/composite-structure-diagram.md) | [View](./accounting/composite-structure-diagram.md) | [View](./student/composite-structure-diagram.md) | [View](./system/composite-structure-diagram.md) |
| 8 | **Profile** | [View](./admin/profile-diagram.md) | [View](./director/profile-diagram.md) | [View](./staff/profile-diagram.md) | [View](./accounting/profile-diagram.md) | [View](./student/profile-diagram.md) | [View](./system/profile-diagram.md) |
| 9 | **Data Flow (DFD)** | [View](./admin/data-flow-diagram.md) | [View](./director/data-flow-diagram.md) | [View](./staff/data-flow-diagram.md) | [View](./accounting/data-flow-diagram.md) | [View](./student/data-flow-diagram.md) | [View](./system/data-flow-diagram.md) |
| 10 | **Use Case** | [View](./admin/use-case-diagram.md) | [View](./director/use-case-diagram.md) | [View](./staff/use-case-diagram.md) | [View](./accounting/use-case-diagram.md) | [View](./student/use-case-diagram.md) | [View](./system/use-case-diagram.md) |
| 11 | **Activity** | [View](./admin/activity-diagram.md) | [View](./director/activity-diagram.md) | [View](./staff/activity-diagram.md) | [View](./accounting/activity-diagram.md) | [View](./student/activity-diagram.md) | [View](./system/activity-diagram.md) |
| 12 | **Sequence** | [View](./admin/sequence-diagram.md) | [View](./director/sequence-diagram.md) | [View](./staff/sequence-diagram.md) | [View](./accounting/sequence-diagram.md) | [View](./student/sequence-diagram.md) | [View](./system/sequence-diagram.md) |
| 13 | **State Machine** | [View](./admin/state-machine-diagram.md) | [View](./director/state-machine-diagram.md) | [View](./staff/state-machine-diagram.md) | [View](./accounting/state-machine-diagram.md) | [View](./student/state-machine-diagram.md) | [View](./system/state-machine-diagram.md) |
| 14 | **Communication** | [View](./admin/communication-diagram.md) | [View](./director/communication-diagram.md) | [View](./staff/communication-diagram.md) | [View](./accounting/communication-diagram.md) | [View](./student/communication-diagram.md) | [View](./system/communication-diagram.md) |
| 15 | **Interaction Overview** | [View](./admin/interaction-overview-diagram.md) | [View](./director/interaction-overview-diagram.md) | [View](./staff/interaction-overview-diagram.md) | [View](./accounting/interaction-overview-diagram.md) | [View](./student/interaction-overview-diagram.md) | [View](./system/interaction-overview-diagram.md) |
| 16 | **Timing** | [View](./admin/timing-diagram.md) | [View](./director/timing-diagram.md) | [View](./staff/timing-diagram.md) | [View](./accounting/timing-diagram.md) | [View](./student/timing-diagram.md) | [View](./system/timing-diagram.md) |
| 17 | **Requirement (SysML)** | [View](./admin/requirement-diagram.md) | [View](./director/requirement-diagram.md) | [View](./staff/requirement-diagram.md) | [View](./accounting/requirement-diagram.md) | [View](./student/requirement-diagram.md) | [View](./system/requirement-diagram.md) |

---

## 3. MinSU Color Identity Standard

All diagram styling conforms to the official university brand palette:

- **MinSU Primary Green (`#1B5E20`)**: Core services, approved states, and institutional boundaries.
- **MinSU Gold Accent (`#F2B705`)**: Active reviews, submission triggers, and notifications.
- **MinSU Dark Green (`#123F17`)**: Database engines, persistent nodes, and external transmittals.
- **Surface Page (`#F6F8F6`)**: Background canvas and neutral framing.
- **Ink Contrast (`#1F2A24`)**: High-contrast labels and text elements.

---

## 4. Diagram Standard & Tooling

Diagrams use **Mermaid.js** fenced code blocks for direct rendering on GitHub and modern markdown tools. Where structural or timing details require standard UML syntax, **PlantUML** alternative blocks are also provided.

---

## 5. Universal Legend & Symbol Guide

Every architectural and behavioral diagram in this suite includes a **Hybrid Legend**:
1. **In-Diagram Visual Key**: Rendered directly inside the diagram canvas (via Mermaid subgraphs, notes, or PlantUML legends).
2. **Tabular Symbol Guide**: A dedicated markdown section (`## Diagram Legend & Symbol Guide`) explaining every shape, connection type, and MinSU domain meaning.

### Color Semantic Palette

| Token / Color | Hex / RGB Code | State / Semantic Meaning | Real-World MinSU Context |
|---|---|---|---|
| 🟢 **MinSU Green** | `#1B5E20` / `#DCEFDD` | **Approved / Success / Core Persistence** | Campus Director approved Annex, zero-variance ledger, PostgreSQL database |
| 🟡 **MinSU Gold** | `#F2B705` / `#FFF1C2` | **In Review / Pending / SLA Gate** | Review queue ingress, 48h turnaround SLA, quota checking |
| 🔴 **Alert Red** | `#DC2626` / `#FEE2E2` | **Returned / Discrepancy / Error** | Returned for revision comments, budget variance != 0.00 PHP |
| ⚪ **Surface & Neutral** | `#FFFFFF` / `#F6F8F6` | **Actor / Presentation UI / Scans** | Student application portal, Next.js WebUI, scanned PDF uploads |
| 🔵 **Agency Dark** | `#123F17` / `#1E293B` | **External Agency / Transmittal** | CHED / UniFAST regional office, courier tracking barcodes |

### Universal Notation & Shape Key

| UML / SysML Shape | Visual Representation | Standard Meaning | MinSU Application |
|---|---|---|---|
| **Actor** | 👤 `actor` / `[Actor]` | External human user role or external agency | Student, Staff Coordinator, Campus Director, Accounting, CHED |
| **Component / Subsystem** | 🔲 `["Name"]` / `<<component>>` | Core software service or controller | `DocumentWorkflowEngine`, `AuthService`, `PdfService` |
| **Action / Process** | 🔲 `[Action Text]` / `1.0 Process` | Operational task or procedure | `Compile Annex 2`, `Evaluate Applicants`, `Scan Wet-Signed PDF` |
| **Decision / Condition** | 🔶 `{Condition?}` | Guard condition evaluation | `Director Approves?`, `Variance == 0.00?`, `Within Quota?` |
| **State Boundary** | 🟢 `([Pill])` / `● [*]` / `◎ [*]` | Initial start or terminal archive node | Semester cycle initiation, archival closure |
| **Persistent Data Store** | 🟨 `[("Cylinder")]` / `database` | Relational table or persistent file store | PostgreSQL tables (`D1-D5`), local disk volumes, cloud drive |
| **Synchronous Call** | ──▶ `->>` / `-->` | Direct invocation or request | Submitting forms, executing transactions, API queries |
| **Return / Response** | - - ▷ `-->>` / `-.->` | Return response or asynchronous data stream | Returning tracking codes, PDF binary buffers, status receipts |
| **Dependency** | `..>` / `-.->` | Stereotyped dependency | `<<include>>` (Mandatory audit log), `<<extend>>` (Optional PDF export) |
| **Composition** | `*--` (Filled Diamond) | Strong lifecycle ownership | Document owns StatusHistory and Comment records (Cascade delete) |
| **Timing Interval** | `@A <-> @B : {SLA}` | Strict temporal turnaround SLA constraint | 48-Hour Executive SLA, 14-Day Intake Window |
