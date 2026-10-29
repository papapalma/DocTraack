# Student Applicant — Requirement Diagram (SysML)

> **Role:** `STUDENT`  
> **Diagram Type:** Requirement Diagram (SysML)  
> **Focus:** Student Portal Usability, Verification Codes, and Privacy Compliance

---

## 1. Purpose

The Requirement Diagram maps student-facing requirements to the architecture components that satisfy them and the test cases that verify them.

---

## 2. Mermaid Requirement Diagram

```mermaid
requirementDiagram

    requirement REQ_STU_01 {
        id: REQ-STU-01
        text: Students must be able to register accounts using their university email.
        risk: Medium
        verifymethod: Test
    }

    requirement REQ_STU_02 {
        id: REQ-STU-02
        text: Each application must generate a unique tracking code for status inquiry without login.
        risk: High
        verifymethod: Test
    }

    requirement REQ_STU_03 {
        id: REQ-STU-03
        text: The portal must validate uploaded COR and grade files (PDF/PNG/JPG up to 5MB).
        risk: Medium
        verifymethod: Test
    }

    requirement REQ_STU_04 {
        id: REQ-STU-04
        text: The system must provide a downloadable PDF receipt slip upon successful submission.
        risk: Low
        verifymethod: Demonstration
    }

    element StudentRegistrationService {
        type: block
    }

    element TrackingCodeLookupEngine {
        type: block
    }

    element DocumentProofValidator {
        type: block
    }

    element ReceiptSlipCompiler {
        type: block
    }

    element TestStudentRegistration {
        type: testCase
    }

    element TestTrackingCodeUniqueness {
        type: testCase
    }

    element TestProofFileUploads {
        type: testCase
    }

    element TestReceiptSlipRendering {
        type: testCase
    }

    %% Satisfy Relations
    StudentRegistrationService - satisfies -> REQ_STU_01
    TrackingCodeLookupEngine - satisfies -> REQ_STU_02
    DocumentProofValidator - satisfies -> REQ_STU_03
    ReceiptSlipCompiler - satisfies -> REQ_STU_04

    %% Verify Relations
    TestStudentRegistration - verifies -> REQ_STU_01
    TestTrackingCodeUniqueness - verifies -> REQ_STU_02
    TestProofFileUploads - verifies -> REQ_STU_03
    TestReceiptSlipRendering - verifies -> REQ_STU_04

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
| `REQ-STU-01` | Student registration with university credentials. | `src/app/(auth)/register` | `TestStudentRegistration` |
| `REQ-STU-02` | Unique tracking code generation & lookup. | `src/app/portal` (`TrackingCodeLookupEngine`) | `TestTrackingCodeUniqueness` |
| `REQ-STU-03` | File validation for COR and grades (`<= 5MB`). | `src/lib/validation.ts` | `TestProofFileUploads` |
| `REQ-STU-04` | Downloadable PDF submission receipt slip. | `src/lib/pdf.ts` (`ReceiptSlipCompiler`) | `TestReceiptSlipRendering` |
