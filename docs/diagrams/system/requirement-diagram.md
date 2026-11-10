# Requirement Diagram (SysML): MinSU DocTrack Whole System

## 1. Description
This SysML Requirement Diagram establishes complete requirement traceability across the entire MinSU DocTrack application. It links core architectural requirements to implementing system blocks and verifying test cases, incorporating 2FA, 3-way verification, Excel/Word generation, and RA 10173 data privacy rules.

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

    requirement req_2fa {
        id: REQ-SEC-02
        text: The platform must support Microsoft Authenticator TOTP 2FA and backup recovery codes.
        risk: medium
        verifymethod: test
    }

    requirement req_audit {
        id: REQ-AUD-01
        text: All mutating state changes must write immutable audit logs with user identifiers.
        risk: medium
        verifymethod: inspection
    }

    requirement req_verify {
        id: REQ-VERIFY-01
        text: The system must cross-match CHED CSV, Registrar CSV, and System datasets using fuzzy algorithms.
        risk: high
        verifymethod: test
    }

    requirement req_privacy {
        id: REQ-PRIV-01
        text: Under RA 10173, student ID and full legal name must permanently lock upon acceptance.
        risk: high
        verifymethod: test
    }

    requirement req_excel {
        id: REQ-EXP-01
        text: Annexes 1, 3-9 must export native multi-tab Excel workbooks matching government templates.
        risk: medium
        verifymethod: test
    }

    element elem_middleware {
        type: component
    }

    element elem_auth2fa {
        type: component
    }

    element elem_verifyengine {
        type: component
    }

    element elem_excelexporter {
        type: component
    }

    element elem_auditlog {
        type: component
    }

    req_root - contains -> req_rbac
    req_root - contains -> req_2fa
    req_root - contains -> req_audit
    req_root - contains -> req_verify
    req_root - contains -> req_privacy
    req_root - contains -> req_excel

    elem_middleware - satisfies -> req_rbac
    elem_auth2fa - satisfies -> req_2fa
    elem_auditlog - satisfies -> req_audit
    elem_verifyengine - satisfies -> req_verify
    elem_excelexporter - satisfies -> req_excel
```

---

## 4. Diagram Legend & Symbol Guide

| Visual Symbol | SysML Concept | MinSU System Implementation |
|---|---|---|
| `requirement` | Functional or Statutory Constraint | `REQ-SEC-01` (RBAC), `REQ-VERIFY-01` (3-Way Match), `REQ-PRIV-01` (RA 10173) |
| `element` | Architectural Subsystem Unit | Edge Middleware, 2FA Controller, Verification Engine, ExcelJS Exporter |
| `- contains ->` | Requirement Decomposition | Master root requirement breaks down into security, audit, and verification rules |
| `- satisfies ->` | Implementation Realization | Software component fulfills the formal statutory requirement |
