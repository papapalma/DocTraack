# Timing Diagram: Student Applicant Domain

## 1. Description
This timing diagram traces the time-based state transitions of a student scholarship application relative to administrative evaluation deadlines and submission cutoff schedules in MinSU DocTrack.

## 2. ASD-STE100 Technical Specifications
- Graph student application states along a defined horizontal timeline.
- Enforce strict intake closure at the deadline timestamp (Day 30).
- Trace verification turnarounds by the Staff Coordinator (Days 30-45).
- Release final award notices upon completion of evaluation (Day 60).

## 3. Timing Diagram (Mermaid)

```mermaid
timeline
    title Student Application Lifecycle & Evaluation Timeline
    section Submission Window (Day 1 - 30)
        Day 1 : Call Published : Student browses TDP criteria on landing page
        Day 15 : Application Submitted : Student uploads PDF proofs and receives tracking code
        Day 30 : Window Closes : Portal intake disabled for new applicants
    section Coordinator Review (Day 31 - 45)
        Day 35 : Under Review : Staff coordinator verifies grades and indigency certificates
        Day 45 : Shortlist Finalized : Staff coordinator moves verified students to Qualified
    section Executive Approval & Award (Day 46 - 60)
        Day 50 : Annex 2 Compiled : Masterlist submitted to Campus Director
        Day 55 : Director Approval : Executive signature endorsed
        Day 60 : Final Award : Student tracking code displays Awarded badge and payroll schedule

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


## 5. Timeline Milestones & Rules
- **Days 1 to 30 (Submission Window)**: Students can draft, validate, and finalize submissions. The tracking code is issued immediately upon upload.
- **Day 30 (Hard Cutoff)**: Server actions reject new incoming payloads; existing records become immutable for students.
- **Days 31 to 45 (Verification)**: Staff Coordinators evaluate student attachments and flag revisions or qualifications.
- **Day 60 (Notification & Payroll)**: Approved students receive disbursement updates matching Annex 9 beneficiary schedules.
