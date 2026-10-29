# Timing Diagram: MinSU DocTrack Whole System

## 1. Description
This timing diagram details the time-based constraints, turnaround Service Level Agreements (SLAs), and operational lifelines across an entire academic semester in the MinSU DocTrack system.

## 2. ASD-STE100 Technical Specifications
- Define concrete time intervals along an academic semester timeline.
- Enforce strict submission cutoff dates for student scholarship intake.
- Mandate a 48-hour SLA turnaround for executive approvals by the Campus Director.
- Schedule financial liquidation and transmittal delivery before semester closure.

---

## 3. Semester Operational Timeline Diagram (Mermaid)

```mermaid
timeline
    title MinSU DocTrack Academic Semester TDP Lifecycle & SLA Constraints
    section Phase 1: Intake & Onboarding (Days 1 - 30)
        Day 1 : Call Announcement : Staff Coordinator publishes Annex 2 call with quota
        Day 15 : Peak Intake : Students upload grades & proof certificates via portal
        Day 30 : Intake Cutoff : Public application intake window closes automatically
    section Phase 2: Evaluation & Masterlist (Days 31 - 45)
        Day 35 : Document Verification : Coordinator filters qualified student applicants
        Day 45 : Masterlist Compilation : Staff Coordinator submits Annex 2 to Executive Queue
    section Phase 3: Executive Review SLA (Days 46 - 48)
        Day 46 : Queue Ingress : Campus Director receives notification of pending review
        Day 48 : 48-Hour SLA Expiry : Executive 1-Click approval must complete within 48 hours
    section Phase 4: Financial Liquidation (Days 49 - 65)
        Day 55 : Payroll Preparation : Accounting compiles Annex 9 Beneficiary Payroll
        Day 65 : Zero Variance Check : Reconciled with CHED allocation (0.00 PHP discrepancy)
    section Phase 5: Transmittal & Archival (Days 66 - 75)
        Day 70 : Wet-Signed Scan Upload : Signed physical documents digitized to Google Drive
        Day 72 : Courier Dispatch : Formal package transmitted to CHED Region IV-B
        Day 75 : Semester Archival : Cycle finalized and locked into read-only audit store
    section 📌 Diagram Legend & SLAs
        30 Days : Student Intake Window : Public portal disables submissions after cutoff
        48 Hours : Executive Review SLA : Campus Director endorsement turnaround
        15 Days : Accounting Window : Zero-variance payroll reconciliation
```

---

## 4. Diagram Legend & Symbol Guide

| Timeline Element | Syntax / Type | Temporal Meaning | MinSU Operational Application |
|---|---|---|---|
| `section Phase Name` | Timeline Section | High-level semester operational phase | Intake, Masterlist Eval, Executive Review, Financials, Transmittal |
| `Day N : Milestone` | Temporal Milestone | Specific calendar threshold or SLA trigger date | Day 1 (Announcement), Day 30 (Intake cutoff), Day 75 (Semester archival) |
| `[ ACTIVE ]` | Lifeline Active State | Subsystem actively accepting input | Public student intake portal accepting form data and file uploads |
| `[ IDLE ]` | Lifeline Idle State | Subsystem standing by awaiting upstream completion | Executive queue idle while coordinator evaluates applicants |
| `[ 48h SLA ]` | Critical Turnaround Window | Strict executive decision-making timeframe | Maximum 48 hours for Campus Director 1-click approval |
| `[ DISPATCH ]` | Courier Transmittal Milestone | Outbound physical and digital hand-off | Scanned wet-signed documents transmitted to CHED Region IV-B |

---

## 5. Operational Lifelines & States

```
Time (Days):      0        15        30        45    48        65        72    75
---------------------------------------------------------------------------------
Portal Intake:    [    ACTIVE       ] [           DISABLED                     ]
Coordinator Eval: [  IDLE  ] [        ACTIVE         ] [       IDLE            ]
Director Review:  [              IDLE               ] [48h SLA] [     IDLE     ]
Accounting Recon: [                     IDLE                   ] [   ACTIVE   ]
Agency Dispatch:  [                              IDLE                       ] [DISPATCH]
```

---

## 6. Critical Time Rules & Constraints
- **Application Window (30 Days)**: After Day 30, the public portal disables new submissions. Existing students retain tracking code query capabilities.
- **Executive SLA (48 Hours)**: When a document enters the executive queue, the Campus Director has 48 hours to approve or return the document. Alerts trigger after 36 hours of inactivity.
- **Financial Balance Window (15 Days)**: The accounting officer has 15 business days following masterlist approval to reconcile payroll disbursements.
- **Transmittal Deadline (Day 72)**: Official transmittal control numbers must be logged with courier slips before semester-end financial reporting.
