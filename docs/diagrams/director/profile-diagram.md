# Campus Director — Profile Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Profile Diagram  
> **Target Domain:** Executive Endorsement, 2FA Protection, and Review Turnaround Governance

---

## 1. Purpose

The Profile Diagram defines domain-specific UML stereotypes and constraints governing the Campus Director's endorsement authority, two-factor authentication gates, verification oversight, and 48-hour review turnaround SLAs.

---

## 2. Mermaid Profile Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef metaStyle fill:#F6F8F6,stroke:#55645B,stroke-width:1.5px,color:#1F2A24;
    classDef stereoStyle fill:#DCEFDD,stroke:#1B5E20,stroke-width:2px,color:#123F17;

    subgraph METACLASSES["UML Metaclasses"]
        MetaClass["<<metaclass>><br/>Class"]:::metaStyle
        MetaOp["<<metaclass>><br/>Operation"]:::metaStyle
    end

    subgraph PROFILE["<<profile>> MinSU_Director_Profile"]
        ExecutiveSignatory["<<stereotype>><br/>ExecutiveSignatory<br/>+roleAuthority: Role = DIRECTOR<br/>+isSoleEndorser: Boolean = true"]:::stereoStyle

        ReviewQueueItem["<<stereotype>><br/>ReviewQueueItem<br/>+eligibleStatuses: List~String~ = ['SUBMITTED','RESUBMITTED']<br/>+requiresVerificationSignOff: Boolean = true"]:::stereoStyle

        SLAEnforced["<<stereotype>><br/>SLAEnforced<br/>+maxTurnaroundHours: Int = 48<br/>+alertOnBreach: Boolean = true"]:::stereoStyle

        VerificationOversight["<<stereotype>><br/>VerificationOversight<br/>+requiresZeroDiscrepancy: Boolean = true<br/>+auditTrailMandatory: Boolean = true"]:::stereoStyle

        TwoFactorProtected["<<stereotype>><br/>TwoFactorProtected<br/>+method: String = 'TOTP'<br/>+enforcedForApproval: Boolean = true"]:::stereoStyle
    end

    ExecutiveSignatory -- "<<extension>>" --> MetaOp
    ReviewQueueItem -- "<<extension>>" --> MetaClass
    SLAEnforced -- "<<extension>>" --> MetaClass
    VerificationOversight -- "<<extension>>" --> MetaClass
    TwoFactorProtected -- "<<extension>>" --> MetaClass

    %% ─── 📌 VISUAL LEGEND ───
    subgraph LEGEND ["📌 Diagram Legend"]
        direction TB
        L_Meta["<<metaclass>><br/>UML Foundation"]:::metaStyle
        L_Stereo["<<stereotype>><br/>Domain Extension<br/>+taggedValue: Type"]:::stereoStyle
        L_Stereo -- "<<extension>>" --> L_Meta
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Profile Mechanism | MinSU Governance Application |
|---|---|---|---|
| `<<metaclass>>` Box | `fill:#F6F8F6, stroke:#55645B` | Core UML base meta-element | Standard UML `Class` or `Operation` |
| `<<stereotype>>` Box | `fill:#DCEFDD, stroke:#1B5E20` | Domain-specific extension | `<<ExecutiveSignatory>>`, `<<SLAEnforced>>`, `<<TwoFactorProtected>>` |
| `+taggedValue: Type` | Tagged Value Attribute | Metadata property attached to stereotype | `maxTurnaroundHours = 48`, `method = 'TOTP'`, `isSoleEndorser = true` |
| `-- "<<extension>>" -->` | Extension Relationship | Extends metaclass semantics | Connects custom director stereotype to standard UML metaclass |

---

## 4. Stereotype Tagged Values & Rules

- **`<<ExecutiveSignatory>>`**: Restricts document endorsement exclusively to authenticated users holding the `CAMPUS_DIRECTOR` role.
- **`<<ReviewQueueItem>>`**: Dictates that only documents in `SUBMITTED` or `RESUBMITTED` states are visible in the director review queue.
- **`<<SLAEnforced>>`**: Establishes a strict 48-hour review turnaround window from initial staff submission.
- **`<<VerificationOversight>>`**: Mandates executive review of tripartite cross-matching stats prior to Annex 4 endorsement.
- **`<<TwoFactorProtected>>`**: Enforces Microsoft Authenticator TOTP verification prior to executing endorsement operations.
