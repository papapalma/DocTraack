# Staff Coordinator — Package Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Package Diagram  
> **Standard:** UML 2.5 Package Specification

---

## 1. Purpose

The Package Diagram shows the codebase packages, component folders, and utility libraries that build the Staff Coordinator operations subsystem.

---

## 2. Mermaid Package Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef routeStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef compStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef libStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;
    classDef typeStyle fill:#DCEFDD,stroke:#123F17,stroke-width:1.5px,color:#123F17;

    subgraph STAFF_ROUTES["Package: src/app (Staff Routing Layer)"]
        DOCS_ROUTE["app/(dashboard)/documents (Annex 1-5, 10)"]:::routeStyle
        REGS_ROUTE["app/(dashboard)/registrations (Validation Queue)"]:::routeStyle
        VERIFY_ROUTE["app/(dashboard)/verification (3-Way Match UI)"]:::routeStyle
        CERT_ROUTE["app/(dashboard)/certificate-editor (Designer)"]:::routeStyle
        OUTGOING_ROUTE["app/(dashboard)/outgoing (Transmittals)"]:::routeStyle
    end

    subgraph STAFF_COMPONENTS["Package: src/components (Presentation Modules)"]
        DOC_FORMS["components/documents (Dynamic Form Schema)"]:::compStyle
        VERIFY_COMP["components/verification (Discrepancy Table)"]:::compStyle
        CERT_COMP["components/certificate-editor (Layout Canvas)"]:::compStyle
        REGISTRY_TABLE["components/outgoing (Transmittal Registry)"]:::compStyle
    end

    subgraph STAFF_LIB["Package: src/lib (Operational Services)"]
        VERIFY_LIB["lib/verification-matcher.ts (Tripartite Matcher)"]:::libStyle
        EXCEL_LIB["lib/excel.ts (ExcelJS Multi-Tab Workbooks)"]:::libStyle
        WORD_LIB["lib/word.ts (Word Docx Exporter)"]:::libStyle
        VALIDATION_LIB["lib/validation.ts (Input & Identity Locks)"]:::libStyle
        PRISMA_LIB["lib/prisma.ts (Database Client)"]:::libStyle
    end

    subgraph STAFF_TYPES["Package: src/types (Contract Definitions)"]
        ANNEX_TYPES["types/annex.ts (Annex Form Models)"]:::typeStyle
        VERIFY_TYPES["types/verification.ts (3-Way Match Schemas)"]:::typeStyle
        CERT_TYPES["types/certificate.ts (Template Layouts)"]:::typeStyle
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
| `[Module]` | Rectangle with border | Concrete file or sub-package | `verification-matcher.ts`, `excel.ts`, `validation.ts` |
| `-->` | Directed Dependency | Import or invocation relationship | Next.js routes import domain components and libraries |
| 🟢 Green Tone | `#F1F8F1` / `#1B5E20` | Operational Routing & UI Modules | User-facing dashboard paths and form generators |

---

## 4. Package Organization & Separation of Concerns

- **`src/app`**: Implements App Router endpoints for Annex management, validation queues, 3-way matching, and certificate designing.
- **`src/components`**: Houses modular UI components for table rendering, discrepancy filtering, and drag-and-drop certificate layout.
- **`src/lib`**: Encapsulates business logic including Jaro-Winkler string distance scoring, multi-tab `ExcelJS` generation, and immutable audit logging.
- **`src/types`**: Enforces strict TypeScript interfaces for Annex schemas, verification results, and template layouts.
