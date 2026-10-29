# System Admin — Sequence Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Sequence Diagram  
> **Scenario:** Modifying User Institutional Role & Audit Trail Generation

---

## 1. Purpose

The Sequence Diagram shows the messages exchanged during an account role change. It traces validation, database modification, and audit log generation in chronological order.

---

## 2. Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Admin as System Admin
    participant UI as Users Dashboard UI
    participant Middleware as Next.js RBAC Guard
    participant API as /api/users/[id] Route
    participant Prisma as Prisma ORM Client
    participant Audit as Audit Log Service
    participant DB as PostgreSQL Database

    %% ─── 📌 VISUAL LEGEND ───
    Note over Admin,DB: ─── 📌 DIAGRAM LEGEND: Solid Line (->>) = Request/Command | Dashed Line (-->>) = Response/Data | Rect = Phase Boundary ───


    Admin->>UI: Selects user and chooses new Role: DIRECTOR
    Admin->>UI: Clicks "Save Role Changes"
    UI->>Middleware: PATCH /api/users/usr_123 { role: "DIRECTOR" }
    
    activate Middleware
    Middleware->>Middleware: Verify session cookie & ensure role == SYSTEM_ADMIN
    alt Unauthorized
        Middleware-->>UI: 403 Forbidden (Admin privileges required)
        UI-->>Admin: Show error notification toast
    else Authorized
        Middleware->>API: Forward authenticated request
        activate API
        
        API->>Prisma: Fetch existing user by ID (usr_123)
        Prisma->>DB: SELECT * FROM users WHERE id = 'usr_123'
        DB-->>Prisma: Return existing User row (role: STAFF)
        
        API->>Prisma: Update user role in database transaction
        activate Prisma
        Prisma->>DB: UPDATE users SET role = 'DIRECTOR' WHERE id = 'usr_123'
        DB-->>Prisma: Update acknowledged
        
        API->>Audit: logAuditEvent(actorId, "ROLE_UPDATED", "USER", "usr_123", { from: "STAFF", to: "DIRECTOR" })
        activate Audit
        Audit->>DB: INSERT INTO audit_log (actorId, action, entity, entityId, details)
        DB-->>Audit: Confirm audit record inserted
        deactivate Audit
        
        deactivate Prisma
        API-->>UI: 200 OK { success: true, user: { id: "usr_123", role: "DIRECTOR" } }
        deactivate API
        
        UI-->>Admin: Display success toast and update badge to "DIRECTOR"
    end
    deactivate Middleware

```

---

## 3. Diagram Legend & Symbol Guide

| Visual / Symbol | Element Type | Technical Role | MinSU DocTrack Context |
|---|---|---|---|
| 👤 `actor` | Human Actor | External user role triggering system operations | Student Applicant, Staff Coordinator, Campus Director, Accounting Officer |
| 🔲 `participant` | System Component | Internal software subsystem or persistence boundary | Web UI, API Endpoint, Workflow Engine, Prisma/PostgreSQL, PDF Compiler |
| ──▶ `->>` | Solid Arrow | Synchronous invocation or command message | Submitting forms, verifying tokens, invoking database writes |
| - - ▷ `-->>` | Dashed Arrow | Return response or data payload | Confirmation slips, tracking codes, PDF binary buffers, query results |
| 🔲 `activate / deactivate` | Activation Lifeline | Period during which a component executes logic | Active request execution on API controllers or PDF engines |
| 🔲 `alt / else` | Conditional Fragment | Decision tree handling alternative workflow paths | Approval vs. Return branching, SLA compliance checks |


---

## 4. Sequence Steps

1. Admin selects a user on the dashboard and chooses a new role.
2. Admin submits the role modification.
3. Edge middleware verifies that the session belongs to a `SYSTEM_ADMIN`.
4. API loads the current user record to verify existence.
5. Database updates the user role to `DIRECTOR`.
6. Audit Log Service writes an immutable record capturing the role transition.
7. System returns confirmation to the UI and updates the badge.
