# Requirement Diagram (SysML): MinSU DocTrack Whole System

## 1. Description
This SysML Requirement Diagram establishes complete requirement traceability across the entire MinSU DocTrack application. It links core architectural requirements to implementing system blocks and verifying test cases.

## 2. ASD-STE100 Technical Specifications
- Assign a unique identifier to every requirement block (for example, `REQ-SYS-01`).
- Connect requirements to implementing software components using `<<satisfy>>` arrows.
- Connect requirements to verification test cases using `<<verify>>` arrows.
- Model requirement decomposition using `<<contain>>` hierarchy links.

---

## 3. SysML Requirement Diagram (Mermaid)

```mermaid
requirementDiagram

    requirement req_root {
        id: REQ-SYS-00
        text: MinSU DocTrack must provide secure, compliant, and auditable TDP Annex management.
        risk: high
        verifymethod: test
    }

    requirement req_rbac {
        id: REQ-SEC-01
        text: The system must enforce Role-Based Access Control for 5 distinct university roles.
        risk: high
        verifymethod: test
    }

    requirement req_audit {
        id: REQ-AUD-01
        text: All mutating state changes must write immutable audit logs with user identifiers.
        risk: medium
        verifymethod: inspection
    }

    requirement req_fin {
        id: REQ-FIN-01
        text: Financial Annexes (6-9) must enforce zero variance against government allocations.
        risk: high
        verifymethod: test
    }

    requirement req_track {
        id: REQ-APP-01
        text: Student applicants must receive a unique tracking code (TDP-YYYY-XXXX) on submission.
        risk: medium
        verifymethod: test
    }

    requirement req_sla {
        id: REQ-DIR-01
        text: The executive review queue must support 1-click approvals within a 48-hour SLA.
        risk: medium
        verifymethod: demonstration
    }

    requirement req_trn {
        id: REQ-OPS-01
        text: Transmittals must bind wet-signed scans and courier tracking metadata.
        risk: medium
        verifymethod: test
    }

    element block_rbac {
        type: block
    }

    element block_audit {
        type: block
    }

    element block_fin {
        type: block
    }

    element block_track {
        type: block
    }

    element block_director {
        type: block
    }

    element block_transmittal {
        type: block
    }

    element test_rbac {
        type: testCase
    }

    element test_fin {
        type: testCase
    }

    element test_audit {
        type: testCase
    }

    %% Hierarchy
    req_root - contains -> req_rbac
    req_root - contains -> req_audit
    req_root - contains -> req_fin
    req_root - contains -> req_track
    req_root - contains -> req_sla
    req_root - contains -> req_trn

    %% Satisfactions
    block_rbac - satisfies -> req_rbac
    block_audit - satisfies -> req_audit
    block_fin - satisfies -> req_fin
    block_track - satisfies -> req_track
    block_director - satisfies -> req_sla
    block_transmittal - satisfies -> req_trn

    %% Verifications
    test_rbac - verifies -> req_rbac
    test_fin - verifies -> req_fin
    test_audit - verifies -> req_audit

    %% ─── 📌 VISUAL LEGEND ───
    element legend_guide {
        type: "LEGEND: -contains-> Hierarchy | -satisfies-> Software Block | -verifies-> Test Suite"
    }
```

---

## 4. Diagram Legend & Symbol Guide

| Visual Symbol / Relationship | SysML Syntax | Engineering Purpose | MinSU Implementation Mapping |
|---|---|---|---|
| `requirement req_id` | Requirement Block | Formal system specification with risk level & verify method | `REQ-SEC-01`, `REQ-AUD-01`, `REQ-FIN-01`, `REQ-DIR-01` |
| `element name { type: block }` | Architecture Block | Implementation software module fulfilling the requirement | `src/lib/rbac.ts`, `src/lib/audit.ts`, `src/lib/validation.ts` |
| `element name { type: testCase }` | Test Case Block | Automated test suite ensuring requirement compliance | Unit & E2E role tests, zero-variance math test suite |
| `- contains ->` | Hierarchy Containment | Decomposes high-level goal into specific domain requirements | `req_root` decomposes into security, audit, finance, and SLA |
| `- satisfies ->` | Satisfaction Link | Proves a software block implements the requirement | `block_rbac satisfies req_rbac`, `block_fin satisfies req_fin` |
| `- verifies ->` | Verification Link | Proves a test suite validates the requirement | `test_rbac verifies req_rbac`, `test_fin verifies req_fin` |

---

## 5. Traceability Matrix

| Requirement ID | Requirement Name | Description | Implementing Module | Verification Method |
|---|---|---|---|---|
| **`REQ-SEC-01`** | RBAC Enforcement | Enforce permissions for ADMIN, DIRECTOR, STAFF, ACCOUNTING, STUDENT. | `src/lib/rbac.ts` | Unit & E2E Role Matrix Tests |
| **`REQ-AUD-01`** | Immutable Audit Trail | Log every create, edit, approve, return, and dispatch action. | `src/lib/audit.ts` | Database Audit Query Inspection |
| **`REQ-FIN-01`** | Zero Variance Rule | Prevent submission of financial annexes with non-zero discrepancy. | `src/lib/validation.ts` | Math Engine Integration Tests |
| **`REQ-APP-01`** | Tracking Code Issuance | Issue regex-compliant codes (`TDP-YYYY-XXXX`) and printable receipt slips. | `src/lib/tracking.ts` | Intake Automated Form Tests |
| **`REQ-DIR-01`** | 48-Hour Executive SLA | Accelerate executive endorsements with 1-click digital signatures. | `src/app/(dashboard)/queue` | Turnaround Timer Monitoring |
| **`REQ-OPS-01`** | Transmittal Dispatch | Package annexes, bind courier barcodes, and upload wet-signed PDFs. | `src/app/(dashboard)/transmittals` | Document Upload & Storage Verification |
