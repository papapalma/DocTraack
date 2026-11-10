# Staff Coordinator — Requirement Diagram (SysML)

> **Role:** `STAFF`  
> **Diagram Type:** Requirement Diagram (SysML)  
> **Focus:** Verification Engine, Registration Validation, Certificate Designer, and Transmittal Registry

---

## 1. Purpose

The Requirement Diagram maps Staff Coordinator functional and regulatory requirements to the software architecture components that satisfy them and the automated tests that verify them.

---

## 2. Mermaid Requirement Diagram

```mermaid
requirementDiagram

    requirement REQ_STF_01 {
        id: REQ-STF-01
        text: The system shall provide an intake validation queue with permanent RA 10173 identity locks.
        risk: High
        verifymethod: Test
    }

    requirement REQ_STF_02 {
        id: REQ-STF-02
        text: The system shall execute 3-way cross-matching between CHED, Registrar, and System datasets.
        risk: Critical
        verifymethod: Test
    }

    requirement REQ_STF_03 {
        id: REQ-STF-03
        text: The system shall provide a manual resolution workflow for student discrepancy records.
        risk: High
        verifymethod: Test
    }

    requirement REQ_STF_04 {
        id: REQ-STF-04
        text: The system shall provide a visual Certificate Designer with dynamic token citation formatting.
        risk: Medium
        verifymethod: Demonstration
    }

    requirement REQ_STF_05 {
        id: REQ-STF-05
        text: The system shall stream multi-tab ExcelJS workbooks for Annex 4 and Annex 5 statements.
        risk: High
        verifymethod: Test
    }

    requirement REQ_STF_06 {
        id: REQ-STF-06
        text: The system shall catalog all dispatched transmittals with courier tracking and Google Drive links.
        risk: Low
        verifymethod: Inspection
    }

    element StudentValidationQueue {
        type: block
    }

    element TripartiteVerificationEngine {
        type: block
    }

    element DiscrepancyResolver {
        type: block
    }

    element CertificateDesigner {
        type: block
    }

    element ExcelJSExporter {
        type: block
    }

    element OutgoingTransmittalRegistry {
        type: block
    }

    StudentValidationQueue - satisfies -> REQ_STF_01
    TripartiteVerificationEngine - satisfies -> REQ_STF_02
    DiscrepancyResolver - satisfies -> REQ_STF_03
    CertificateDesigner - satisfies -> REQ_STF_04
    ExcelJSExporter - satisfies -> REQ_STF_05
    OutgoingTransmittalRegistry - satisfies -> REQ_STF_06
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol / Syntax | SysML Concept | Technical Function | MinSU Domain Meaning |
|---|---|---|---|
| `requirement NAME` | Requirement Block | Declares functional or regulatory constraint | `REQ-STF-01` (Student Intake Validation) |
| `element NAME` | Architecture Element | Block or component satisfying requirement | `TripartiteVerificationEngine`, `CertificateDesigner` |
| `- satisfies ->` | Satisfy Relationship | Traceability link from component to requirement | Component satisfies explicit business specification |
| `verifymethod` | Verification Attribute | Method of verifying compliance | `Test` (`npm run test:all`), `Demonstration`, `Inspection` |

---

## 4. Requirements Traceability

- **`REQ-STF-01`**: Satisfied by `StudentValidationQueue` (`/registrations`), verified by `tests/student-data-integrity.test.ts`.
- **`REQ-STF-02`**: Satisfied by `TripartiteVerificationEngine` (`/verification`), verified by `tests/verification-matcher.test.ts`.
- **`REQ-STF-03`**: Satisfied by `DiscrepancyResolver`, ensuring manual coordinator review before Annex 4 generation.
- **`REQ-STF-04`**: Satisfied by `CertificateDesigner` (`/certificate-editor`), verifying multi-paper sizes and Word doc exports.
- **`REQ-STF-05`**: Satisfied by `ExcelJSExporter`, verified by 3-tab workbook stream assertion tests.
- **`REQ-STF-06`**: Satisfied by `OutgoingTransmittalRegistry`, logging courier records and shared Google Drive URLs.
