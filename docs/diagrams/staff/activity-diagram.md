# Staff Coordinator — Activity Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Activity Diagram  
> **Workflow:** Annex Preparation, Endorsement, Physical Scan Upload & Transmittal

---

## 1. Purpose

The Activity Diagram shows the full lifecycle sequence executed by the Staff Coordinator, from drafting an Annex document to logging its final transmittal to CHED.

---

## 2. Mermaid Activity Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef startEnd fill:#1B5E20,stroke:#123F17,stroke-width:2px,color:#FFFFFF;
    classDef action fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef decision fill:#FFF1C2,stroke:#F2B705,stroke-width:1.5px,color:#1F2A24;

    StartNode(( )):::startEnd --> ClickNewDoc[Staff clicks New Document at /documents]:::action
    ClickNewDoc --> SelectAnnexType[Select Annex Number e.g. Annex 1 or Annex 3]:::action
    SelectAnnexType --> FillFormData[Enter student roster and award metadata]:::action
    FillFormData --> ValidateSchema{Is form data valid?}:::decision

    ValidateSchema -- No --> ShowErrors[Highlight missing fields]:::action
    ShowErrors --> FillFormData

    ValidateSchema -- Yes --> SubmitReview[Click Submit for Review]:::action
    SubmitReview --> WaitForDirector[Wait for Campus Director review]:::action

    WaitForDirector --> DirectorReviewResult{Review Outcome?}:::decision

    %% Revision Loop
    DirectorReviewResult -- Returned --> ReadFeedback[Inspect Director revision comments]:::action
    ReadFeedback --> CorrectErrors[Correct defective fields in form]:::action
    CorrectErrors --> ResubmitReview[Click Resubmit for Review]:::action
    ResubmitReview --> WaitForDirector

    %% Approval Path
    DirectorReviewResult -- Approved --> PrintOfficialPDF[Print compiled official PDF document]:::action
    PrintOfficialPDF --> ExecuteSignatures[Execute wet-ink signatures and university seal]:::action
    ExecuteSignatures --> ScanPhysicalCopy[Scan stamped physical document to PDF]:::action
    ScanPhysicalCopy --> UploadSignedScan[Upload scanned PDF at /documents/id/upload]:::action
    
    UploadSignedScan --> UploadGoogleDrive[Upload digital copy to external Google Drive]:::action
    UploadGoogleDrive --> DispatchPhysical[Dispatch hardcopy package to CHED / UniFAST]:::action
    DispatchPhysical --> LogTransmittalRecord[Record Transmittal in Outgoing Registry with link]:::action
    LogTransmittalRecord --> AutoArchive[Document marked TRANSMITTED]:::action
    AutoArchive --> EndNode((( ))):::startEnd

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

1. Staff initiates a new document form at `/documents`.
2. Staff populates dynamic tabular fields with verified student data.
3. System verifies schema compliance and transitions status to `SUBMITTED`.
4. If Director returns the document, Staff corrects errors and resubmits.
5. Upon approval, Staff prints the system-generated PDF.
6. University signatories sign the document and apply the official seal.
7. Staff scans the signed hardcopy and uploads the PDF to DocTrack.
8. Staff uploads a duplicate to Google Drive and delivers the physical transmittal.
9. Staff logs the transmittal record with courier info and URL in the Outgoing Registry.
