# Accounting Officer — Timing Diagram

> **Role:** `ACCOUNTING_OFFICER`  
> **Diagram Type:** Timing Diagram  
> **Scenario:** Financial Reconciliation, Zero-Variance Assertion, and Liquidation Deadlines  
> **Standard:** UML 2.5 Timing Specification

---

## 1. Purpose

The Timing Diagram shows the lifecycle states of financial documents, zero-variance calculation intervals, and liquidation deadlines mandated by CHED and university fiscal policies.

---

## 2. PlantUML Timing Diagram

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

robust "Accounting Officer Activity" as Accounting
robust "Financial Document State" as DocState
concise "CHED Liquidation Compliance" as Compliance

@0
Accounting is Idle
DocState is DRAFT
Compliance is ActiveWindow

@5
Accounting is Reconciling
DocState is DRAFT
Compliance is ActiveWindow
note bottom of Accounting : Line items reconciled (0.00 PHP Variance verified)

@7
Accounting is Ready
DocState is SUBMITTED
Compliance is ActiveWindow
note bottom of DocState : Submitted for Executive Review

@9
Accounting is Idle
DocState is APPROVED
Compliance is ActiveWindow
note bottom of DocState : 48h Director SLA Endorsement Granted

@12
DocState is UPLOADED
Compliance is GracePeriod
note bottom of DocState : Stamped wet-signed PDF uploaded

@14
DocState is TRANSMITTED
Compliance is Liquidated
note bottom of Compliance : Full CHED Liquidation Achieved (14-day window)

@15
Compliance is Closed

@0 <-> @7 : {Reconciliation & Balancing <= 7 days}
@7 <-> @9 : {Executive Review SLA <= 48 hours}
@9 <-> @14 : {Physical Signatures & Liquidation <= 5 days}
@0 <-> @14 : {Total Liquidation Window = 14 days}

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

| Visual Symbol | Syntax / Style | UML Timing Concept | MinSU Implementation Context |
|---|---|---|---|
| Lifeline Wave | `robust "Name"` | Continuous state value of an entity | Accounting Activity, Financial Document State |
| State Label | `Lifeline is STATE` | Active discrete status during interval | `IDLE`, `RECONCILING`, `DRAFT`, `SUBMITTED`, `APPROVED` |
| Compliance Bar | `concise "Name"` | Regulatory status during interval | `ActiveWindow`, `GracePeriod`, `Liquidated` |
| SLA Constraint | `@A <-> @B : {Label}` | Strict timing deadline or window | 14-day total liquidation window, 48h review SLA |

---

## 4. Timeline Milestones & Liquidation Deadlines

- **Day 0 to 5**: Accounting Officer ingests bank statements and verifies zero variance down to 0.00 Philippine Pesos.
- **Day 7**: Balanced financial annex submitted to Director review queue.
- **Day 9**: Campus Director endorses document within 48-hour SLA.
- **Day 12**: Wet-ink stamped physical document scan is uploaded.
- **Day 14**: Hard liquidation deadline; package dispatched to CHED and logged in outgoing transmittals.
