# System Admin — Package Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Package Diagram  
> **Standard:** UML 2.5 Package Specification

---

## 1. Purpose

The Package Diagram shows the organization of codebase packages, route handlers, and modular dependencies that build the System Administrator subsystem.

---

## 2. Mermaid Package Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef routeStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef libStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;
    classDef typeStyle fill:#DCEFDD,stroke:#123F17,stroke-width:1.5px,color:#123F17;

    subgraph ADMIN_ROUTES["Package: src/app (Admin Routing Layer)"]
        USERS_ROUTE["app/(dashboard)/users (Account Management)"]:::routeStyle
        AUDIT_ROUTE["app/(dashboard)/audit-logs (Forensics Explorer)"]:::routeStyle
        CMS_ROUTE["app/(dashboard)/landing-editor (Split-Screen CMS)"]:::routeStyle
        API_USERS["app/api/users (Provisioning & 2FA Reset)"]:::routeStyle
        API_AUDIT["app/api/audit-logs (CSV Streaming)"]:::routeStyle
        API_CMS["app/api/landing (Staging & Publish)"]:::routeStyle
        API_BRANDING["app/api/branding (Logo Upload & Theme)"]:::routeStyle
        API_RATELIMIT["app/api/rate-limit (Security Override)"]:::routeStyle
    end

    subgraph ADMIN_LIB["Package: src/lib (Admin Logic & Security)"]
        RBAC_LIB["lib/rbac.ts (System Admin Guard)"]:::libStyle
        AUTH_LIB["lib/auth.ts (Password Hashing & Sessions)"]:::libStyle
        TWOFACTOR_LIB["lib/two-factor.ts (TOTP Secret Management)"]:::libStyle
        RATELIMIT_LIB["lib/rate-limit.ts (Anti-Brute-Force Shield)"]:::libStyle
        AUDIT_LIB["lib/audit.ts (Immutable Audit Logger)"]:::libStyle
        PRISMA_LIB["lib/prisma.ts (Database ORM Client)"]:::libStyle
    end

    subgraph ADMIN_TYPES["Package: src/types (Domain Contracts)"]
        AUTH_TYPES["types/auth.ts (User & Role Models)"]:::typeStyle
        AUDIT_TYPES["types/audit.ts (Standardized Action Enums)"]:::typeStyle
        CMS_TYPES["types/cms.ts (Section Schema Definitions)"]:::typeStyle
    end

    %% Dependencies
    ADMIN_ROUTES --> ADMIN_LIB
    ADMIN_ROUTES --> ADMIN_TYPES
    ADMIN_LIB --> ADMIN_TYPES
    ADMIN_LIB --> PRISMA_LIB

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Route["subgraph: Routing Layer"]:::routeStyle
        L_Lib["subgraph: Services & Security"]:::libStyle
        L_Type["subgraph: Contract Types"]:::typeStyle
        L_Route --> L_Lib --> L_Type
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Package Concept | MinSU Implementation |
|---|---|---|---|
| `subgraph Pkg` | Folder Container | Architectural Namespace or Directory | `src/app`, `src/lib`, `src/types` |
| `[Module]` | Rectangle with border | Concrete file or sub-package | `users/page.tsx`, `two-factor.ts`, `rate-limit.ts` |
| `-->` | Directed Dependency | Import or invocation relationship | Admin routes depend on security guards and ORM clients |
| 🟢 Green Tone | `#F1F8F1` / `#1B5E20` | Administrative Presentation | Routes and UI views for administrator access |

---

## 4. Package Organization & Separation of Concerns

- **`src/app`**: Exposes administrative endpoints guarded by `SYSTEM_ADMIN` checks, including user management, audit forensics, CMS editing, and logo uploads.
- **`src/lib`**: Encapsulates core security mechanisms: bcrypt password hashing (10 salt rounds), TOTP two-factor management, IP-based rate limiting, and immutable audit dispatching.
- **`src/types`**: Declares TypeScript contracts for user profiles, standardized audit actions, and CMS section schemas.
