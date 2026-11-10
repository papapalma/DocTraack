# Staff Coordinator — Activity Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Activity Diagram  
> **Workflow:** Registration Validation, 3-Way Tripartite Verification, Annex Preparation, Endorsement & Transmittal

---

## 1. Purpose

The Activity Diagram shows the full operational sequence executed by the Staff Coordinator, from validating student intake applications and running 3-way tripartite verification to drafting Annexes, exporting multi-tab Excel workbooks, and logging agency transmittals.

---

## 2. Mermaid Activity Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef startEnd fill:#1B5E20,stroke:#123F17,stroke-width:2px,color:#FFFFFF;
    classDef action fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef decision fill:#FFF1C2,stroke:#F2B705,stroke-width:1.5px,color:#1F2A24;

    StartNode(( )):::startEnd --> ValidateQueue[Access /registrations and validate student profiles]:::action
    ValidateQueue --> CheckDocs{Documents Valid?}:::decision

    CheckDocs -- No --> RejectApplicant[Mark Application REJECTED with notes]:::action
    RejectApplicant --> ValidateQueue

    CheckDocs -- Yes --> AcceptApplicant[Mark Application ACCEPTED / Profile identity locked]:::action
    AcceptApplicant --> Run3Way[Upload CHED & Registrar CSV datasets to /verification]:::action

    Run3Way --> ExecuteMatch[Execute 3-Way Tripartite Cross-Matching Engine]:::action
    ExecuteMatch --> DiscrepancyCheck{Discrepancies Found?}:::decision

    DiscrepancyCheck -- Yes --> ManualResolve[Manually resolve discrepancy: CONFIRM / DISMISS]:::action
    ManualResolve --> CompileAnnex

    DiscrepancyCheck -- No --> CompileAnnex[Click New Document / Import Verified Roster]:::action
    CompileAnnex --> FillFormData[Review Form 1, Form 2 and Form 3 canvas]:::action
    FillFormData --> ValidateSchema{Is form data valid?}:::decision

    ValidateSchema -- No --> ShowErrors[Highlight missing fields]:::action
    ShowErrors --> FillFormData

    ValidateSchema -- Yes --> SubmitReview[Click Submit for Executive Review]:::action
    SubmitReview --> WaitForDirector[Wait for Campus Director review]:::action

    WaitForDirector --> DirectorReviewResult{Does Director Approve Document?}:::decision

    %% Revision Loop
    DirectorReviewResult -- No --> ReadFeedback[Inspect Director revision comments]:::action
    ReadFeedback --> CorrectErrors[Correct defective fields in form]:::action
    CorrectErrors --> ResubmitReview[Click Resubmit for Review]:::action
    ResubmitReview --> WaitForDirector

    %% Approval Path
    DirectorReviewResult -- Yes --> ExportExcel[Click Export Native Multi-Tab Excel .xlsx]:::action
    ExportExcel --> PrintOfficialPDF[Print compiled official document]:::action
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
    end
    classDef legStart fill:#1B5E20,color:#fff;
    classDef legAct fill:#FFFFFF,stroke:#1B5E20,color:#1F2A24;
    classDef legDec fill:#FFF1C2,stroke:#F2B705,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Activity Concept | MinSU System Implementation |
|---|---|---|---|
| `Start / End` | `(( ))` / `((( )))` | Initial / Final State | Process starts at registration validation and ends at transmittal archival |
| `Action` | `[Rectangle]` | Operational Procedure | Validate Queue, Run 3-Way Match, Compile Annex, Export Excel, Scan Upload |
| `Decision` | `{Diamond}` | Guard Evaluation | Documents Valid?, Discrepancies Found?, Review Outcome? |

---

## 4. PlantUML Activity Diagram

```plantuml
@startuml
skinparam activityBackgroundColor #FFFFFF
skinparam activityBorderColor #1B5E20

start
:Access /registrations Validation Queue;
if (Documents Valid?) then (yes)
  :Mark ACCEPTED (Identity Locked);
else (no)
  :Mark REJECTED;
  stop
endif

:Upload CHED & Registrar CSVs to /verification;
:Execute 3-Way Tripartite Match;
if (Discrepancies Found?) then (yes)
  :Manually Resolve Discrepancy (CONFIRM / DISMISS);
else (no)
endif

:Compile Verified Roster into Annex 4;
:Submit for Executive Review;

if (Does Director Approve Document?) then (yes)
  :Export Multi-Tab Excel Workbook (.xlsx);
  :Execute Wet-Ink Signatures & Seal;
  :Upload Scanned PDF;
  :Dispatch to CHED & Log Transmittal;
  stop
else (no)
  :Inspect Feedback & Amend;
  :Resubmit for Review;
  detach
endif
@enduml
```
