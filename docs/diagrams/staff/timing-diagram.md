# Staff Coordinator — Timing Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Timing Diagram  
> **Scenario:** Annex 2 Application Call Lifecycle & Annex 1 Compilation Milestones  
> **Standard:** UML 2.5 Timing Specification

---

## 1. Purpose

The Timing Diagram shows the lifecycle states of an Annex 2 applicant call, application evaluations, and the subsequent Annex 1 compilation schedule across semester deadlines.

---

## 2. PlantUML Timing Diagram

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

robust "Applicant Call State" as CallState
robust "Student Submissions" as AppsState
robust "Annex 1 Document State" as Annex1State

@0
CallState is PUBLISHED
AppsState is Receiving
Annex1State is None

@14
CallState is CLOSED
AppsState is Evaluating
Annex1State is None
note bottom of CallState : Call Deadline Reached (14-day window)

@18
CallState is CLOSED
AppsState is Finalized
Annex1State is DRAFT
note bottom of Annex1State : Staff Compiles Accepted Grantees

@21
CallState is COMPILED
AppsState is Finalized
Annex1State is SUBMITTED
note bottom of Annex1State : Submitted for Director Review

@0 <-> @14 : {Application Window = 14 days}
@14 <-> @18 : {Staff Evaluation <= 4 days}
@18 <-> @21 : {Annex 1 Compilation <= 3 days}
@0 <-> @21 : {Total Intake to Submission = 21 days}

legend right
  <b>📌 DIAGRAM LEGEND & TIMING NOTATION</b>
  robust : Discrete operational state lifeline
  concise : Status bar indicating condition / SLA
  @N : Time tick offset in days
  @A <-> @B : Strict interval SLA constraint
endlegend

@enduml
```

---

## 3. Diagram Legend & Symbol Guide

| Notation / Element | Type / Syntax | Temporal Role | MinSU Operational Application |
|---|---|---|---|
| `robust "Lifeline"` | Discrete State Lifeline | Tracks operational state transitions over time | `CallState` (Applicant Call), `AppsState` (Submissions), `Annex1State` (Compilation) |
| `@N` | Time Tick Offset | Calendar day or elapsed duration marker | `@0` (Publication), `@14` (Intake cutoff), `@21` (Executive submission) |
| `@A <-> @B : {Rule}` | Time Constraint Interval | Hard institutional deadline or turnaround window | 14-day student intake window, 4-day staff evaluation, 3-day Annex 1 compile |
| `note bottom of ...` | Event Milestone Callout | Operational trigger annotation | Call deadline reached, accepted grantees compiled, director review ingress |

---

## 4. Timeline & Milestones Table

| Milestone | Time (Days) | Call State | Application State | Annex 1 State | Constraint |
|---|---|---|---|---|---|
| **Call Publication** | `T + 0d` | `PUBLISHED` | `Receiving` | `None` | Open portal accepting applications. |
| **Call Deadline** | `T + 14d` | `CLOSED` | `Evaluating` | `None` | Applications close; staff evaluates proofs. |
| **Grantees Selected** | `T + 18d` | `CLOSED` | `Finalized` | `DRAFT` | Staff accepts qualified student records. |
| **Annex 1 Submitted** | `T + 21d` | `COMPILED` | `Finalized` | `SUBMITTED` | Master list submitted for executive endorsement. |
