# Campus Director — Object Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Object Diagram  
> **Scenario:** Runtime Snapshot of Annex 4 Endorsement & Verification Sign-Off  
> **Standard:** UML 2.5 Object Specification

---

## 1. Purpose

The Object Diagram shows a concrete runtime snapshot of an executive endorsement, 3-way verification sign-off, and status transition executed by the Campus Director.

---

## 2. Mermaid Object Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef objStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;

    directorObj["<u>director : User</u><br/>id = 'usr_dir_05'<br/>name = 'Dr. Dennis Capuyan'<br/>role = DIRECTOR<br/>twoFactorEnabled = true"]:::objStyle

    preparerObj["<u>preparer : User</u><br/>id = 'usr_stf_12'<br/>name = 'Corazon Mendoza'<br/>role = STAFF<br/>active = true"]:::objStyle

    annex4Doc["<u>annex4Doc : Document</u><br/>id = 'doc_annex4_701'<br/>title = 'Annex 4 - TDP New Billing Statement'<br/>status = APPROVED<br/>createdById = 'usr_stf_12'<br/>updatedAt = '2026-10-29T14:30:00Z'"]:::objStyle

    verifyRun["<u>verifiedCohort : VerificationRun</u><br/>id = 'run_2026_ay1'<br/>matchedCount = 146<br/>discrepancyCount = 0<br/>directorOversightApproved = true"]:::objStyle

    historyObj["<u>endorseHistory : StatusHistory</u><br/>id = 'hist_8801'<br/>documentId = 'doc_annex4_701'<br/>fromStatus = SUBMITTED<br/>toStatus = APPROVED<br/>actorId = 'usr_dir_05'<br/>createdAt = '2026-10-29T14:30:00Z'"]:::objStyle

    analyticsObj["<u>kpiMetric : ExecutiveAnalytics</u><br/>averageTurnaroundHours = 22.4<br/>approvedCount = 18<br/>slaCompliancePercent = 98.2"]:::objStyle

    notificationObj["<u>staffNotif : Notification</u><br/>id = 'notif_449'<br/>userId = 'usr_stf_12'<br/>title = 'Annex 4 Approved'<br/>message = 'Document doc_annex4_701 approved by Director.'<br/>read = false"]:::objStyle

    directorObj ---|endorses| annex4Doc
    directorObj ---|signs off| verifyRun
    annex4Doc ---|records transition| historyObj
    directorObj ---|creates| historyObj
    preparerObj ---|originally created| annex4Doc
    preparerObj ---|receives| notificationObj
    directorObj ---|monitors| analyticsObj

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Inst["<u>instanceName : ClassName</u><br/>attribute1 = value<br/>attribute2 = value"]:::legInst
        L_Link["Link: ---predicate---"]:::legLink
        L_Inst --> L_Link
    end
    classDef legInst fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legLink fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Format | UML Role | MinSU Instance Context |
|---|---|---|---|
| `<u>instance : Class</u>` | Underlined Identifier | Concrete runtime object in memory | Campus Director, verified cohort, approved Annex document |
| `attr = 'value'` | Key-Value Assignment | Concrete state of instance properties | `status = 'APPROVED'`, `directorOversightApproved = true` |
| `---predicate---` | Undirected Semantic Link | Association relationship at runtime | Director endorses document, signs off verification run |
| 🟢 Green Container | `#1B5E20` / `#F1F8F1` | Approved Domain Entity | Executive approval record with 22.4-hour turnaround velocity |

---

## 4. Runtime Object Attributes

- `director`: Authenticated executive with active two-factor authentication.
- `annex4Doc`: Official billing document transitioned from `SUBMITTED` to `APPROVED`.
- `verifiedCohort`: 3-way cross-matched student roster signed off with zero unresolved discrepancies.
- `endorseHistory`: Audit record capturing actor ID, timestamp, and transition state.
- `kpiMetric`: Performance calculation showing an average turnaround time of 22.4 hours (well within 48h SLA).
