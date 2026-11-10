# Campus Director — Timing Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Timing Diagram  
> **Scenario:** Executive Review Turnaround SLA & Escalation Thresholds  
> **Standard:** UML 2.5 Timing Specification

---

## 1. Purpose

The Timing Diagram shows the lifecycle states of documents in the executive review queue and the strict 48-hour endorsement SLA monitored by the Campus Director.

---

## 2. PlantUML Timing Diagram

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

robust "Director Review Activity" as DirAct
robust "Document State" as DocState
concise "Turnaround SLA Status" as SLAState

@0
DirAct is Idle
DocState is SUBMITTED
SLAState is WithinTarget
note bottom of DocState : Document Enters Executive Queue

@12
DirAct is Inspecting
DocState is SUBMITTED
SLAState is WithinTarget

@24
DirAct is Idle
DocState is SUBMITTED
SLAState is WarningThreshold
note bottom of SLAState : 24h Advisory Reminder Emitted

@36
DirAct is Inspecting
DocState is SUBMITTED
SLAState is WarningThreshold

@42
DirAct is Endorsing
DocState is APPROVED
SLAState is TargetMet
note bottom of DocState : Approved at Hour 42 (Within 48h SLA)

@48
SLAState is TargetMet

@0 <-> @24 : {Optimal Review Window <= 24 hours}
@24 <-> @48 : {SLA Escalation Window <= 24 hours}
@0 <-> @42 : {Actual Turnaround Duration = 42 hours}
@0 <-> @48 : {Hard Policy SLA Limit = 48 hours}

legend right
  <b>📌 DIAGRAM LEGEND & TIMING NOTATION</b>
  robust : Discrete operational state lifeline
  concise : Status bar indicating condition / SLA
  @N : Time tick offset in hours
  @A <-> @B : Strict interval SLA constraint
endlegend
@enduml
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Timing Concept | MinSU Implementation Context |
|---|---|---|---|
| Lifeline Wave | `robust "Name"` | Continuous state value of an entity | Director Activity, Document Status |
| State Label | `Lifeline is STATE` | Active discrete status during interval | `IDLE`, `INSPECTING`, `SUBMITTED`, `APPROVED` |
| SLA State Bar | `concise "Name"` | Qualitative operational condition | `WithinTarget`, `WarningThreshold`, `TargetMet` |
| Time Constraint | `@A <-> @B : {Label}` | Enforced operational deadline (SLA) | 48-hour maximum director review limit |

---

## 4. Timeline Milestones & Turnaround Constraints

- **Hour 0**: Document transitions to `SUBMITTED`; SLA countdown begins on the Director dashboard.
- **Hour 24**: System emits an amber warning badge if the document remains unreviewed.
- **Hour 42**: Director inspects grantee rosters, verifies zero discrepancies, and clicks "Approve Annex".
- **Hour 48**: Hard policy SLA ceiling; any document unreviewed at 48 hours is flagged as overdue in `/analytics`.
