# Staff Coordinator — Object Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Object Diagram  
> **Scenario:** Runtime Snapshot of Verification Run & Annex 4 Billing Compilation  
> **Standard:** UML 2.5 Object Specification

---

## 1. Purpose

The Object Diagram shows a concrete runtime snapshot when the Staff Coordinator executes a 3-way verification run, resolves student discrepancies, and compiles verified grantees into an Annex 4 billing document.

---

## 2. Mermaid Object Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef objStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;

    staffObj["<u>staff : User</u><br/>id = 'usr_stf_20'<br/>name = 'Corazon Mendoza'<br/>role = STAFF<br/>twoFactorEnabled = true"]:::objStyle

    regObj["<u>registration : Registration</u><br/>studentIdNumber = 'MBC-2023-0192'<br/>fullName = 'Maria Clarissa Santos'<br/>status = ACCEPTED<br/>identityLocked = true"]:::objStyle

    runObj["<u>verificationRun : VerificationRun</u><br/>id = 'run_2026_ay1'<br/>runDate = '2026-10-15T09:30:00Z'<br/>totalChed = 150<br/>totalRegistrar = 148<br/>matchedCount = 146<br/>discrepancyCount = 2"]:::objStyle

    resObj["<u>result_01 : VerificationResult</u><br/>studentId = 'MBC-2023-0192'<br/>status = FULLY_VERIFIED<br/>resolved = true<br/>resolutionNotes = 'Matched via fuzzy name scoring (0.98)'"]:::objStyle

    annex4Obj["<u>annex4Doc : Document</u><br/>id = 'doc_annex4_ay2026'<br/>title = 'Annex 4 - TDP New Billing Statement'<br/>status = SUBMITTED<br/>createdById = 'usr_stf_20'<br/>granteeCount = 146"]:::objStyle

    certTplObj["<u>certTemplate : CertificateTemplate</u><br/>id = 'tpl_annex10_calapan'<br/>paperSize = 'A4'<br/>orientation = 'PORTRAIT'<br/>signatoryCount = 3"]:::objStyle

    staffObj ---|executes| runObj
    staffObj ---|validates and locks| regObj
    runObj ---|produces| resObj
    regObj ---|evaluated in| resObj
    resObj ---|imported into Form 2| annex4Obj
    staffObj ---|submits for review| annex4Obj
    staffObj ---|customizes layout of| certTplObj
    annex4Obj ---|references template for awardees| certTplObj

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Inst["<u>instanceName : ClassName</u><br/>attribute1 = value<br/>attribute2 = value"]:::legInst
        L_Link["Link: ---predicate---"]:::legLink
        L_Inst --> L_Link
    end
    classDef legInst fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legLink fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Format | UML Role | MinSU Instance Context |
|---|---|---|---|
| `<u>instance : Class</u>` | Underlined Identifier | Concrete runtime object in memory | Staff Coordinator, specific verification run, Annex 4 draft |
| `attr = 'value'` | Key-Value Assignment | Concrete state of instance attributes | `matchedCount = 146`, `identityLocked = true`, `status = ACCEPTED` |
| `---predicate---` | Undirected Semantic Link | Association relationship at runtime | Staff executes run, result imported into Annex 4 |
| 🟢 Green Tone | `#1B5E20` / `#F1F8F1` | Verified & Approved Entity | Validated student registration, verified cross-match result |

---

## 4. Runtime Object Attributes

- `staff`: Authenticated user with role `STAFF` and active two-factor authentication.
- `registration`: Student applicant whose Student ID and Name are permanently locked from modification.
- `verificationRun`: Batch execution that compared 150 CHED records with 148 Registrar records.
- `result_01`: Concrete discrepancy record resolved using Jaro-Winkler fuzzy matching.
- `annex4Doc`: Official billing document populated with the 146 verified grantees.
- `certTemplate`: Pre-configured award certificate template ready for batch Word (`.doc`) generation.
