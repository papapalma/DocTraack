# Staff Coordinator — Object Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Object Diagram  
> **Scenario:** Runtime Snapshot of Grantee Evaluation and Annex 1 Compilation  
> **Standard:** UML 2.5 Object Specification

---

## 1. Purpose

The Object Diagram shows a concrete runtime snapshot when the Staff Coordinator accepts a student application and compiles the record into an Annex 1 draft document.

---

## 2. Mermaid Object Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef objStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;

    staffObj["<u>staff : User</u><br/>id = 'usr_stf_20'<br/>name = 'Corazon Mendoza'<br/>role = STAFF<br/>active = true"]:::objStyle

    callObj["<u>call : ApplicantCall</u><br/>id = 'call_ay2026'<br/>title = 'TDP Call AY 2026-2027'<br/>isActive = true"]:::objStyle

    studentObj["<u>student : User</u><br/>id = 'usr_stu_55'<br/>name = 'Carlo Reyes'<br/>email = 'carlo.reyes@minsu.edu.ph'<br/>role = STUDENT"]:::objStyle

    appObj["<u>application : Application</u><br/>id = 'app_441'<br/>callId = 'call_ay2026'<br/>studentId = 'usr_stu_55'<br/>trackingCode = 'TDP-2026-K8L9'<br/>status = ACCEPTED<br/>reviewedById = 'usr_stf_20'"]:::objStyle

    annex1Obj["<u>annex1Doc : Document</u><br/>id = 'doc_annex1_draft'<br/>title = 'Annex 1 - TDP Master Grantee List'<br/>status = DRAFT<br/>createdById = 'usr_stf_20'"]:::objStyle

    staffObj ---|evaluates| appObj
    callObj ---|contains| appObj
    studentObj ---|submitted| appObj
    staffObj ---|compiles into| annex1Obj
    appObj ---|referenced in roster| annex1Obj

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

object "<u>staff : User</u>" as staff {
  id = "usr_stf_20"
  name = "Corazon Mendoza"
  role = STAFF
}

object "<u>call : ApplicantCall</u>" as call {
  id = "call_ay2026"
  title = "TDP Call AY 2026-2027"
  isActive = true
}

object "<u>student : User</u>" as student {
  id = "usr_stu_55"
  name = "Carlo Reyes"
  role = STUDENT
}

object "<u>application : Application</u>" as app {
  id = "app_441"
  trackingCode = "TDP-2026-K8L9"
  status = ACCEPTED
  reviewedById = "usr_stf_20"
}

object "<u>annex1Doc : Document</u>" as doc {
  id = "doc_annex1_draft"
  title = "Annex 1 - TDP Master Grantee List"
  status = DRAFT
  createdById = "usr_stf_20"
}

staff -- app : evaluates >
call -- app : receives >
student -- app : submitted >
staff -- doc : creates >
app -- doc : included in >

@enduml
```

---

## 5. Instance Values & Observations

- The application's `status` changes to `ACCEPTED` after Staff review.
- The `annex1Doc` instance aggregates all accepted grantee applications into its tabular `formData`.
