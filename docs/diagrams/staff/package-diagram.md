# Staff Coordinator — Package Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Package Diagram  
> **Standard:** UML 2.5 Package Specification

---

## 1. Purpose

The Package Diagram shows the codebase packages, component folders, and utility libraries that build the Staff operations subsystem.

---

## 2. Mermaid Package Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef routeStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef compStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef libStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;
    classDef typeStyle fill:#DCEFDD,stroke:#123F17,stroke-width:1.5px,color:#123F17;

    subgraph STAFF_ROUTES["Package: src/app (Staff Routing)"]
        DOCS_ROUTE["app/(dashboard)/documents"]:::routeStyle
        CALLS_ROUTE["app/(dashboard)/calls"]:::routeStyle
        REGS_ROUTE["app/(dashboard)/registrations"]:::routeStyle
        OUTGOING_ROUTE["app/(dashboard)/outgoing"]:::routeStyle
    end

    subgraph STAFF_COMPONENTS["Package: src/components (Staff Views)"]
        DOC_FORMS["components/documents (Annexes 1-10 Forms)"]:::compStyle
        CALL_BUILDER["components/calls (Form Schema Builder)"]:::compStyle
        REGISTRY_TABLE["components/outgoing (Transmittal Registry)"]:::compStyle
    end

    subgraph STAFF_LIB["Package: src/lib (Operational Services)"]
        VALIDATION_LIB["lib/validation.ts (Zod Annex Schemas)"]:::libStyle
        PDF_LIB["lib/pdf.ts (PDF Document Generator)"]:::libStyle
        AUDIT_LIB["lib/audit.ts (Action Logger)"]:::libStyle
        PRISMA_LIB["lib/prisma.ts (Database Access)"]:::libStyle
    end

    subgraph STAFF_TYPES["Package: src/types (Operational Contracts)"]
        ANNEX_TYPES["types/annex.ts (Form Schema Definitions)"]:::typeStyle
    end

    %% Dependencies
    STAFF_ROUTES --> STAFF_COMPONENTS
    STAFF_ROUTES --> STAFF_LIB
    STAFF_ROUTES --> STAFF_TYPES

    STAFF_COMPONENTS --> STAFF_LIB
    STAFF_COMPONENTS --> STAFF_TYPES

    STAFF_LIB --> STAFF_TYPES
    STAFF_LIB --> PRISMA_LIB

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

package "src/app (Staff Routes)" {
  package "documents" as DocRoutes
  package "calls" as CallRoutes
  package "registrations" as RegRoutes
  package "outgoing" as OutgoingRoutes
}

package "src/components" {
  package "documents" as DocComponents
  package "calls" as CallComponents
  package "outgoing" as OutgoingComponents
}

package "src/lib" {
  [validation.ts] as Validation
  [pdf.ts] as PDF
  [audit.ts] as Audit
  [prisma.ts] as DB
}

package "src/types" {
  [annex.ts] as AnnexTypes
}

DocRoutes ..> DocComponents
CallRoutes ..> CallComponents
OutgoingRoutes ..> OutgoingComponents

DocComponents ..> Validation : <<use>>
DocComponents ..> PDF : <<use>>
DocComponents ..> DB : <<use>>
DocComponents ..> AnnexTypes : <<import>>

@enduml
```

---

## 5. Package Principles

- `components/documents` uses `lib/validation.ts` to validate form entries before submission.
- All packages depend downward on `types/annex.ts` without reverse coupling.
