# System Admin — Requirement Diagram (SysML)

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Requirement Diagram (SysML)  
> **Focus:** Security, Role Provisioning, 2FA, Rate Limiting, and CMS Governance

---

## 1. Purpose

The Requirement Diagram maps administrative security and governance requirements to the system architecture blocks that satisfy them and the automated tests that verify them.

---

## 2. Mermaid Requirement Diagram

```mermaid
requirementDiagram

    requirement REQ_ADM_01 {
        id: REQ-ADM-01
        text: The system shall enforce strict Role-Based Access Control at edge middleware boundaries.
        risk: Critical
        verifymethod: Test
    }

    requirement REQ_ADM_02 {
        id: REQ-ADM-02
        text: All mutating operations across all roles shall write an immutable append-only audit log entry.
        risk: High
        verifymethod: Test
    }

    requirement REQ_ADM_03 {
        id: REQ-ADM-03
        text: The system shall support Microsoft Authenticator 2FA with administrative secret reset capabilities.
        risk: Critical
        verifymethod: Test
    }

    requirement REQ_ADM_04 {
        id: REQ-ADM-04
        text: The system shall provide a split-screen Landing Page CMS with live preview and draft staging.
        risk: Medium
        verifymethod: Demonstration
    }

    requirement REQ_ADM_05 {
        id: REQ-ADM-05
        text: The system shall enforce anti-brute-force rate limiting with global administrative override controls.
        risk: High
        verifymethod: Test
    }

    requirement REQ_ADM_06 {
        id: REQ-ADM-06
        text: The system shall sanitize uploaded logos and enforce CSP script-blocking headers on served SVGs.
        risk: High
        verifymethod: Test
    }

    element RBACGuard {
        type: block
    }

    element AuditForensicsService {
        type: block
    }

    element TwoFactorAdminModule {
        type: block
    }

    element LandingConfigEditor {
        type: block
    }

    element RateLimiterModule {
        type: block
    }

    element MediaSanitizerModule {
        type: block
    }

    RBACGuard - satisfies -> REQ_ADM_01
    AuditForensicsService - satisfies -> REQ_ADM_02
    TwoFactorAdminModule - satisfies -> REQ_ADM_03
    LandingConfigEditor - satisfies -> REQ_ADM_04
    RateLimiterModule - satisfies -> REQ_ADM_05
    MediaSanitizerModule - satisfies -> REQ_ADM_06
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol / Syntax | SysML Concept | Technical Function | MinSU Domain Meaning |
|---|---|---|---|
| `requirement NAME` | Requirement Block | Declares functional or regulatory constraint | `REQ-ADM-01` (RBAC Edge Guard), `REQ-ADM-03` (2FA Module) |
| `element NAME` | Architecture Element | Block or component satisfying requirement | `RBACGuard`, `RateLimiterModule`, `MediaSanitizerModule` |
| `- satisfies ->` | Satisfy Relationship | Traceability link from component to requirement | Component satisfies explicit business specification |
| `verifymethod` | Verification Attribute | Method of verifying compliance | `Test` (`npm run test:all`), `Demonstration` |

---

## 4. Requirements Traceability

- **`REQ-ADM-01`**: Satisfied by `RBACGuard` in `src/middleware.ts`, tested across all role boundary redirection scenarios.
- **`REQ-ADM-02`**: Satisfied by `AuditForensicsService` (`src/lib/audit.ts`), verifying append-only PostgreSQL storage.
- **`REQ-ADM-03`**: Satisfied by `TwoFactorAdminModule` (`/api/users/[id]`), permitting TOTP secret reset upon administrator validation.
- **`REQ-ADM-04`**: Satisfied by `LandingConfigEditor` (`/landing-editor`), providing synchronized split-screen editing.
- **`REQ-ADM-05`**: Satisfied by `RateLimiterModule` (`src/lib/rate-limit.ts`), responding with HTTP 429 when thresholds are exceeded.
- **`REQ-ADM-06`**: Satisfied by `MediaSanitizerModule` (`/api/branding/logo/upload`), verifying `path.basename` sanitization and CSP headers.
