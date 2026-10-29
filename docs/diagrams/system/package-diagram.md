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
        AUTH_ROUTING["app/(auth)"]:::pkgStyle
        DASHBOARD_ROUTING["app/(dashboard)"]:::pkgStyle
        PORTAL_ROUTING["app/portal"]:::pkgStyle
        API_ROUTING["app/api"]:::pkgStyle
    end

    subgraph COMPONENTS_PACKAGE["Package: src/components (Presentation Layer)"]
        UI_COMPONENTS["components/ui (Primitives)"]:::pkgStyle
        DOC_COMPONENTS["components/documents (Forms & Tables)"]:::pkgStyle
        REVIEW_COMPONENTS["components/review (Queue Modals)"]:::pkgStyle
        PORTAL_COMPONENTS["components/portal (Student Apply)"]:::pkgStyle
    end

    subgraph LIB_PACKAGE["Package: src/lib (Domain Logic & Infrastructure)"]
        PRISMA_CLIENT["lib/prisma.ts"]:::libStyle
        AUTH_LIB["lib/auth.ts (Tokens & Crypto)"]:::libStyle
        RBAC_LIB["lib/rbac.ts (Role Verification)"]:::libStyle
        AUDIT_LIB["lib/audit.ts (Action Logger)"]:::libStyle
        PDF_LIB["lib/pdf.ts (Puppeteer Bridge)"]:::libStyle
        VALIDATION_LIB["lib/validation.ts (Zod Schemas)"]:::libStyle
    end

    subgraph TYPES_PACKAGE["Package: src/types (Contract Layer)"]
        TYPES_DEFINITIONS["types/*.ts (Discriminated Unions)"]:::typeStyle
    end

    subgraph PRISMA_SCHEMA["Package: prisma (Database Layer)"]
        SCHEMA_DEF["prisma/schema.prisma"]:::typeStyle
    end

    %% Dependency Arrows
    APP_PACKAGE --> COMPONENTS_PACKAGE
    APP_PACKAGE --> LIB_PACKAGE
    APP_PACKAGE --> TYPES_PACKAGE

    COMPONENTS_PACKAGE --> LIB_PACKAGE
    COMPONENTS_PACKAGE --> TYPES_PACKAGE

    LIB_PACKAGE --> TYPES_PACKAGE
    LIB_PACKAGE --> PRISMA_SCHEMA

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

package "src/app (Route Layer)" as App {
  package "(auth)" as AuthRoute
  package "(dashboard)" as DashRoute
  package "portal" as PortalRoute
  package "api" as ApiRoute
}

package "src/components (UI Layer)" as Components {
  package "ui" as UI
  package "documents" as DocViews
  package "review" as ReviewViews
  package "portal" as PortalViews
}

package "src/lib (Domain & Utilities)" as Lib {
  [auth.ts] as AuthLib
  [rbac.ts] as RBACLib
  [prisma.ts] as PrismaLib
  [audit.ts] as AuditLib
  [pdf.ts] as PdfLib
  [validation.ts] as ValidationLib
}

package "src/types (Contracts)" as Types {
  [auth.d.ts]
  [documents.d.ts]
  [annex.d.ts]
}

package "prisma (Database Model)" as DB {
  [schema.prisma]
}

App ..> Components : <<import>>
App ..> Lib : <<use>>
App ..> Types : <<import>>

Components ..> Lib : <<use>>
Components ..> Types : <<import>>

Lib ..> Types : <<import>>
Lib ..> DB : <<generate>>

@enduml
```

---

## 5. Package Principles

- Dependencies flow in one downward direction: `app -> components -> lib -> types -> prisma`.
- No circular dependencies exist across packages.
- The `types` package contains pure TypeScript contracts without runtime dependencies.
