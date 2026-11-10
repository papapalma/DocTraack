# Campus Director — Requirement Diagram (SysML)

> **Role:** `DIRECTOR`  
> **Diagram Type:** Requirement Diagram (SysML)  
> **Focus:** Signatory Authority, Review Turnaround, 2FA Security, and Verification Oversight

---

## 1. Purpose

The Requirement Diagram maps Campus Director regulatory governance, signatory authority, and review performance requirements to the system architecture blocks that satisfy them.

---

## 2. Mermaid Requirement Diagram

```mermaid
requirementDiagram

    requirement REQ_DIR_01 {
        id: REQ-DIR-01
        text: The system shall restrict document approval authority strictly to authenticated CAMPUS_DIRECTOR sessions.
        risk: Critical
        verifymethod: Test
    }

    requirement REQ_DIR_02 {
        id: REQ-DIR-02
        text: The system shall require mandatory revision feedback before a document can be marked RETURNED.
        risk: Medium
        verifymethod: Demonstration
    }

    requirement REQ_DIR_03 {
        id: REQ-DIR-03
        text: The system shall compute approval velocity and track compliance against a 48-hour SLA.
        risk: Medium
        verifymethod: Test
    }

    requirement REQ_DIR_04 {
        id: REQ-DIR-04
        text: The system shall present tripartite verification summary statistics before Annex 4 endorsement.
        risk: High
        verifymethod: Test
    }

    requirement REQ_DIR_05 {
        id: REQ-DIR-05
        text: The system shall require Microsoft Authenticator 2FA TOTP verification for director sign-in.
        risk: Critical
        verifymethod: Test
    }

    requirement REQ_DIR_06 {
        id: REQ-DIR-06
        text: The system shall broadcast in-app alerts and write immutable audit records for all executive actions.
        risk: Low
        verifymethod: Test
    }

    element SignatoryPolicyGuard {
        type: block
    }

    element ReturnWorkflowEngine {
        type: block
    }

    element VelocityAnalyticsEngine {
        type: block
    }

    element VerificationOversightModule {
        type: block
    }

    element TwoFactorAuthenticatorModule {
        type: block
    }

    element NotificationAuditDispatcher {
        type: block
    }

    SignatoryPolicyGuard - satisfies -> REQ_DIR_01
    ReturnWorkflowEngine - satisfies -> REQ_DIR_02
    VelocityAnalyticsEngine - satisfies -> REQ_DIR_03
    VerificationOversightModule - satisfies -> REQ_DIR_04
    TwoFactorAuthenticatorModule - satisfies -> REQ_DIR_05
    NotificationAuditDispatcher - satisfies -> REQ_DIR_06
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol / Syntax | SysML Concept | Technical Function | MinSU Domain Meaning |
|---|---|---|---|
| `requirement NAME` | Requirement Block | Declares functional or regulatory constraint | `REQ-DIR-01` (Executive Signatory Authority) |
| `element NAME` | Architecture Element | Block or component satisfying requirement | `SignatoryPolicyGuard`, `VelocityAnalyticsEngine` |
| `- satisfies ->` | Satisfy Relationship | Traceability link from component to requirement | Component satisfies explicit business specification |
| `verifymethod` | Verification Attribute | Method of verifying compliance | `Test` (`npm run test:all`), `Demonstration` |

---

## 4. Requirements Traceability

- **`REQ-DIR-01`**: Satisfied by `SignatoryPolicyGuard` in `src/lib/rbac.ts`, blocking unauthorized approval attempts.
- **`REQ-DIR-02`**: Satisfied by `ReturnWorkflowEngine`, ensuring comments are inserted atomically with `RETURNED` status.
- **`REQ-DIR-03`**: Satisfied by `VelocityAnalyticsEngine` (`/api/analytics`), measuring duration from submission to endorsement.
- **`REQ-DIR-04`**: Satisfied by `VerificationOversightModule`, preventing approval if unverified grantees exist.
- **`REQ-DIR-05`**: Satisfied by `TwoFactorAuthenticatorModule`, enforcing RFC 6238 TOTP tokens.
- **`REQ-DIR-06`**: Satisfied by `NotificationAuditDispatcher`, dispatching alerts and writing append-only logs.
