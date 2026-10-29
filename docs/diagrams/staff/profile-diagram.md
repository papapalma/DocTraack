# Staff Coordinator — Profile Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Profile Diagram  
> **Target Domain:** Annex Operations & Transmittal Tracking

---

## 1. Purpose

The Profile Diagram defines domain-specific UML extensions for Staff operational management, including scan artifact properties, transmittal manifests, and call form builders.

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

    subgraph PROFILE["<<profile>> MinSU_Staff_Profile"]
        AnnexBuilder["<<stereotype>><br/>AnnexBuilder<br/>+supportedAnnexes: List~Int~ = [1..10]<br/>+requiresValidation: Boolean = true"]:::stereoStyle

        SignedScanArtifact["<<stereotype>><br/>SignedScanArtifact<br/>+maxFileSizeBytes: Int = 15728640<br/>+allowedMime: String = 'application/pdf'"]:::stereoStyle

        TransmittalManifest["<<stereotype>><br/>TransmittalManifest<br/>+courierRequired: Boolean = true<br/>+gdriveBackupMandatory: Boolean = true"]:::stereoStyle
    end

    AnnexBuilder -- "<<extension>>" --> MetaOp
    SignedScanArtifact -- "<<extension>>" --> MetaClass
    TransmittalManifest -- "<<extension>>" --> MetaClass

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
| `<<metaclass>>` Box | `fill:#F6F8F6, stroke:#55645B` | Core UML base meta-element | Standard UML `Class` or `Component` |
| `<<stereotype>>` Box | `fill:#DCEFDD, stroke:#1B5E20` | Domain-specific extension | `<<TDPAnnex>>`, `<<FinancialAnnex>>`, `<<AuditedEntity>>`, `<<ExecutiveReviewable>>` |
| `+taggedValue: Type` | Tagged Value Attribute | Metadata property attached to stereotype | `annexNumber`, `signatoryRole`, `slaHours = 48`, `requiresDisbursementCheck` |
| `-- "<<extension>>" -->` | Extension Relationship | Extends metaclass semantics | Connects custom TDP stereotype to standard UML metaclass |
| `-- "<<generalization>>" -->` | Specialization Hierarchy | Stereotype inheritance | `FinancialAnnex` inherits all properties of `TDPAnnex` |


---

## 4. PlantUML Profile Diagram

```plantuml
@startuml
skinparam packageBackgroundColor #FFFFFF
skinparam packageBorderColor #1B5E20

package "<<profile>> MinSU_Staff_Profile" {
  class "Class" <<metaclass>> as MetaClass
  class "Operation" <<metaclass>> as MetaOp

  class "AnnexBuilder" <<stereotype>> {
    + supportedAnnexes : List<Integer> = [1..10]
    + requiresValidation : Boolean = true
  }

  class "SignedScanArtifact" <<stereotype>> {
    + maxFileSizeBytes : Integer = 15728640
    + allowedMime : String = "application/pdf"
  }

  class "TransmittalManifest" <<stereotype>> {
    + courierRequired : Boolean = true
    + gdriveBackupMandatory : Boolean = true
  }

  AnnexBuilder -up-> MetaOp : "<<extension>>"
  SignedScanArtifact -up-> MetaClass : "<<extension>>"
  TransmittalManifest -up-> MetaClass : "<<extension>>"
}
@enduml
```

---

## 5. Stereotype Definitions

| Stereotype | Metaclass | Tagged Values | Description |
|---|---|---|---|
| `<<AnnexBuilder>>` | `Operation` | `supportedAnnexes: List`, `requiresValidation: Boolean` | Flags form compilation methods for Annexes 1 through 10. |
| `<<SignedScanArtifact>>` | `Class` | `maxFileSizeBytes: Int`, `allowedMime: String` | Constrains physical document scans to PDF under 15MB. |
| `<<TransmittalManifest>>` | `Class` | `courierRequired: Boolean`, `gdriveBackupMandatory: Boolean` | Mandates courier airway bill logging and Google Drive backup URLs. |
