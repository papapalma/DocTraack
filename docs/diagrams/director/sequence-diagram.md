# Campus Director — Sequence Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Sequence Diagram  
> **Scenario:** Document Endorsement & Rejection Message Sequences

---

## 1. Purpose

The Sequence Diagram shows the messages exchanged in chronological order when the Campus Director endorses or returns a submitted Annex document.

---

## 2. Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Director as Campus Director
    participant UI as Review Queue UI (/review)
    participant Guard as RBAC Middleware
    participant API as Document Action API
    participant Prisma as Prisma ORM Client
    participant Notifier as Notification Service
    participant Audit as Audit Log Service
    participant DB as PostgreSQL Database

    %% ─── 📌 VISUAL LEGEND ───
    Note over Director,DB: ─── 📌 DIAGRAM LEGEND: Solid Line (->>) = Request/Command | Dashed Line (-->>) = Response/Data | Rect = Phase Boundary ───


    Director->>UI: Clicks "Approve Annex" button on document doc_889
    UI->>Guard: POST /api/documents/doc_889/approve
    
    activate Guard
    Guard->>Guard: Verify session token & check role == DIRECTOR
    alt Non-Director Attempt
        Guard-->>UI: 403 Forbidden (Unauthorized signatory)
        UI-->>Director: Show authorization failure alert
    else Authorized
        Guard->>API: Dispatch endorsement action
        activate API
        
        API->>Prisma: Begin database transaction ($transaction)
        activate Prisma
        
        Prisma->>DB: UPDATE documents SET status = 'APPROVED' WHERE id = 'doc_889'
        DB-->>Prisma: Status updated to APPROVED
        
        Prisma->>DB: INSERT INTO status_history (doc_889, 'SUBMITTED', 'APPROVED', directorId)
        DB-->>Prisma: History recorded
        
        API->>Notifier: createNotification(preparerId, "Document Approved", "/documents/doc_889")
        activate Notifier
        Notifier->>DB: INSERT INTO notifications (userId, title, message, link)
        DB-->>Notifier: Notification persisted
        deactivate Notifier
        
        API->>Audit: logAuditEvent(directorId, "DOCUMENT_APPROVED", "DOCUMENT", "doc_889")
        activate Audit
        Audit->>DB: INSERT INTO audit_log (...)
        DB-->>Audit: Audit record stored
        deactivate Audit
        
        Prisma-->>API: Transaction committed successfully
        deactivate Prisma
        
        API-->>UI: 200 OK { success: true, newStatus: "APPROVED" }
        deactivate API
        
        UI-->>Director: Display green toast: "Annex Endorsed Successfully"
        UI->>UI: Remove document from active /review pending queue
    end
    deactivate Guard

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

## 4. Sequence Details

1. Director triggers endorsement for a pending document.
2. RBAC Guard verifies that the authenticated user possesses the `DIRECTOR` role.
3. API executes an atomic PostgreSQL transaction:
   - Updates document status to `APPROVED`.
   - Records the state transition in `status_history`.
   - Generates an in-app notification for the preparer (`STAFF` or `ACCOUNTING`).
   - Writes an immutable audit entry documenting the endorsement.
4. Transaction commits, and the UI removes the item from the pending list.
