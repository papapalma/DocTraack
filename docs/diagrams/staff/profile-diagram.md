# Staff Coordinator — Profile Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Profile Diagram  
> **Target Domain:** Annex Operations, Verification, and Transmittal Tracking

---

## 1. Purpose

The Profile Diagram defines domain-specific UML stereotypes and tagged values for the Staff Coordinator domain, including 3-way verification rules, RA 10173 identity locks, certificate layouts, and transmittal manifests.

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
        TripartiteVerified["<<stereotype>><br/>TripartiteVerified<br/>+fuzzyThreshold: Float = 0.85<br/>+datasets: List~String~ = ['CHED','REGISTRAR','SYSTEM']<br/>+manualResolutionRequired: Boolean = true"]:::stereoStyle

        LockedIdentity["<<stereotype>><br/>LockedIdentity<br/>+statute: String = 'RA 10173'<br/>+lockedFields: List~String~ = ['studentIdNumber','fullName']<br/>+studentEditable: List~String~ = ['gwa','contacts']"]:::stereoStyle

        ExportableWorkbook["<<stereotype>><br/>ExportableWorkbook<br/>+library: String = 'ExcelJS'<br/>+tabCount: Int = 3<br/>+autoFormulas: Boolean = true"]:::stereoStyle

        CertificateTemplateDef["<<stereotype>><br/>CertificateTemplateDef<br/>+paperSizes: List~String~ = ['A4','LETTER','FOLIO','LEGAL']<br/>+minSignatories: Int = 1<br/>+exportFormat: String = '.doc'"]:::stereoStyle

        SignedScanArtifact["<<stereotype>><br/>SignedScanArtifact<br/>+maxFileSizeBytes: Int = 15728640<br/>+allowedMime: String = 'application/pdf'"]:::stereoStyle

        TransmittalManifest["<<stereotype>><br/>TransmittalManifest<br/>+courierRequired: Boolean = true<br/>+gdriveBackupMandatory: Boolean = true"]:::stereoStyle
    end

    TripartiteVerified -- "<<extension>>" --> MetaClass
    LockedIdentity -- "<<extension>>" --> MetaClass
    ExportableWorkbook -- "<<extension>>" --> MetaClass
    CertificateTemplateDef -- "<<extension>>" --> MetaClass
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
| `<<metaclass>>` Box | `fill:#F6F8F6, stroke:#55645B` | Core UML base meta-element | Standard UML `Class` or `Operation` |
| `<<stereotype>>` Box | `fill:#DCEFDD, stroke:#1B5E20` | Domain-specific extension | `<<TripartiteVerified>>`, `<<LockedIdentity>>`, `<<ExportableWorkbook>>` |
| `+taggedValue: Type` | Tagged Value Attribute | Metadata property attached to stereotype | `fuzzyThreshold = 0.85`, `statute = 'RA 10173'`, `library = 'ExcelJS'` |
| `-- "<<extension>>" -->` | Extension Relationship | Extends metaclass semantics | Connects custom TDP stereotype to standard UML metaclass |

---

## 4. Stereotype Tagged Values & Rules

- **`<<TripartiteVerified>>`**: Enforces strict tripartite cross-matching using Jaro-Winkler distance scoring with a default threshold of 0.85.
- **`<<LockedIdentity>>`**: Prevents alteration of the scholar's student ID number and legal name once marked `ACCEPTED`.
- **`<<ExportableWorkbook>>`**: Dictates that billing spreadsheets generate native multi-tab `ExcelJS` files with dynamic administrative cost formulas.
- **`<<CertificateTemplateDef>>`**: Specifies permitted dimensions (A4, Short Letter, Long Folio, Legal) and Word output generation.
