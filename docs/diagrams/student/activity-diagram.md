# Student Applicant — Activity Diagram

> **Role:** `STUDENT`  
> **Diagram Type:** Activity Diagram  
> **Workflow:** Online Scholarship Application & Verification

---

## 1. Purpose

The Activity Diagram shows the step-by-step workflow for a student applying for a TDP scholarship, uploading required documents, and receiving a verified tracking code.

---

## 2. Mermaid Activity Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef startEnd fill:#1B5E20,stroke:#123F17,stroke-width:2px,color:#FFFFFF;
    classDef action fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef decision fill:#FFF1C2,stroke:#F2B705,stroke-width:1.5px,color:#1F2A24;

    StartNode(( )):::startEnd --> OpenPortal[Student opens /portal catalog]:::action
    OpenPortal --> SelectCall[Select active TDP scholarship call]:::action
    SelectCall --> CheckDeadline{Is call deadline still open?}:::decision

    CheckDeadline -- No --> ShowClosedAlert[Display Call Closed message]:::action
    ShowClosedAlert --> EndClosed((( ))):::startEnd

    CheckDeadline -- Yes --> OpenApplicationForm[Open dynamic application form]:::action
    OpenApplicationForm --> FillDemographics[Enter personal, campus, and course details]:::action
    FillDemographics --> UploadProofs[Upload scanned COR, Grade Report, and Indigency]:::action
    
    UploadProofs --> ValidateFiles{Are documents valid PDF/Images <= 5MB?}:::decision

    ValidateFiles -- No --> DisplayFileError[Highlight invalid file type or size]:::action
    DisplayFileError --> UploadProofs

    ValidateFiles -- Yes --> AgreePrivacyConsent[Sign digital Data Privacy Act statement]:::action
    AgreePrivacyConsent --> ClickSubmit[Click Submit Application button]:::action
    
    ClickSubmit --> GenerateTrackingCode[System generates unique tracking code]:::action
    GenerateTrackingCode --> StoreApplication[Insert Application row in database]:::action
    StoreApplication --> ShowConfirmationModal[Display Congratulations modal with tracking code]:::action
    ShowConfirmationModal --> DownloadReceiptSlip[Click Download Official Receipt Slip]:::action
    DownloadReceiptSlip --> EndSuccess((( ))):::startEnd

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Start(["([Pill / Circle]): Start / End Node"]):::legStart
        L_Act["[Rectangle]: Operational Action"]:::legAct
        L_Dec{"{Diamond}: Guard Decision"}:::legDec
        L_App["Approved / Success Flow"]:::legApp
        L_Ret["Returned / Revision Flow"]:::legRet
        L_Start -.-> L_Act -.-> L_Dec
        L_Dec -.->|Condition Met| L_App
        L_Dec -.->|Revision Needed| L_Ret
    end
    classDef legStart fill:#123F17,stroke:#1B5E20,color:#fff;
    classDef legAct fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legDec fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
    classDef legApp fill:#DCEFDD,stroke:#1B5E20,color:#123F17;
    classDef legRet fill:#FEE2E2,stroke:#DC2626,color:#991B1B;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Node Type | Technical Role | MinSU Domain Meaning |
|---|---|---|---|
| `([Pill / Circle])` | `([Start / End])` / `(( ))` | Initial or terminal workflow boundary | Workflow entry point, queue initiation, terminal archive closure |
| `[Rectangle]` | `["Action"]` | Operational task or software routine | Inspecting forms, computing sums, generating receipt, updating status |
| `{Diamond}` | `{"Decision"}` | Mutually exclusive condition / guard | "Compliance verified?", "Variance == 0.00?", "Quota available?" |
| `──▶` | Solid Line `-->` | Sequential flow transition | Standard forward progression between operational activities |
| `-->|Label|` | Guarded Branch | Conditional execution path | "Yes / Approved", "No / Return with Remarks" |
| 🔲 Subgraph | `subgraph Lane` | Departmental Swimlane Boundary | Segregates duties across roles and authority boundaries |
| 🟢 Green Tone | `#DCEFDD` / `#1B5E20` | Approved State / Forward Flow | Validated submissions, executive approvals, zero-variance checks |
| 🟡 Gold Tone | `#FFF1C2` / `#B88A00` | Evaluation / Inspection Gate | Review queues, quota verification, decision checkpoints |
| 🔴 Red / Rose Tone | `#FEE2E2` / `#DC2626` | Return / Discrepancy Alert | Ineligible applications, returned documents, ledger adjustments |


---

## 4. Workflow Steps

1. Student browses open scholarship calls on `/portal`.
2. Student selects an active TDP announcement.
3. System verifies that the submission deadline has not passed.
4. Student enters demographic and academic details into the dynamic form.
5. Student attaches Certificate of Registration (COR) and grade transcripts.
6. System checks file types (PDF, PNG, JPG) and sizes (`<= 5MB`).
7. Student agrees to the Data Privacy Act (RA 10173) consent clause.
8. System assigns an alphanumeric tracking code (for example, `TDP-2026-X9B2`).
9. System stores the submission with status `SUBMITTED`.
10. Student receives an official downloadable receipt slip.
