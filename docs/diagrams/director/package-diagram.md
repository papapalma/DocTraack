# Campus Director — Package Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Package Diagram  
> **Standard:** UML 2.5 Package Specification

---

## 1. Purpose

The Package Diagram shows the codebase packages, UI modules, and domain services that implement the executive review, verification oversight, and KPI analytics subsystem.

---

## 2. Mermaid Package Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef routeStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef compStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef libStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;
    classDef typeStyle fill:#DCEFDD,stroke:#123F17,stroke-width:1.5px,color:#123F17;

    subgraph ROUTE_PKG["Package: src/app (Executive Routing Layer)"]
        REVIEW_PAGE["app/(dashboard)/review (Executive Queue)"]:::routeStyle
        ANALYTICS_PAGE["app/(dashboard)/analytics (SLA Metrics)"]:::routeStyle
        ANNOUNCE_PAGE["app/(dashboard)/announcements (Broadcasts)"]:::routeStyle
        API_APPROVE["app/api/documents/[id]/approve"]:::routeStyle
        API_RETURN["app/api/documents/[id]/return"]:::routeStyle
        API_OVERSIGHT["app/api/verification/[id]/sign-off"]:::routeStyle
    end

    subgraph UI_PKG["Package: src/components (Executive Views)"]
        QUEUE_COMP["components/review (1-Click Modals & Previews)"]:::compStyle
        ANALYTICS_COMP["components/analytics (Recharts Velocity Gauges)"]:::compStyle
        OVERSIGHT_COMP["components/verification (Discrepancy Inspector)"]:::compStyle
    end

    subgraph LIB_PKG["Package: src/lib (Core Services)"]
        RBAC_LIB["lib/rbac.ts (Signatory & Director Guard)"]:::libStyle
        AUDIT_LIB["lib/audit.ts (Immutable Audit Logger)"]:::libStyle
        NOTIF_LIB["lib/notifications.ts (In-App Alerts)"]:::libStyle
        PRISMA_LIB["lib/prisma.ts (Database Client)"]:::libStyle
    end

    subgraph TYPES_PKG["Package: src/types (Domain Contracts)"]
        DOC_TYPES["types/document.ts (DocumentStatus Enums)"]:::typeStyle
        VERIFY_TYPES["types/verification.ts (Run & Discrepancy Schemas)"]:::typeStyle
        ANALYTICS_TYPES["types/analytics.ts (Turnaround Calculations)"]:::typeStyle
    end

    %% Dependencies
    ROUTE_PKG --> UI_PKG
    ROUTE_PKG --> LIB_PKG
    ROUTE_PKG --> TYPES_PKG

    UI_PKG --> LIB_PKG
    UI_PKG --> TYPES_PKG

    LIB_PKG --> TYPES_PKG
    LIB_PKG --> PRISMA_LIB

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Pkg["Package: folderPath"]:::routeStyle
        L_Mod["Sub-Module / File"]:::compStyle
        L_Pkg --> L_Mod
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Package Concept | MinSU Implementation |
|---|---|---|---|
| `subgraph Pkg` | Folder Container | Architectural Namespace or Directory | `src/app`, `src/components`, `src/lib`, `src/types` |
| `[Module]` | Rectangle with border | Concrete file or sub-package | `review/page.tsx`, `analytics/page.tsx`, `rbac.ts` |
| `-->` | Directed Dependency | Import or invocation relationship | Executive routes import review components and RBAC guards |
| 🟢 Green Tone | `#F1F8F1` / `#1B5E20` | Executive Routing & UI Modules | Director pages and approval action routes |

---

## 4. Package Organization & Separation of Concerns

- **`src/app`**: Exposes protected executive routes (`/review`, `/analytics`, `/announcements`) guarded by `CAMPUS_DIRECTOR` role validation.
- **`src/components`**: Contains interactive review queue tables, document return confirmation dialogs, and Recharts KPI graphs.
- **`src/lib`**: Houses the core RBAC checks, immutable audit logging with actor context, and notification dispatchers.
- **`src/types`**: Declares TypeScript discriminating unions for `DocumentStatus` and verification result structures.
