# Timing Diagram: MinSU DocTrack Whole System

## 1. Description
This timing diagram details the time-based constraints, turnaround Service Level Agreements (SLAs), and operational lifelines across an entire academic semester in the MinSU DocTrack system, encompassing intake cutoffs, 3-way verification runs, 48-hour executive review SLAs, and financial liquidation deadlines.

## 2. ASD-STE100 Technical Specifications
- Define concrete time intervals along an academic semester timeline.
- Enforce strict submission cutoff dates for student scholarship intake.
- Mandate a 48-hour SLA turnaround for executive approvals by the Campus Director.
- Schedule financial liquidation, 3-way verification, and transmittal delivery before semester closure.

---

## 3. Semester Operational Timeline Diagram (Mermaid)

```mermaid
timeline
    title MinSU DocTrack Academic Semester TDP Lifecycle & SLA Constraints
    section Phase 1: Intake & 2FA Onboarding (Days 1 - 30)
        Day 1 : Call Announcement : Staff Coordinator publishes Annex 2 call with quota
        Day 10 : 2FA Setup : Students configure Microsoft Authenticator & persistent profiles
        Day 15 : Peak Intake : Students upload grades & proof certificates via portal
        Day 30 : Intake Cutoff : Public application intake window closes automatically
    section Phase 2: Validation, 3-Way Verification & Billing (Days 31 - 45)
        Day 35 : Registration Validation : Staff marks applicants ACCEPTED or REJECTED in queue
        Day 40 : 3-Way Tripartite Match : Cross-matching CHED CSV, Registrar CSV & System Masterlist
        Day 42 : Discrepancy Resolution : Manual resolution of candidate edge cases
        Day 45 : Billing Compilation : Staff Coordinator submits Annex 4 to Executive Queue
    section Phase 3: Executive Review SLA (Days 46 - 48)
        Day 46 : Queue Ingress : Campus Director receives notification of pending review
        Day 48 : 48-Hour SLA Expiry : Executive 1-Click approval must complete within 48 hours
    section Phase 4: Financial Liquidation & Excel Exports (Days 49 - 65)
        Day 55 : Payroll Preparation : Accounting compiles Annex 9 Beneficiary Payroll
        Day 60 : ExcelJS Export : Streaming native multi-tab .xlsx ledgers for audit
        Day 65 : Zero Variance Check : Reconciled with CHED allocation (0.00 PHP discrepancy)
    section Phase 5: Transmittal & Archival (Days 66 - 75)
        Day 70 : Wet-Signed Scan Upload : Signed physical documents digitized to Google Drive
        Day 72 : Courier Dispatch : Formal package transmitted to CHED Region IV-B
        Day 75 : Semester Archival : Cycle finalized and locked into read-only audit store
    section 📌 Diagram Legend & SLAs
        30 Days : Student Intake Window : Public portal disables submissions after cutoff
        5 Days : 3-Way Match Window : Tripartite reconciliation and discrepancy clearance
        48 Hours : Executive Review SLA : Campus Director endorsement turnaround
        15 Days : Accounting Window : Zero-variance payroll reconciliation
```

---

## 4. Diagram Legend & Symbol Guide

| Timeline Element | Syntax / Type | Temporal Meaning | MinSU Operational Application |
|---|---|---|---|
| `section Phase Name` | Timeline Section | High-level semester operational phase | Intake, 3-Way Verification, Executive Review, Financials, Transmittal |
| `Day N : Milestone` | Temporal Milestone | Specific calendar threshold or SLA trigger date | Day 1 (Call Opening), Day 40 (3-Way Verification), Day 48 (48h SLA), Day 75 (Archival) |
| `[ ACTIVE ]` | Lifeline Active State | Subsystem actively accepting input | Public student intake portal accepting form data and file uploads |
| `[ 3-WAY MATCH ]` | Verification Window | Tripartite cross-matching running | Fuzzy string comparisons and confidence score calculations |
| `[ 48h SLA ]` | Critical Turnaround Window | Strict executive decision-making timeframe | Maximum 48 hours for Campus Director 1-click approval |
| `[ DISPATCH ]` | Courier Transmittal Milestone | Outbound physical and digital hand-off | Scanned wet-signed documents transmitted to CHED Region IV-B |
