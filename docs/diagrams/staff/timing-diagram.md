# Staff Coordinator — Timing Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Timing Diagram  
> **Scenario:** Student Intake, 3-Way Verification, Annex 4 Compilation, and Transmittal Milestones  
> **Standard:** UML 2.5 Timing Specification

---

## 1. Purpose

The Timing Diagram shows the lifecycle state transitions and strict duration constraints across the Staff Coordinator timeline: student intake validation, 3-way tripartite verification, Annex 4 compilation, and agency transmittal dispatch.

---

## 2. PlantUML Timing Diagram

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

robust "Registration Queue State" as RegState
robust "3-Way Verification Run" as VerifyState
robust "Annex 4 Document State" as DocState
robust "Agency Transmittal State" as TransState

@0
RegState is INTAKE_OPEN
VerifyState is IDLE
DocState is NONE
TransState is NONE

@14
RegState is VALIDATING
VerifyState is DATASET_INGESTION
DocState is NONE
TransState is NONE
note bottom of RegState : Intake Cutoff Reached (14-day window)

@16
RegState is LOCKED_ACCEPTED
VerifyState is CROSS_MATCHING
DocState is DRAFT
TransState is NONE
note bottom of VerifyState : 3-Way Cross-Matching & Discrepancy Resolution (<= 48h)

@18
RegState is LOCKED_ACCEPTED
VerifyState is FULLY_VERIFIED
DocState is SUBMITTED
TransState is NONE
note bottom of DocState : 1-Click Sync to Annex 4 & Executive Submission

@20
RegState is LOCKED_ACCEPTED
VerifyState is FULLY_VERIFIED
DocState is APPROVED
TransState is SCAN_UPLOADED
note bottom of DocState : Director Endorsement Granted (<= 48h SLA)

@23
RegState is ARCHIVED
VerifyState is ARCHIVED
DocState is TRANSMITTED
TransState is DISPATCHED_CHED
note bottom of TransState : Physical hardcopy delivered to CHED MMARO

@0 <-> @14 : {Student Intake Window = 14 days}
@14 <-> @16 : {Validation & 3-Way Cross-Matching <= 48 hours}
@16 <-> @18 : {Annex 4 Compilation & Excel Export <= 48 hours}
@18 <-> @20 : {Director Executive Endorsement <= 48 hours}
@20 <-> @23 : {Physical Signatures & CHED Transmittal <= 3 days}

legend right
  <b>📌 DIAGRAM LEGEND & TIMING NOTATION</b>
  robust : Discrete operational state lifeline
  @N : Time tick offset in days
  @A <-> @B : Strict interval SLA constraint
  note : Milestone event description
endlegend
@enduml
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Timing Concept | MinSU Implementation Context |
|---|---|---|---|
| Lifeline Wave | `robust "Name"` | Continuous state value of a domain entity | Registration Queue, Verification Run, Annex Document, Transmittal |
| State Label | `Lifeline is STATE` | Active discrete status during interval | `INTAKE_OPEN`, `CROSS_MATCHING`, `LOCKED_ACCEPTED` |
| Time Constraint | `@A <-> @B : {Label}` | Enforced operational deadline (SLA) | 48h verification SLA, 14-day registration window |
| Milestone Note | `note bottom of Lifeline` | Significant regulatory or operational event | Intake cutoff, Director endorsement, CHED dispatch |

---

## 4. Timeline Milestones & Service Level Agreements

- **Day 0 to 14**: Student application window remains open in the portal.
- **Day 14 to 16**: Staff validates student profiles, locks identity under RA 10173, and runs tripartite cross-matching (48h max).
- **Day 16 to 18**: Verified students are imported into Annex 4 and submitted to the Campus Director with Excel exports.
- **Day 18 to 20**: Campus Director executes 1-click executive approval (48h review SLA).
- **Day 20 to 23**: Staff prints physical copies, obtains wet-ink signatures, uploads the stamped PDF scan, and dispatches the transmittal to CHED MMARO.
