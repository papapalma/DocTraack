# System Admin — Communication Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Communication Diagram  
> **Scenario:** Account Deactivation, 2FA Reset, and Session Revocation Collaboration  
> **Standard:** UML 2.5 Communication Specification

---

## 1. Purpose

The Communication Diagram shows the structural links and numbered message invocations during administrative account deactivation, two-factor authentication secret reset, and active session revocation.

---

## 2. Mermaid Communication Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef actorStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef objStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;

    Admin["admin : SystemAdmin"]:::actorStyle
    UI["ui : UsersManagementPage"]:::objStyle
    Controller["controller : UserController"]:::objStyle
    TwoFactorMod["twoFactor : TwoFactorAdminService"]:::objStyle
    UserObj["targetUser : User"]:::objStyle
    SessionObj["sessions : Session"]:::objStyle
    AuditObj["audit : AuditService"]:::objStyle
    DBAdapter["db : PrismaClient"]:::objStyle

    %% Object Links and Numbered Messages
    Admin ---|1: resetUserTwoFactor(userId)| UI
    UI ---|2: PATCH /api/users/:userId/2fa-reset| Controller
    Controller ---|3: clearTwoFactorSecret()| TwoFactorMod
    Controller ---|4: updateAccountFlags(false)| UserObj
    Controller ---|5: revokeActiveSessions(userId)| SessionObj
    Controller ---|6: logAuditEvent(2FA_RESET)| AuditObj
    Controller ---|7: executeAtomicTransaction()| DBAdapter
    DBAdapter ---|8: confirmWriteSuccess()| Controller
    Controller ---|9: 200 OK (2FA Cleared)| UI
    UI ---|10: displaySuccessBadge()| Admin

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

| Visual Symbol | Syntax / Style | UML Communication Meaning | MinSU Implementation |
|---|---|---|---|
| `[Object]` | `["instance : Class"]` | Named runtime instance participating in flow | `admin`, `twoFactor : TwoFactorAdminService`, `db : PrismaClient` |
| `---` | Association Line | Structural communication link between objects | Connects Admin UI to User Controller |
| `N: method()` | Sequence Call Number | Chronological order and message invocation | `1: resetUserTwoFactor()`, `2: PATCH /reset`, `6: logAuditEvent()` |
| 🟢 Green Tone | `#F1F8F1` / `#1B5E20` | Administrative Actor / Authorized Endpoint | Authenticated System Administrator executing security commands |

---

## 4. Message Invocation Sequence

1. Administrator selects an account and clicks "Reset 2FA".
2. UI submits the patch request to `/api/users/:id/2fa-reset`.
3. Controller invokes the two-factor module to clear the stored TOTP secret.
4. Controller sets `twoFactorEnabled` to false on the target user record.
5. Controller revokes all active session tokens for the target user.
6. Audit service creates an immutable audit record documenting the action.
7. Database commits all modifications inside a single atomic transaction.
8. Controller returns HTTP 200 OK to the client.
9. UI renders a success confirmation toast on the administrator workstation.
