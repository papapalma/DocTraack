# System Admin — Sequence Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Sequence Diagram  
> **Scenario:** Modifying User Role, 2FA Management, and Audit Trail Generation  
> **Standard:** UML 2.5 Sequence Specification

---

## 1. Purpose

The Sequence Diagram shows the messages exchanged in chronological order when the System Administrator updates an institutional user's role or resets 2FA security credentials. All decision branches evaluate strictly to binary Yes and No paths.

---

## 2. Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Admin as System Admin
    participant UI as Users Dashboard UI (/users)
    participant Middleware as Next.js RBAC Guard
    participant API as /api/users/[id] Route
    participant Prisma as Prisma ORM Client
    participant Audit as Audit Log Service
    participant DB as PostgreSQL Database

    %% ─── 📌 VISUAL LEGEND ───
    Note over Admin,DB: ─── 📌 DIAGRAM LEGEND: Solid Line (->>) = Request/Command | Dashed Line (-->>) = Response/Data | Rect = Phase Boundary ───

    Admin->>UI: Selects user and chooses new Role: DIRECTOR
    Admin->>UI: Clicks "Save Role Changes"
    UI->>Middleware: PATCH /api/users/:id { role: "DIRECTOR" }
    
    activate Middleware
    Middleware->>Middleware: Verify session cookie & ensure role == SYSTEM_ADMIN

    alt Is User Authorized as System Admin? -- Yes
        Middleware->>API: Forward authenticated request
        activate API
        
        API->>Prisma: Fetch existing user by ID
        Prisma->>DB: SELECT * FROM users WHERE id = :id
        DB-->>Prisma: Return existing User row (role: STAFF)
        
        API->>Prisma: $transaction(UPDATE role, INSERT audit_log)
        activate Prisma
        Prisma->>DB: UPDATE users SET role = 'DIRECTOR' WHERE id = :id
        DB-->>Prisma: Update acknowledged
        
        API->>Audit: logAuditEvent(actorId, "USER_ROLE_UPDATED", "USER", :id, { from: "STAFF", to: "DIRECTOR" })
        activate Audit
        Audit->>DB: INSERT INTO audit_log (actorId, action, entity, entityId, details)
        DB-->>Audit: Confirm audit record inserted
        deactivate Audit
        
        deactivate Prisma
        API-->>UI: 200 OK { success: true, updatedRole: "DIRECTOR" }
        deactivate API
        UI-->>Admin: Display green toast: "User role updated successfully"
    else Is User Authorized as System Admin? -- No
        Middleware-->>UI: 403 Forbidden (System Administrator role required)
        UI-->>Admin: Display access denied alert banner
    end
    deactivate Middleware
```

---

## 3. Diagram Legend & Symbol Guide

| Visual / Symbol | Element Type | Technical Role | MinSU DocTrack Context |
|---|---|---|---|
| `Actor` | Human User | Initiator of operational procedures | System Administrator provisioning user accounts |
| `Participant` | System Component | Boundary, controller, or data store | Users UI, RBAC Guard, Prisma ORM, PostgreSQL DB |
| `->>` | Synchronous Message | Command or method invocation | Patch user, verify session, commit database write |
| `-->>` | Return Message | Response data or confirmation payload | Returns 200 OK update payload or 403 Forbidden |
| `alt / else` | Conditional Frame | Guarded execution path (**Yes** / **No**) | Is User Authorized? Yes -> update; No -> reject |

---

## 4. Execution Sequence Steps

1. Admin selects a user on `/users` and chooses a new role.
2. Admin clicks "Save Role Changes".
3. Middleware evaluates session identity.
4. If authorized as System Admin (**Yes**), system executes the update inside an atomic transaction with audit logging.
5. If unauthorized (**No**), system returns HTTP 403 Forbidden and displays an access denied warning.
