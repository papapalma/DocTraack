# Package Diagram

> **System:** MinSU DocTrack  
> **Diagram Type:** Package Diagram  
> **Standard:** UML 2.5 Package Specification

---

## 1. Purpose

The Package Diagram groups modules into logical packages. It shows the dependency arrows and prevents circular coupling between architectural layers.

---

## 2. Mermaid Package Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef pkgStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef libStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;
    classDef typeStyle fill:#DCEFDD,stroke:#123F17,stroke-width:1.5px,color:#123F17;

    subgraph APP_PACKAGE["Package: src/app (Routing & Boundary Layer)"]
        AUTH_ROUTING["app/(auth) & 2FA"]:::pkgStyle
        DASHBOARD_ROUTING["app/(dashboard) (Admin, Review, Verification, Certs)"]:::pkgStyle
        PORTAL_ROUTING["app/portal (Student Apply & Profile)"]:::pkgStyle
        API_ROUTING["app/api (Exports, Documents, Verification, CMS)"]:::pkgStyle
    end

    subgraph COMPONENTS_PACKAGE["Package: src/components (Presentation Layer)"]
        UI_COMPONENTS["components/ui (Radix Primitives)"]:::pkgStyle
        DOC_COMPONENTS["components/documents (Forms, Canvas & Tables)"]:::pkgStyle
        REVIEW_COMPONENTS["components/review (Queue Modals)"]:::pkgStyle
        VERIFY_COMPONENTS["components/verification (CSV Match & Discrepancies)"]:::pkgStyle
        CERT_COMPONENTS["components/certificate (Designer Canvas & Signees)"]:::pkgStyle
        ANNOUNCE_COMPONENTS["components/announcements (Feed & Ticker)"]:::pkgStyle
        CMS_COMPONENTS["components/landing (Split-Screen CMS Editor)"]:::pkgStyle
    end

    subgraph LIB_PACKAGE["Package: src/lib (Domain Logic & Infrastructure)"]
        PRISMA_CLIENT["lib/prisma.ts"]:::libStyle
        AUTH_LIB["lib/auth.ts (Sessions & TOTP 2FA)"]:::libStyle
        RBAC_LIB["lib/rbac.ts (Role Verification)"]:::libStyle
        RATE_LIMIT_LIB["lib/rate-limit.ts (Anti-Brute-Force)"]:::libStyle
        VERIFY_LIB["lib/verification.ts (Fuzzy Match & Tripartite)"]:::libStyle
        AUDIT_LIB["lib/audit.ts (Action Logger)"]:::libStyle
        EXCEL_LIB["lib/excel.ts (ExcelJS Multi-Tab Workbooks)"]:::libStyle
        VALIDATION_LIB["lib/validation.ts (Input Schemas)"]:::libStyle
    end

    subgraph TYPES_PACKAGE["Package: src/types (Contract Layer)"]
        TYPES_DEFINITIONS["types/*.ts (Discriminated Unions)"]:::typeStyle
    end

    subgraph PRISMA_SCHEMA["Package: prisma (Database Layer)"]
        SCHEMA_DEF["prisma/schema.prisma (10 PostgreSQL Models)"]:::typeStyle
    end

    %% Dependency Arrows
    APP_PACKAGE --> COMPONENTS_PACKAGE
    APP_PACKAGE --> LIB_PACKAGE
    APP_PACKAGE --> TYPES_PACKAGE

    COMPONENTS_PACKAGE --> LIB_PACKAGE
    COMPONENTS_PACKAGE --> TYPES_PACKAGE

    LIB_PACKAGE --> PRISMA_SCHEMA
    LIB_PACKAGE --> TYPES_PACKAGE

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Pkg["[Package]: Namespace Folder"]:::pkgStyle
        L_Lib["[Library Package]: Core Infrastructure"]:::libStyle
        L_Type["[Contract Package]: Type Schemas"]:::typeStyle
        L_Pkg --> L_Lib
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | UML Package Concept | MinSU System Implementation |
|---|---|---|
| `Package` | Architectural Namespace | `src/app`, `src/components`, `src/lib`, `src/types`, `prisma` |
| `-->` | Directed Dependency | Consumer imports definitions from producer package |
| `Acyclic Rule` | Layered Architecture | `src/app` depends on `src/lib`, but `src/lib` never imports from `src/app` |

---

## 4. PlantUML Package Diagram

```plantuml
@startuml
skinparam packageBackgroundColor #F6F8F6
skinparam packageBorderColor #1B5E20

package "src/app (Routing Layer)" {
  [app/(auth)]
  [app/(dashboard)]
  [app/portal]
  [app/api]
}

package "src/components (Presentation Layer)" {
  [components/ui]
  [components/documents]
  [components/verification]
  [components/certificate]
  [components/announcements]
  [components/landing]
}

package "src/lib (Infrastructure & Domain Layer)" {
  [lib/prisma.ts]
  [lib/auth.ts (2FA & TOTP)]
  [lib/verification.ts]
  [lib/excel.ts]
  [lib/rate-limit.ts]
  [lib/audit.ts]
}

package "src/types (Contracts Layer)" {
  [types/*.ts]
}

package "prisma (Data Schema)" {
  [schema.prisma]
}

"src/app (Routing Layer)" ..> "src/components (Presentation Layer)"
"src/app (Routing Layer)" ..> "src/lib (Infrastructure & Domain Layer)"
"src/components (Presentation Layer)" ..> "src/lib (Infrastructure & Domain Layer)"
"src/lib (Infrastructure & Domain Layer)" ..> "prisma (Data Schema)"
@enduml
```
