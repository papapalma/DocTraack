# Campus Director — Object Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Object Diagram  
> **Scenario:** Runtime Snapshot of Annex 1 Document Endorsement  
> **Standard:** UML 2.5 Object Specification

---

## 1. Purpose

The Object Diagram shows a concrete runtime snapshot of an Annex 1 document endorsement executed by the Campus Director.

---

## 2. Mermaid Object Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef objStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;

    directorObj["<u>director : User</u><br/>id = 'usr_dir_05'<br/>name = 'Dr. Dennis Capuyan'<br/>role = DIRECTOR<br/>active = true"]:::objStyle

    preparerObj["<u>preparer : User</u><br/>id = 'usr_stf_12'<br/>name = 'Staff Coordinator'<br/>role = STAFF<br/>active = true"]:::objStyle

    documentObj["<u>annex1Doc : Document</u><br/>id = 'doc_annex1_701'<br/>title = 'Annex 1 - TDP Grantee Master List'<br/>status = APPROVED<br/>createdById = 'usr_stf_12'<br/>updatedAt = 2026-10-29T14:30:00Z"]:::objStyle

    historyObj["<u>endorseHistory : StatusHistory</u><br/>id = 'hist_8801'<br/>documentId = 'doc_annex1_701'<br/>fromStatus = SUBMITTED<br/>toStatus = APPROVED<br/>actorId = 'usr_dir_05'<br/>createdAt = 2026-10-29T14:30:00Z"]:::objStyle

    notificationObj["<u>staffNotif : Notification</u><br/>id = 'notif_449'<br/>userId = 'usr_stf_12'<br/>title = 'Annex 1 Endorsed'<br/>message = 'Document doc_annex1_701 endorsed by Director.'<br/>read = false"]:::objStyle

    directorObj ---|endorses| documentObj
    documentObj ---|records transition| historyObj
    directorObj ---|creates| historyObj
    preparerObj ---|originally created| documentObj
    preparerObj ---|receives| notificationObj

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Inst["instanceName : ClassName<br/>attribute1 = value<br/>attribute2 = value"]:::legInst
        L_Link["Link: --predicate-->"]:::legLink
        L_Inst --> L_Link
    end
    classDef legInst fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legLink fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Format | UML Role | MinSU Instance Context |
|---|---|---|---|
| Instance Node | `instanceName : ClassName` | Concrete runtime instance in memory/DB | Active users, specific scholarship calls, concrete annex documents |
| Attribute Values | `attr = 'value'` | Concrete state of instance properties | `status = 'APPROVED'`, `trackingCode = 'TDP-2026-0192'`, `slotQuota = 250` |
| `-->|predicate|` | Directed Association Link | Concrete relationship between runtime objects | User compiles document, director endorses record, transmittal dispatches |
| Subgraph Boundary | `subgraph GroupName` | Domain grouping boundary | Active Users, Intake Instances, Compiled Annexes, Transmittal Audits |
| 🟢 Green Container | `#F1F8F1` / `#1B5E20` | Operational Domain Entities | Authenticated staff/director records and approved scholarship documents |
| 🟡 Gold Node | `#FFF1C2` / `#B88A00` | Financial & Security Linkages | Ledger documents and audit log event tracking |


---

## 4. PlantUML Object Diagram

```plantuml
@startuml
skinparam objectBackgroundColor #FFFFFF
skinparam objectBorderColor #1B5E20

object "<u>director : User</u>" as dir {
  id = "usr_dir_05"
  name = "Dr. Dennis Capuyan"
  role = DIRECTOR
  active = true
}

object "<u>preparer : User</u>" as prep {
  id = "usr_stf_12"
  name = "Staff Coordinator"
  role = STAFF
  active = true
}

object "<u>annex1Doc : Document</u>" as doc {
  id = "doc_annex1_701"
  title = "Annex 1 - TDP Grantee Master List"
  status = APPROVED
  createdById = "usr_stf_12"
}

object "<u>endorseHistory : StatusHistory</u>" as hist {
  id = "hist_8801"
  fromStatus = SUBMITTED
  toStatus = APPROVED
  actorId = "usr_dir_05"
}

object "<u>staffNotif : Notification</u>" as notif {
  id = "notif_449"
  userId = "usr_stf_12"
  title = "Annex 1 Endorsed"
}

dir -- doc : endorses >
dir -- hist : acts as actor >
doc -- hist : captures >
prep -- doc : prepared >
prep -- notif : notified by >

@enduml
```

---

## 5. Instance Values & Observations

- The document status reflects `APPROVED`.
- Foreign keys in `endorseHistory` tie the endorsement directly to `director` and `annex1Doc`.
- The notification targets `preparer` to prompt physical printing and scan upload.
