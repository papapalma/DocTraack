# Student Applicant — Requirement Diagram (SysML)

> **Role:** `STUDENT`  
> **Diagram Type:** Requirement Diagram (SysML)  
> **Focus:** Student Portal Usability, 2FA, Verification Codes & RA 10173 Privacy Compliance  
> **Standard:** SysML 1.6 Requirement Specification

---

## 1. Purpose

The Requirement Diagram maps student-facing functional and security requirements to the architecture components that satisfy them and the automated test cases that verify them.

---

## 2. Mermaid Requirement Diagram

```mermaid
requirementDiagram

    requirement REQ_STU_01 {
        id: REQ-STU-01
        text: Students must register accounts using university email and configure Microsoft Authenticator 2FA.
        risk: High
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
        text: The portal must validate uploaded COR and grade files up to 5MB with MIME checking.
        risk: Medium
        verifymethod: Test
    }

    requirement REQ_STU_04 {
        id: REQ-STU-04
        text: The system must provide a downloadable official receipt slip upon submission.
        risk: Low
        verifymethod: Demonstration
    }

    requirement REQ_STU_05 {
        id: REQ-STU-05
        text: Accepted student identity fields must be locked against unauthorized editing under RA 10173.
        risk: High
        verifymethod: Test
    }

    requirement REQ_STU_06 {
        id: REQ-STU-06
        text: Students must view active campus announcements filtered by audience tier and priority.
        risk: Medium
        verifymethod: Test
    }

    element TwoFactorAuthEngine {
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

    element ProfileLockController {
        type: block
    }

    element AnnouncementFeedService {
        type: block
    }

    element TestTwoFactorFlow {
        type: testCase
    }

    element TestTrackingCodeUniqueness {
        type: testCase
    }

    element TestDocumentUploadValidation {
        type: testCase
    }

    element TestReceiptSlipRendering {
        type: testCase
    }

    element TestStudentDataIntegrity {
        type: testCase
    }

    element TestAnnouncementAudienceFilter {
        type: testCase
    }

    TwoFactorAuthEngine - satisfies -> REQ_STU_01
    TrackingCodeLookupEngine - satisfies -> REQ_STU_02
    DocumentProofValidator - satisfies -> REQ_STU_03
    ReceiptSlipCompiler - satisfies -> REQ_STU_04
    ProfileLockController - satisfies -> REQ_STU_05
    AnnouncementFeedService - satisfies -> REQ_STU_06

    TestTwoFactorFlow - verifies -> REQ_STU_01
    TestTrackingCodeUniqueness - verifies -> REQ_STU_02
    TestDocumentUploadValidation - verifies -> REQ_STU_03
    TestReceiptSlipRendering - verifies -> REQ_STU_04
    TestStudentDataIntegrity - verifies -> REQ_STU_05
    TestAnnouncementAudienceFilter - verifies -> REQ_STU_06
```

---

## 3. Diagram Legend & Symbol Guide

| SysML Element | Syntax / Type | Role & Specification | MinSU Implementation Mapping |
|---|---|---|---|
| `requirement` | Box with ID, Text, Risk | Functional or security specification | Portal 2FA, tracking uniqueness, RA 10173 lock, proof verification |
| `element (block)` | Architecture Block | System module fulfilling requirement | `TwoFactorAuthEngine`, `TrackingCodeLookupEngine`, `ProfileLockController` |
| `element (testCase)` | Verification Test Case | Automated test checking requirement | `tests/student-data-integrity.test.ts`, `tests/verification-matcher.test.ts` |
| `- satisfies ->` | Dependency Arrow | Component implements requirement contract | Links Next.js controllers to system requirements |
| `- verifies ->` | Dependency Arrow | Test suite validates requirement execution | Links Jest/Vitest automated assertions to requirements |

---

## 4. Requirements Traceability Matrix

| Requirement ID | Requirement Statement | Fulfilling Component | Verification Test Case | Status |
|---|---|---|---|---|
| `REQ-STU-01` | Students must register accounts with university email and Microsoft Authenticator 2FA. | `TwoFactorAuthEngine` (`src/lib/two-factor.ts`) | `TestTwoFactorFlow` | Verified |
| `REQ-STU-02` | Applications generate unique tracking codes (`TDP-YYYY-XXXX`) for public inquiry. | `TrackingCodeLookupEngine` (`src/lib/tracking.ts`) | `TestTrackingCodeUniqueness` | Verified |
| `REQ-STU-03` | Uploaded proof files must be validated for MIME type and 5MB size limit. | `DocumentProofValidator` (`src/lib/validation.ts`) | `TestDocumentUploadValidation` | Verified |
| `REQ-STU-04` | Downloadable official receipt slip generated upon submission. | `ReceiptSlipCompiler` (`src/components/portal/ReceiptSlip.tsx`) | `TestReceiptSlipRendering` | Verified |
| `REQ-STU-05` | Student identity fields locked permanently upon acceptance under RA 10173. | `ProfileLockController` (`src/app/api/registrations/route.ts`) | `TestStudentDataIntegrity` | Verified |
| `REQ-STU-06` | Pinned and targeted campus announcements feed for students. | `AnnouncementFeedService` (`src/app/portal/page.tsx`) | `TestAnnouncementAudienceFilter` | Verified |
