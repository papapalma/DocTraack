# Student Applicant — Profile Diagram

> **Role:** `STUDENT`  
> **Diagram Type:** Profile Diagram  
> **Scope:** Stereotypes, Tagged Values & Constraints for Student Intake Subsystem  
> **Standard:** UML 2.5 Profile Specification

---

## 1. Purpose

The Profile Diagram defines custom UML stereotypes, tagged values, and semantic constraints applied to student scholarship intake, proof document uploads, Microsoft Authenticator 2FA, and RA 10173 identity protection within MinSU DocTrack.

---

## 2. Mermaid Profile Diagram

```mermaid
classDiagram
    direction TB

    class Metaclass_Class {
        <<metaclass>>
        Class
    }

    class Metaclass_Property {
        <<metaclass>>
        Property
    }

    class ApplicantSubmission {
        <<stereotype>>
        +deadlineEnforced: Boolean = true
        +generateReceiptPdf: Boolean = true
        +requireActiveCall: Boolean = true
        +maxSubmissionsPerIpPerHour: Int = 10
    }

    class LockedStudentIdentity {
        <<stereotype>>
        +ra10173Compliance: Boolean = true
        +lockOnAccepted: Boolean = true
        +lockedFields: String = "studentIdNumber,fullName"
        +mutableFields: String = "gwa,contactNumber,address"
    }

    class TwoFactorSecured {
        <<stereotype>>
        +authenticatorType: String = "MICROSOFT_AUTHENTICATOR"
        +algorithm: String = "TOTP_SHA1"
        +tokenWindowSeconds: Int = 30
        +mandatoryForGrantee: Boolean = true
    }

    class DocumentProof {
        <<stereotype>>
        +maxSizeBytes: Int = 5242880
        +allowedFormats: String = "PDF,PNG,JPG"
        +isRequired: Boolean = true
        +sanitizePath: Boolean = true
    }

    class TrackingLookup {
        <<stereotype>>
        +formatRegex: String = "^TDP-[0-9]{4}-[0-9]{4}$"
        +rateLimitPerMinute: Int = 20
        +publicAccess: Boolean = true
        +hideSensitiveRemarks: Boolean = true
    }

    Metaclass_Class <|-- ApplicantSubmission : extends
    Metaclass_Class <|-- LockedStudentIdentity : extends
    Metaclass_Class <|-- TwoFactorSecured : extends
    Metaclass_Property <|-- DocumentProof : extends
    Metaclass_Class <|-- TrackingLookup : extends

    %% ─── 📌 VISUAL LEGEND ───
    subgraph LEGEND ["📌 Diagram Legend"]
        direction TB
        L_Meta["<<metaclass>><br/>UML Foundation"]:::metaStyle
        L_Stereo["<<stereotype>><br/>Domain Extension<br/>+taggedValue: Type"]:::stereoStyle
        L_Stereo -- "<<extension>>" --> L_Meta
    end
    classDef metaStyle fill:#F6F8F6,stroke:#55645B,stroke-width:1.5px,color:#1F2A24;
    classDef stereoStyle fill:#DCEFDD,stroke:#1B5E20,stroke-width:2px,color:#123F17;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Profile Mechanism | MinSU Governance Application |
|---|---|---|---|
| `<<metaclass>>` Box | `fill:#F6F8F6, stroke:#55645B` | Core UML base meta-element | Standard UML `Class` or `Property` |
| `<<stereotype>>` Box | `fill:#DCEFDD, stroke:#1B5E20` | Domain-specific extension | `<<ApplicantSubmission>>`, `<<LockedStudentIdentity>>`, `<<TwoFactorSecured>>` |
| `+taggedValue: Type` | Tagged Value Attribute | Metadata property attached to stereotype | `ra10173Compliance`, `maxSizeBytes`, `rateLimitPerMinute`, `tokenWindowSeconds` |
| `<|-- extends` | Extension Relationship | Extends metaclass semantics | Connects custom TDP stereotype to standard UML metaclass |

---

## 4. Stereotype Definitions & Tagged Values

| Stereotype | Extends Metaclass | Tagged Values | Governance & Security Purpose |
|---|---|---|---|
| `<<ApplicantSubmission>>` | `Class` | `deadlineEnforced: Boolean`<br/>`generateReceiptPdf: Boolean`<br/>`maxSubmissionsPerIpPerHour: Int = 10` | Enforces active deadline intake and triggers rate-limited public form processing. |
| `<<LockedStudentIdentity>>` | `Class` | `ra10173Compliance: Boolean = true`<br/>`lockOnAccepted: Boolean = true`<br/>`lockedFields: "studentIdNumber,fullName"` | Permanently locks core identity fields upon acceptance while permitting GWA and contact updates. |
| `<<TwoFactorSecured>>` | `Class` | `authenticatorType: "MICROSOFT_AUTHENTICATOR"`<br/>`tokenWindowSeconds: 30`<br/>`mandatoryForGrantee: Boolean` | Secures student sessions and grantee disbursements with standard RFC 6238 TOTP codes. |
| `<<DocumentProof>>` | `Property` | `maxSizeBytes: 5242880`<br/>`allowedFormats: "PDF,PNG,JPG"`<br/>`sanitizePath: Boolean = true` | Validates file uploads and guards against path traversal vulnerabilities. |
| `<<TrackingLookup>>` | `Class` | `formatRegex: "^TDP-[0-9]{4}-[0-9]{4}$"`<br/>`rateLimitPerMinute: 20`<br/>`hideSensitiveRemarks: Boolean = true` | Prevents automated enumeration while protecting internal evaluation remarks. |
