# System Admin — Package Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Package Diagram  
> **Standard:** UML 2.5 Package Specification

---

## 1. Purpose

The Package Diagram shows the organization of codebase packages and modular dependencies that build the administrative system.

---

## 2. Mermaid Package Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef routeStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef libStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;
    classDef typeStyle fill:#DCEFDD,stroke:#123F17,stroke-width:1.5px,color:#123F17;

    subgraph ADMIN_ROUTES["Package: src/app (Admin Routes)"]
        USERS_ROUTE["app/(dashboard)/users"]:::routeStyle
        AUDIT_ROUTE["app/(dashboard)/audit-logs"]:::routeStyle
        CMS_ROUTE["app/(dashboard)/landing-editor"]:::routeStyle
        API_USERS["app/api/users"]:::routeStyle
        API_AUDIT["app/api/audit-logs"]:::routeStyle
        API_CMS["app/api/cms"]:::routeStyle
    end

    subgraph ADMIN_LIB["Package: src/lib (Admin Logic & Guards)"]
        RBAC_LIB["lib/rbac.ts (Role Verification)"]:::libStyle
        AUTH_LIB["lib/auth.ts (Password & Sessions)"]:::libStyle
        AUDIT_LIB["lib/audit.ts (Event Dispatcher)"]:::libStyle
        PRISMA_LIB["lib/prisma.ts (ORM Client)"]:::libStyle
    end

    subgraph ADMIN_TYPES["Package: src/types (Admin Contracts)"]
        AUTH_TYPES["types/auth.ts (User & Role Types)"]:::typeStyle
        AUDIT_TYPES["types/audit.ts (Action Enums)"]:::typeStyle
    end

    %% Dependencies
    ADMIN_ROUTES --> ADMIN_LIB
    ADMIN_ROUTES --> ADMIN_TYPES
    ADMIN_LIB --> ADMIN_TYPES
    ADMIN_LIB --> PRISMA_LIB

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

package "src/app (Admin Web Interface)" {
  package "users" as UsersPage
  package "audit-logs" as AuditPage
  package "landing-editor" as CMSPage
  package "api/users" as ApiUsers
  package "api/audit" as ApiAudit
}

package "src/lib (Domain Helpers)" {
  [rbac.ts] as RBAC
  [auth.ts] as Auth
  [audit.ts] as Audit
  [prisma.ts] as DB
}

package "src/types (Contracts)" {
  [auth.ts] as AuthTypes
  [audit.ts] as AuditTypes
}

UsersPage ..> ApiUsers
AuditPage ..> ApiAudit
ApiUsers ..> RBAC : <<use>>
ApiUsers ..> Auth : <<use>>
ApiUsers ..> Audit : <<use>>
ApiUsers ..> DB : <<use>>
ApiAudit ..> DB : <<use>>

RBAC ..> AuthTypes : <<import>>
Audit ..> AuditTypes : <<import>>

@enduml
```

---

## 5. Package Coupling Rules

- Admin pages communicate only with underlying API routes and utility modules.
- Types contain zero runtime overhead and define strict type unions.
- The `audit.ts` module is self-contained to prevent circular dependencies.
