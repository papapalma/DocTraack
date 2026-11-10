# Student Applicant — Activity Diagram

> **Role:** `STUDENT`  
> **Diagram Type:** Activity Diagram  
> **Workflow:** 2FA Setup, Online Scholarship Application & Profile Maintenance

---

## 1. Purpose

The Activity Diagram shows the step-by-step workflow for a student setting up 2FA, applying for a TDP scholarship, uploading required documents, receiving a verified tracking code, and maintaining profile records under RA 10173 data locks.

---

## 2. Mermaid Activity Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef startEnd fill:#1B5E20,stroke:#123F17,stroke-width:2px,color:#FFFFFF;
    classDef action fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef decision fill:#FFF1C2,stroke:#F2B705,stroke-width:1.5px,color:#1F2A24;

    StartNode(( )):::startEnd --> SetupAuth[Student registers and configures Microsoft 2FA]:::action
    SetupAuth --> OpenPortal[Student opens /portal catalog & announcements]:::action
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
    
    DownloadReceiptSlip --> WaitValidation[Wait for Staff Coordinator validation]:::action
    WaitValidation --> OutcomeDecision{Does Coordinator Accept Applicant?}:::decision

    OutcomeDecision -- Yes --> IdentityLock[RA 10173 locks Student ID & Name permanently]:::action
    IdentityLock --> MaintainProfile[Student maintains non-static GWA & contacts in /portal/profile]:::action
    MaintainProfile --> EndSuccess((( ))):::startEnd

    OutcomeDecision -- No --> ViewFeedback[View rejection feedback in portal]:::action
    ViewFeedback --> EndSuccess

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
| `Start / End` | `(( ))` / `((( )))` | Initial / Final State | Student lifecycle starts at 2FA registration and concludes at profile maintenance |
| `Action` | `[Rectangle]` | Operational Step | Setup 2FA, Upload Proofs, Generate Tracking Code, Maintain Profile |
| `Decision` | `{Diamond}` | Guard Evaluation | Deadline Open?, Valid Files?, Coordinator Acceptance Decision? |

---

## 4. PlantUML Activity Diagram

```plantuml
@startuml
skinparam activityBackgroundColor #FFFFFF
skinparam activityBorderColor #1B5E20

start
:Register Account & Setup Microsoft 2FA;
:Browse Active Calls in /portal;
if (Deadline Open?) then (yes)
  :Fill Demographics & Upload Proofs;
  if (Files Valid <= 5MB?) then (yes)
    :Sign RA 10173 Privacy Consent;
    :Submit Application;
    :Receive Unique Tracking Code;
    :Download Official Receipt Slip;
    if (Does Coordinator Accept Applicant?) then (yes)
      :Student ID & Name Permanently Locked;
      :Maintain GWA & Contacts in /portal/profile;
    else (no)
      :View Feedback in Portal;
    endif
  else (no)
    :Display File Error;
    detach
  endif
else (no)
  :Display Call Closed;
  stop
endif
stop
@enduml
```
