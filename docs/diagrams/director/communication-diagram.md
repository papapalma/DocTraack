# Campus Director — Communication Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Communication Diagram  
> **Scenario:** Document Endorsement, Verification Sign-Off, and Notification Collaboration  
> **Standard:** UML 2.5 Communication Specification

---

## 1. Purpose

The Communication Diagram shows the structural links and numbered message invocations during an executive document endorsement, verification sign-off, and notification dispatch.

---

## 2. Mermaid Communication Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef actorStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef objStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;

    Director["director : CampusDirector"]:::actorStyle
    UI["ui : ReviewQueueView"]:::objStyle
    VerifyMod["verify : VerificationOversight"]:::objStyle
    Service["service : EndorsementService"]:::objStyle
    Doc["doc : Document"]:::objStyle
    History["history : StatusHistory"]:::objStyle
    Notif["notif : NotificationService"]:::objStyle
    Audit["audit : AuditService"]:::objStyle
    DB["db : PrismaClient"]:::objStyle

    %% Object Links and Numbered Messages
    Director ---|1: approveDocument(docId)| UI
    UI ---|2: verifyZeroDiscrepancies(runId)| VerifyMod
    VerifyMod ---|3: confirmCohortClean()| UI
    UI ---|4: POST /api/documents/docId/approve| Service
    Service ---|5: lockAndSetStatus(APPROVED)| Doc
    Service ---|6: createTransitionEntry(SUBMITTED, APPROVED)| History
    Service ---|7: dispatchAlert(preparerId, 'Approved')| Notif
    Service ---|8: logAuditEvent(DOCUMENT_APPROVED)| Audit
    Service ---|9: executeAtomicTransaction()| DB
    DB ---|10: confirmTransactionCommit()| Service
    Service ---|11: 200 OK (Endorsement Confirmed)| UI
    UI ---|12: refreshQueueAndShowToast()| Director

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
| `[Object]` | `["instance : Class"]` | Named runtime instance participating in flow | `director`, `verify : VerificationOversight`, `db : PrismaClient` |
| `---` | Association Line | Structural communication link between objects | Connects Director UI to Endorsement Service |
| `N: method()` | Sequence Call Number | Chronological order and message invocation | `1: approveDocument()`, `2: verifyZeroDiscrepancies()`, `5: lockAndSetStatus()` |
| 🟢 Green Tone | `#F1F8F1` / `#1B5E20` | Operational Actor / Authorized Endpoint | Authenticated Campus Director executing executive decisions |

---

## 4. Message Invocation Sequence

1. Director reviews the pending document and clicks "Approve Annex".
2. UI verifies that the associated 3-way verification cohort has zero unresolved discrepancies.
3. Verification module confirms that all grantees are validated.
4. UI calls the endorsement route on the server.
5. Endorsement service updates status to `APPROVED` and locks the record against edits.
6. Service records the transition in `StatusHistory`.
7. Notification service sends an in-app alert to the preparer.
8. Audit service records an immutable audit log entry.
9. Database commits all modifications inside a single atomic `$transaction`.
10. UI removes the document card from the queue and displays a green confirmation toast.
