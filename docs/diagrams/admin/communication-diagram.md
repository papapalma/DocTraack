# System Admin — Communication Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Communication Diagram  
> **Scenario:** Account Deactivation and Active Session Revocation  
> **Standard:** UML 2.5 Communication Specification

---

## 1. Purpose

The Communication Diagram shows the objects involved when an Administrator deactivates an account and revokes active sessions. It highlights object links with numbered message sequences.

---

## 2. Mermaid Communication Diagram

```mermaid
flowchart LR
    classDef actorStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24
    classDef objStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24

    Admin["admin : SystemAdmin"]
    UI["ui : UsersManagementPage"]
    Controller["controller : UserController"]
    UserObj["targetUser : User"]
    SessionObj["sessions : Session"]
    AuditObj["audit : AuditService"]
    DBAdapter["db : PrismaClient"]

    Admin -->|"1. clickDeactivate(userId)"| UI
    UI -->|"2. PATCH /api/users/:userId/deactivate"| Controller
    Controller -->|"3. updateActiveStatus(false)"| UserObj
    Controller -->|"4. deleteActiveSessions(userId)"| SessionObj
    Controller -->|"5. logAuditEvent(USER_DEACTIVATED)"| AuditObj
    Controller -->|"6. commitTransaction()"| DBAdapter
    DBAdapter -->|"7. confirmDeactivation()"| Controller
    Controller -->|"8. 200 OK (User Deactivated)"| UI
    UI -->|"9. displayDeactivatedBadge()"| Admin

    class Admin actorStyle
    class UI,Controller,UserObj,SessionObj,AuditObj,DBAdapter objStyle

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Node["Node : Subsystem Component"]:::legNode
        L_Msg["Link: N: methodName(args)"]:::legMsg
        L_Node -->|Call Sequence| L_Msg
    end
    classDef legNode fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legMsg fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| Element | Format / Syntax | Technical Meaning | MinSU Implementation Context |
|---|---|---|---|
| Subsystem Node | `[N: name : Class]` | Structural software participant | Controllers, Workflow Engines, Prisma Client, Storage Adapters |
| Link Connector | `-- "..." -->` | Directed communication channel | HTTP request, RPC method call, or database query |
| Numbered Prefix | `1:`, `2:`, `10:` | Chronological message sequence number | Sequential execution order from client event to persistence and UI update |
| Method Signature | `methodName(params)` | Invoked operation contract | `verifyRole(token)`, `checkVariance()`, `writeAuditLog()` |
| 🟢 Green Tone | `#F1F8F1` / `#1B5E20` | Core Subsystem Component | Institutional controllers, persistence adapters, and business engines |
| 🟡 Gold Tone | `#FFF1C2` / `#B88A00` | Guard & Dispatch Relay | Access guards, validation checks, and notification dispatchers |


---

## 4. PlantUML Communication Diagram

```plantuml
@startuml
skinparam objectBackgroundColor #FFFFFF
skinparam objectBorderColor #1B5E20

object "admin : SystemAdmin" as Admin
object "ui : UsersPage" as UI
object "ctl : UserController" as Ctl
object "usr : User" as Usr
object "sess : Session" as Sess
object "audit : AuditService" as Audit
object "db : PrismaClient" as DB

Admin -- UI : 1: clickDeactivate()\n9: renderBadge()
UI -- Ctl : 2: dispatchPatch()
Ctl -- Usr : 3: setActive(false)
Ctl -- Sess : 4: purgeSessions()
Ctl -- Audit : 5: logEvent()
Ctl -- DB : 6: commitTransaction()\n7: returnSuccess()
Ctl -- UI : 8: return200()

@enduml
```

---

## 5. Numbered Message Steps

1. Admin clicks "Deactivate User" in the user management interface.
2. UI submits the `PATCH` request to the backend.
3. Controller sets `active = false` on the target `User` instance.
4. Controller deletes all active sessions associated with the user.
5. Controller logs the deactivation event with the target user ID.
6. Controller executes the database transaction via Prisma.
7. Database confirms commit.
8. API returns HTTP 200 OK.
9. UI updates the user status badge to red ("Inactive").
