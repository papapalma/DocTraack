# Campus Director — Requirement Diagram (SysML)

> **Role:** `DIRECTOR`  
> **Diagram Type:** Requirement Diagram (SysML)  
> **Focus:** Signatory Authority, Review Turnaround, and Decision Tracking

---

## 1. Purpose

The Requirement Diagram connects Campus Director compliance requirements to the software blocks that implement them and the test cases that verify them.

---

## 2. Mermaid Requirement Diagram

```mermaid
requirementDiagram

    requirement REQ_DIR_01 {
        id: REQ-DIR-01
        text: Only users with the DIRECTOR role shall have the authority to endorse submitted documents.
        risk: High
        verifymethod: Test
    }

    requirement REQ_DIR_02 {
        id: REQ-DIR-02
        text: The system must allow the Director to return documents with revision comments.
        risk: Medium
        verifymethod: Demonstration
    }

    requirement REQ_DIR_03 {
        id: REQ-DIR-03
        text: The system shall calculate review turnaround velocity and status distributions in real time.
        risk: Medium
        verifymethod: Analysis
    }

    requirement REQ_DIR_04 {
        id: REQ-DIR-04
        text: The system must notify preparers immediately upon approval or return of an Annex.
        risk: Low
        verifymethod: Test
    }

    element SignatoryPolicyGuard {
        type: block
    }

    element ReturnWorkflowEngine {
        type: block
    }

    element AnalyticsEngine {
        type: block
    }

    element NotificationService {
        type: block
    }

    element TestSignatoryRoleValidation {
        type: testCase
    }

    element TestReturnCommentAttachment {
        type: testCase
    }

    element TestVelocityCalculation {
        type: testCase
    }

    element TestNotificationDelivery {
        type: testCase
    }

    %% Satisfy Relations
    SignatoryPolicyGuard - satisfies -> REQ_DIR_01
    ReturnWorkflowEngine - satisfies -> REQ_DIR_02
    AnalyticsEngine - satisfies -> REQ_DIR_03
    NotificationService - satisfies -> REQ_DIR_04

    %% Verify Relations
    TestSignatoryRoleValidation - verifies -> REQ_DIR_01
    TestReturnCommentAttachment - verifies -> REQ_DIR_02
    TestVelocityCalculation - verifies -> REQ_DIR_03
    TestNotificationDelivery - verifies -> REQ_DIR_04

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

| Requirement ID | Description | Satisfying Element | Verification Test Case |
|---|---|---|---|
| `REQ-DIR-01` | Only `DIRECTOR` users can endorse documents. | `src/lib/rbac.ts` (`SignatoryPolicyGuard`) | `TestSignatoryRoleValidation` |
| `REQ-DIR-02` | Return defective documents with comments. | `src/app/api/documents/[id]/return` | `TestReturnCommentAttachment` |
| `REQ-DIR-03` | Real-time turnaround velocity metrics. | `src/app/(dashboard)/analytics` | `TestVelocityCalculation` |
| `REQ-DIR-04` | Send immediate in-app notifications on status changes. | `src/lib/notifications.ts` | `TestNotificationDelivery` |
