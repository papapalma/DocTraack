# Campus Director — Package Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Package Diagram  
> **Standard:** UML 2.5 Package Specification

---

## 1. Purpose

The Package Diagram shows the codebase packages, UI modules, and domain services that implement the executive review and analytics subsystem.

---

## 2. Mermaid Package Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef routeStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef compStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef libStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;
    classDef typeStyle fill:#DCEFDD,stroke:#123F17,stroke-width:1.5px,color:#123F17;

    subgraph ROUTE_PKG["Package: src/app (Executive Routing)"]
        REVIEW_PAGE["app/(dashboard)/review"]:::routeStyle
        ANALYTICS_PAGE["app/(dashboard)/analytics"]:::routeStyle
        API_APPROVE["app/api/documents/[id]/approve"]:::routeStyle
        API_RETURN["app/api/documents/[id]/return"]:::routeStyle
    end

    subgraph UI_PKG["Package: src/components (Executive Views)"]
        QUEUE_COMP["components/review (Modals & Cards)"]:::compStyle
        ANALYTICS_COMP["components/analytics (Charts & KPIs)"]:::compStyle
    end

    subgraph LIB_PKG["Package: src/lib (Core Services)"]
        RBAC_LIB["lib/rbac.ts (Signatory Guard)"]:::libStyle
        AUDIT_LIB["lib/audit.ts (Audit Logger)"]:::libStyle
        NOTIF_LIB["lib/notifications.ts (In-App Alerts)"]:::libStyle
        PRISMA_LIB["lib/prisma.ts (Database Client)"]:::libStyle
    end

    subgraph TYPES_PKG["Package: src/types (Domain Contracts)"]
        DOC_TYPES["types/document.ts (DocumentStatus Enums)"]:::typeStyle
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
    subgraph LEGEND ["📌 Diagram Legend"]
        direction TB
        L_App["subgraph: Routing & UI Package"]:::pkgStyle
        L_Lib["subgraph: Domain Services & Utils"]:::libStyle
        L_Type["subgraph: Pure TypeScript Contracts"]:::typeStyle
        L_App -->|imports / depends on| L_Lib
        L_Lib -->|implements types| L_Type
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Package Concept | MinSU DocTrack Codebase Structure |
|---|---|---|---|
| 🟩 Green Folder | `fill:#F1F8F1, stroke:#1B5E20` | Presentation & Routing Package | Next.js App Router (`src/app`) & React components (`src/components`) |
| 🟨 Gold Folder | `fill:#FFF1C2, stroke:#F2B705` | Core Business & Lib Services | Prisma singleton, crypto auth, RBAC guards, PDF compiler (`src/lib`) |
| 🟩 Dark Green Box | `fill:#DCEFDD, stroke:#123F17` | Contract & Persistence Schema | Strictly typed schemas (`src/types`) and ORM definition (`prisma/`) |
| `-->` Solid Arrow | Downward Package Dependency | Upstream module imports or depends on downstream services (strictly unidirectional) |


---

## 4. PlantUML Package Diagram

```plantuml
@startuml
skinparam packageStyle folder
skinparam backgroundColor #FFFFFF
skinparam packageBackgroundColor #F1F8F1
skinparam packageBorderColor #1B5E20

package "src/app (Director Routes)" {
  package "review" as ReviewPage
  package "analytics" as AnalyticsPage
  package "api/endorse" as EndorseApi
}

package "src/components (Executive UI)" {
  package "review" as ReviewUI
  package "analytics" as AnalyticsUI
}

package "src/lib (Domain Logic)" {
  [rbac.ts] as RBAC
  [audit.ts] as Audit
  [notifications.ts] as Notif
  [prisma.ts] as DB
}

package "src/types" {
  [document.ts] as DocTypes
}

ReviewPage ..> ReviewUI
AnalyticsPage ..> AnalyticsUI
ReviewPage ..> EndorseApi
EndorseApi ..> RBAC : <<use>>
EndorseApi ..> Audit : <<use>>
EndorseApi ..> Notif : <<use>>
EndorseApi ..> DB : <<use>>

RBAC ..> DocTypes : <<import>>
ReviewUI ..> DocTypes : <<import>>

@enduml
```

---

## 5. Package Coupling Rules

- Executive presentation packages (`components/review`, `components/analytics`) depend on data contracts without circular references.
- `EndorseApi` coordinates mutations across RBAC, Audit, and Notification services.
