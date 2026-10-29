# Profile Diagram: Student Applicant Domain

## 1. Description
This UML profile diagram defines stereotypes, tagged values, and constraints customized for student scholarship applications, proof document uploads, and tracking code lookups in MinSU DocTrack.

## 2. ASD-STE100 Technical Specifications
- Extend standard UML meta-classes with domain stereotypes.
- Apply constraints to enforce file upload limits and tracking formats.
- Define metadata tags for application deadlines and verification statuses.

## 3. Profile Diagram (Mermaid)

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
    }

    class DocumentProof {
        <<stereotype>>
        +maxSizeBytes: Int = 5242880
        +allowedFormats: String = "PDF,PNG,JPG"
        +isRequired: Boolean = true
    }

    class TrackingLookup {
        <<stereotype>>
        +formatRegex: String = "^TDP-[0-9]{4}-[0-9]{4}$"
        +rateLimitPerMinute: Int = 20
        +publicAccess: Boolean = true
    }

    Metaclass_Class <|-- ApplicantSubmission : extends
    Metaclass_Property <|-- DocumentProof : extends
    Metaclass_Class <|-- TrackingLookup : extends

    %% ─── 📌 VISUAL LEGEND ───
    subgraph LEGEND ["📌 Diagram Legend"]
        direction TB
        L_Meta["<<metaclass>><br/>UML Foundation"]:::metaStyle
        L_Stereo["<<stereotype>><br/>Domain Extension<br/>+taggedValue: Type"]:::stereoStyle
        L_Stereo -- "<<extension>>" --> L_Meta
    end
```

---

## 4. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Profile Mechanism | MinSU Governance Application |
|---|---|---|---|
| `<<metaclass>>` Box | `fill:#F6F8F6, stroke:#55645B` | Core UML base meta-element | Standard UML `Class` or `Component` |
| `<<stereotype>>` Box | `fill:#DCEFDD, stroke:#1B5E20` | Domain-specific extension | `<<TDPAnnex>>`, `<<FinancialAnnex>>`, `<<AuditedEntity>>`, `<<ExecutiveReviewable>>` |
| `+taggedValue: Type` | Tagged Value Attribute | Metadata property attached to stereotype | `annexNumber`, `signatoryRole`, `slaHours = 48`, `requiresDisbursementCheck` |
| `-- "<<extension>>" -->` | Extension Relationship | Extends metaclass semantics | Connects custom TDP stereotype to standard UML metaclass |
| `-- "<<generalization>>" -->` | Specialization Hierarchy | Stereotype inheritance | `FinancialAnnex` inherits all properties of `TDPAnnex` |


## 5. Stereotype Specifications
- **`<<ApplicantSubmission>>`**: Applied to application domain models. Mandates submission within active call deadlines.
- **`<<DocumentProof>>`**: Applied to attachment attributes. Limits upload sizes to 5MB and restricts file types.
- **`<<TrackingLookup>>`**: Applied to tracking code queries. Enforces regex matching and rate limiting on public endpoints.
