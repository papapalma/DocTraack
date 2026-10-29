# System Admin — Requirement Diagram (SysML)

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Requirement Diagram (SysML)  
> **Focus:** Security, Role Provisioning, and Governance Requirements

---

## 1. Purpose

The Requirement Diagram maps administrative requirements to the architecture components that satisfy them and the test cases that verify them.

---

## 2. Mermaid Requirement Diagram

```mermaid
requirementDiagram

    requirement REQ_ADM_01 {
        id: REQ-ADM-01
        text: The system must enforce strict Role-Based Access Control (RBAC) at edge middleware.
        risk: High
        verifymethod: Test
    }

    requirement REQ_ADM_02 {
        id: REQ-ADM-02
        text: Every mutating administrative action must produce an immutable audit log entry.
        risk: Medium
        verifymethod: Test
    }

    requirement REQ_ADM_03 {
        id: REQ-ADM-03
        text: User passwords must be hashed using bcrypt with minimum 10 salt rounds before storage.
        risk: High
        verifymethod: Inspection
    }

    requirement REQ_ADM_04 {
        id: REQ-ADM-04
        text: Landing page CMS updates must support draft staging before live publication.
        risk: Low
        verifymethod: Demonstration
    }

    element RBACGuard {
        type: block
    }

    element AuditService {
        type: block
    }

    element AuthCrypto {
        type: block
    }

    element LandingConfigEditor {
        type: block
    }

    element TestRBACRejection {
        type: testCase
    }

    element TestAuditImmutability {
        type: testCase
    }

    element TestPasswordHashing {
        type: testCase
    }

    element TestDraftPublishWorkflow {
        type: testCase
    }

    %% Satisfy Relations
    RBACGuard - satisfies -> REQ_ADM_01
    AuditService - satisfies -> REQ_ADM_02
    AuthCrypto - satisfies -> REQ_ADM_03
    LandingConfigEditor - satisfies -> REQ_ADM_04

    %% Verify Relations
    TestRBACRejection - verifies -> REQ_ADM_01
    TestAuditImmutability - verifies -> REQ_ADM_02
    TestPasswordHashing - verifies -> REQ_ADM_03
    TestDraftPublishWorkflow - verifies -> REQ_ADM_04

    %% ─── 📌 VISUAL LEGEND ───
    element legend_guide {
        type: "LEGEND: -contains-> Hierarchy | -satisfies-> Software Block | -verifies-> Test Suite"
    }
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol / Relationship | SysML Syntax | Engineering Purpose | MinSU Implementation Mapping |
|---|---|---|---|
| `requirement req_id` | Requirement Block | Formal system specification with risk level & verify method | `REQ-SEC-01`, `REQ-AUD-01`, `REQ-FIN-01`, `REQ-DIR-01` |
| `element name { type: block }` | Architecture Block | Implementation software module fulfilling the requirement | `src/lib/rbac.ts`, `src/lib/audit.ts`, `src/lib/validation.ts` |
| `element name { type: testCase }` | Test Case Block | Automated test suite ensuring requirement compliance | Unit & E2E role tests, zero-variance math test suite |
| `- contains ->` | Hierarchy Containment | Decomposes high-level goal into specific domain requirements | Root requirement decomposes into security, audit, finance, and SLA |
| `- satisfies ->` | Satisfaction Link | Proves a software block implements the requirement | Architectural blocks satisfying regulatory and functional constraints |
| `- verifies ->` | Verification Link | Proves a test suite validates the requirement | Automated test suites ensuring requirement verification |


---

## 4. Requirements Traceability Matrix

| Requirement ID | Statement | Satisfying Element | Verification Test Case |
|---|---|---|---|
| `REQ-ADM-01` | Edge middleware enforces role boundaries. | `src/middleware.ts` (`RBACGuard`) | `TestRBACRejection` |
| `REQ-ADM-02` | Every mutation produces an immutable log. | `src/lib/audit.ts` (`AuditService`) | `TestAuditImmutability` |
| `REQ-ADM-03` | Passwords hashed with bcrypt (>= 10 rounds). | `src/lib/auth.ts` (`AuthCrypto`) | `TestPasswordHashing` |
| `REQ-ADM-04` | CMS supports draft staging before publish. | `src/app/(dashboard)/landing-editor` | `TestDraftPublishWorkflow` |
