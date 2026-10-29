# Campus Director — Class Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Class Diagram  
> **Standard:** UML 2.5 Class Specification

---

## 1. Purpose

The Class Diagram shows the domain models, attributes, operations, and relationships governing executive review, endorsement, and turnaround analytics.

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
        RESUBMITTED
        APPROVED
        UPLOADED
        TRANSMITTED
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
    }

    class AnnexType {
        +String id
        +Int number
        +String name
        +Json formSchema
    }

    class User {
        +String id
        +String name
        +String email
        +Role role
        +Boolean active
    }

    class Notification {
        +String id
        +String userId
        +String title
        +String message
        +String link
        +Boolean read
    }

    Document "1" *-- "0..*" StatusHistory : records transitions
    Document "1" *-- "0..*" Comment : attaches feedback
    Document "1" -- "1" AnnexType : instances of
    Document "1" -- "1" User : created by preparer
    StatusHistory "1" -- "1" User : endorsed by director
    User "1" -- "0..*" Notification : receives alert
    Document ..> DocumentStatus : has

    %% ─── 📌 VISUAL LEGEND ───
    note "<b>📌 DIAGRAM LEGEND & UML NOTATION</b>\n+ Public Attribute / Operation\n- Private / Internal Field\n*-- Strong Composition (Cascade Delete)\no-- Aggregation (Reference)\n-- Multiplicity Association\n..> Dependency / State Transition\n&lt;&lt;enumeration&gt;&gt; Strict Enum Domain"

```

---

## 3. Diagram Legend & Symbol Guide

| Symbol / UML Notation | Meaning & Syntax | Technical Function | MinSU Domain Example |
|---|---|---|---|
| `+` | Public Visibility | Readable attribute or callable method | `+id`, `+title`, `+submitDocument()`, `+validateZeroVariance()` |
| `-` | Private Visibility | Encapsulated field | Password hashes, system flags, sensitive session tokens |
| `<<enumeration>>` | Enum Classifier | Strict closed set of categorical values | `Role` (`DIRECTOR`, `STAFF`), `DocumentStatus` (`APPROVED`, `SUBMITTED`) |
| `*--` | Strong Composition | Lifecycle containment (child deleted on parent deletion) | `Document *-- StatusHistory`, `Document *-- Comment` |
| `o--` | Weak Aggregation | Referenced association without ownership | `Document o-- User` (Document references author) |
| `--` | Association (`"1" -- "*"`) | Multiplicity mapping between database entities | One user creates many documents or receives notifications |
| `..>` | Dependency | Usage or transition relationship | Domain model transitioning document lifecycle states |


---

## 4. Operations & Domain Rules

- `isReviewable()` returns true only when status equals `SUBMITTED` or `RESUBMITTED`.
- `approve()` transitions document status to `APPROVED` and generates a `StatusHistory` record.
- `returnWithNotes()` transitions document status to `RETURNED` and appends a `Comment`.
