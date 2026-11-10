# Campus Director — Class Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Class Diagram  
> **Standard:** UML 2.5 Class Specification

---

## 1. Purpose

The Class Diagram shows the domain models, attributes, operations, and relationships governing executive review, 1-click approvals, returns with comments, verification oversight, certificate endorsements, and turnaround analytics.

---

## 2. Mermaid Class Diagram

```mermaid
classDiagram
    direction TB

    class DocumentStatus {
        <<enumeration>>
        DRAFT
        SUBMITTED
        RETURNED
        APPROVED
        SENT_TO_AGENCY
        ARCHIVED
    }

    class Document {
        +String id
        +String annexTypeId
        +String title
        +DocumentStatus status
        +Json formData
        +String fileUrl
        +String createdById
        +DateTime createdAt
        +DateTime updatedAt
        +approve(directorId) StatusHistory
        +returnWithNotes(directorId, comment) StatusHistory
        +isReviewable() Boolean
    }

    class VerificationRun {
        +String id
        +String executedById
        +DateTime runDate
        +Int matchedCount
        +Int discrepancyCount
        +Boolean directorOversightApproved
        +reviewDiscrepancySummary() Json
        +approveVerificationCohort(directorId) Void
    }

    class ExecutiveAnalytics {
        +Float averageTurnaroundHours
        +Int approvedCount
        +Int returnedCount
        +Float totalDisbursedPHP
        +computeTurnaroundVelocity() Float
        +getDisbursementMetrics() Json
    }

    class CertificateTemplate {
        +String id
        +String campusId
        +Json signatories
        +Boolean directorEndorsed
        +endorseTemplate(directorId) Void
    }

    class StatusHistory {
        +String id
        +String documentId
        +DocumentStatus fromStatus
        +DocumentStatus toStatus
        +String actorId
        +String comment
        +DateTime createdAt
        +calculateDuration(nextTimestamp) Duration
    }

    class Comment {
        +String id
        +String documentId
        +String authorId
        +String body
        +DateTime createdAt
        +attachFeedback(docId, notes) Comment
    }

    class Announcement {
        +String id
        +String title
        +String content
        +String audience
        +Boolean pinned
        +publishCampusAnnouncement(directorId) Announcement
    }

    class User {
        +String id
        +String name
        +String email
        +String role
        +Boolean twoFactorEnabled
    }

    Document "1" *-- "0..*" StatusHistory : tracks lifecycle
    Document "1" *-- "0..*" Comment : receives executive feedback
    Document "1" -- "0..1" VerificationRun : validates grantees against
    Document "1" -- "0..1" CertificateTemplate : references for awards
    User "1" -- "0..*" Document : approves / returns as director
    User "1" -- "0..*" VerificationRun : oversees
    User "1" -- "0..*" Announcement : broadcasts
    User "1" ..> ExecutiveAnalytics : inspects

    %% ─── 📌 VISUAL LEGEND ───
    note "<b>📌 DIAGRAM LEGEND & UML NOTATION</b>\n+ Public Attribute / Operation\n- Private / Internal Field\n*-- Strong Composition (Cascade Delete)\no-- Aggregation (Reference)\n-- Multiplicity Association\n..> Dependency / State Transition\n&lt;&lt;enumeration&gt;&gt; Strict Enum Domain"
```

---

## 3. Diagram Legend & Symbol Guide

| Symbol / UML Notation | Meaning & Syntax | Technical Function | MinSU Domain Example |
|---|---|---|---|
| `+` | Public Visibility | Readable attribute or callable method | `+approve()`, `+returnWithNotes()`, `+endorseTemplate()` |
| `-` | Private Visibility | Encapsulated field | Sensitive session tokens, internal metrics |
| `<<enumeration>>` | Enum Classifier | Strict closed set of categorical values | `DocumentStatus` (`SUBMITTED`, `APPROVED`, `RETURNED`) |
| `*--` | Strong Composition | Lifecycle containment (child deleted on parent deletion) | `Document *-- StatusHistory`, `Document *-- Comment` |
| `--` | Multiplicity Association | Association relationship between domain classes | One Director oversees many verification runs and documents |
| `..>` | Dependency | Usage or transition relationship | Director inspects `ExecutiveAnalytics` calculations |

---

## 4. Operations & Domain Rules

- `approve()` transitions document status to `APPROVED`, writes an immutable `StatusHistory` record, and notifies the preparer.
- `returnWithNotes()` transitions document status to `RETURNED`, requires a mandatory feedback comment, and unlocks the draft for revision.
- `approveVerificationCohort()` signs off on cross-matching accuracy before official Annex 4 submission.
- `endorseTemplate()` signs off on official signatories and layout dimensions for Annex 10 certificate generation.
