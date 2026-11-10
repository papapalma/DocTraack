# Campus Director — Sequence Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Sequence Diagram  
> **Scenario:** Executive Review, Endorsement, and Return Decisions  
> **Standard:** UML 2.5 Sequence Specification

---

## 1. Purpose

The Sequence Diagram shows the messages exchanged in chronological order when the Campus Director reviews, approves, or returns a submitted Annex document. All conditional decisions evaluate strictly to binary Yes and No paths.

---

## 2. Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Director as Campus Director
    participant UI as Review Queue UI (/review)
    participant Guard as RBAC Guard
    participant API as Document Action API
    participant Prisma as Prisma ORM Client
    participant Notifier as Notification Service
    participant Audit as Audit Log Service
    participant DB as PostgreSQL Database

    %% ─── 📌 VISUAL LEGEND ───
    Note over Director,DB: ─── 📌 DIAGRAM LEGEND: Solid Line (->>) = Request/Command | Dashed Line (-->>) = Response/Data | Rect = Phase Boundary ───

    Director->>UI: Selects pending document from /review queue
    UI->>API: GET /api/documents/:id (Fetch metadata, grantee list, calculation totals)
    API-->>UI: 200 OK (Document Payload & Verification Status)
    UI-->>Director: Render interactive review modal with PDF preview

    alt Does Director Approve Document? -- Yes
        Director->>UI: Clicks "Approve Annex"
        UI->>Guard: POST /api/documents/:id/approve
        activate Guard
        Guard->>Guard: Verify session token & check role == DIRECTOR
        
        alt Is User Authorized as Director? -- Yes
            Guard->>API: Forward approval request
            activate API
            API->>Prisma: $transaction(UPDATE status = 'APPROVED', INSERT status_history)
            activate Prisma
            Prisma->>DB: Commit document status and history row
            DB-->>Prisma: Transaction confirmed
            deactivate Prisma

            API->>Notifier: notifyPreparer(preparerId, "Document Approved")
            Notifier->>DB: INSERT INTO notifications
            API->>Audit: logAuditEvent(directorId, "DOCUMENT_APPROVED", docId)
            Audit->>DB: INSERT INTO audit_log
            API-->>UI: 200 OK { success: true, status: "APPROVED" }
            deactivate API
            UI-->>Director: Display green confirmation toast & refresh queue
        else Is User Authorized as Director? -- No
            Guard-->>UI: 403 Forbidden (Unauthorized signatory)
            UI-->>Director: Display access denied alert
        end
        deactivate Guard

    else Does Director Approve Document? -- No
        Director->>UI: Clicks "Return Document"
        UI-->>Director: Display Return Confirmation modal with mandatory comments
        Director->>UI: Enters required revision instructions and clicks "Confirm Return"
        UI->>API: POST /api/documents/:id/return { comments }
        activate API
        API->>Prisma: $transaction(UPDATE status = 'RETURNED', INSERT comment, INSERT status_history)
        activate Prisma
        Prisma->>DB: Commit return transaction
        DB-->>Prisma: Transaction confirmed
        deactivate Prisma

        API->>Notifier: notifyPreparer(preparerId, "Document Returned: Revisions Required")
        Notifier->>DB: INSERT INTO notifications
        API->>Audit: logAuditEvent(directorId, "DOCUMENT_RETURNED", docId)
        Audit->>DB: INSERT INTO audit_log
        API-->>UI: 200 OK { success: true, status: "RETURNED" }
        deactivate API
        UI-->>Director: Display return confirmation toast & refresh queue
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual / Symbol | Element Type | Technical Role | MinSU DocTrack Context |
|---|---|---|---|
| `Actor` | Human User | Initiator of operational procedures | Campus Director executing executive reviews |
| `Participant` | System Component | Boundary, controller, or data store | Review UI, RBAC Guard, Prisma Client, PostgreSQL |
| `->>` | Synchronous Message | Command or method invocation | Approve document, verify token, notify author |
| `-->>` | Return Message | Response data or confirmation payload | Status payload, HTTP 200 OK confirmation |
| `alt / else` | Conditional Frame | Guarded execution path (**Yes** / **No**) | Does Director Approve? Yes -> Approve; No -> Return |

---

## 4. Execution Sequence Steps

1. Director navigates to `/review` and selects a pending document.
2. System displays structured tables, fiscal math totals, and 3-way verification badges.
3. If Director approves (**Yes**), system verifies authorization, marks document `APPROVED`, and alerts the preparer.
4. If Director returns (**No**), system prompts for required comments, marks document `RETURNED`, and unlocks the form for corrections.
