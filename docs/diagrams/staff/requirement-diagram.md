# Staff Coordinator — Requirement Diagram (SysML)

> **Role:** `STAFF`  
> **Diagram Type:** Requirement Diagram (SysML)  
> **Focus:** Annex Preparation, Call Configuration, and Transmittal Registry

---

## 1. Purpose

The Requirement Diagram maps Staff operational requirements to architecture components that satisfy them and test cases that verify them.

---

## 2. Mermaid Requirement Diagram

```mermaid
requirementDiagram

    requirement REQ_STF_01 {
        id: REQ-STF-01
        text: The system must allow Staff to create and modify Annexes 1 through 10.
        risk: High
        verifymethod: Test
    }

    requirement REQ_STF_02 {
        id: REQ-STF-02
        text: The system must validate and store wet-signed PDF scans up to 15 megabytes.
        risk: Medium
        verifymethod: Test
    }

    requirement REQ_STF_03 {
        id: REQ-STF-03
        text: The system must provide a form builder for creating dynamic applicant call schemas.
        risk: High
        verifymethod: Demonstration
    }

    requirement REQ_STF_04 {
        id: REQ-STF-04
        text: The system must catalog all dispatched external packages in the Outgoing Registry.
        risk: Low
        verifymethod: Test
    }

    element AnnexFormEngine {
        type: block
    }

    element ScanUploadValidator {
        type: block
    }

    element DynamicCallBuilder {
        type: block
    }

    element OutgoingRegistryManager {
        type: block
    }

    element TestAnnexFormValidation {
        type: testCase
    }

    element TestPdfUploadLimit {
        type: testCase
    }

    element TestDynamicFormBuilder {
        type: testCase
    }

    element TestTransmittalCataloging {
        type: testCase
    }

    %% Satisfy Relations
    AnnexFormEngine - satisfies -> REQ_STF_01
    ScanUploadValidator - satisfies -> REQ_STF_02
    DynamicCallBuilder - satisfies -> REQ_STF_03
    OutgoingRegistryManager - satisfies -> REQ_STF_04

    %% Verify Relations
    TestAnnexFormValidation - verifies -> REQ_STF_01
    TestPdfUploadLimit - verifies -> REQ_STF_02
    TestDynamicFormBuilder - verifies -> REQ_STF_03
    TestTransmittalCataloging - verifies -> REQ_STF_04

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
| `REQ-STF-01` | Create and edit Annexes 1 to 10. | `src/components/documents` (`AnnexFormEngine`) | `TestAnnexFormValidation` |
| `REQ-STF-02` | Validate and store scanned signed PDFs. | `src/app/api/documents/[id]/upload` | `TestPdfUploadLimit` |
| `REQ-STF-03` | Configure dynamic TDP application schemas. | `src/app/(dashboard)/calls` (`DynamicCallBuilder`) | `TestDynamicFormBuilder` |
| `REQ-STF-04` | Catalog dispatched transmittals. | `src/app/(dashboard)/outgoing` | `TestTransmittalCataloging` |
