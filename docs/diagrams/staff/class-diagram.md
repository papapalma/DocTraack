# Staff Coordinator — Class Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Class Diagram  
> **Standard:** UML 2.5 Class Specification

---

## 1. Purpose

The Class Diagram shows the domain models, attributes, operations, and relationships governing Staff operations, including document preparation, call management, and transmittal logging.

---

## 2. Mermaid Class Diagram

```mermaid
classDiagram
    direction TB

    class Document {
        +String id
        +String annexTypeId
        +String title
        +DocumentStatus status
        +Json formData
        +String fileUrl
        +String createdById
        +createDraft(annexNum, data) Document
        +saveDraft(data) Document
        +submitForReview(staffId) StatusHistory
        +uploadSignedScan(filePath) Void
    }

    class AnnexType {
        +String id
        +Int number
        +String name
        +Role[] creatorRoles
        +Json formSchema
    }

    class ApplicantCall {
        +String id
        +String title
        +String description
        +DateTime deadline
        +Json formSchema
        +Boolean isActive
        +String createdById
        +createCall(title, deadline, schema) ApplicantCall
        +closeCall() Void
        +compileIntoAnnex1() Document
    }

    class Application {
        +String id
        +String callId
        +String studentId
        +Json formData
        +String trackingCode
        +ApplicationStatus status
        +String reviewComment
        +accept(staffId) Void
        +reject(staffId, comment) Void
    }

    class Transmittal {
        +String id
        +String documentId
        +String sentById
        +String method
        +String recipient
        +String driveLink
        +String notes
        +DateTime sentAt
        +recordTransmittal(docId, recipient, link) Transmittal
    }

    class User {
        +String id
        +String name
        +Role role
    }

    Document "1" -- "1" AnnexType : conforms to
    Document "1" *-- "0..1" Transmittal : dispatched via
    ApplicantCall "1" *-- "0..*" Application : receives
    ApplicantCall "1" ..> Document : generates Annex 1 from accepted
    User "1" -- "0..*" Document : creates
    User "1" -- "0..*" ApplicantCall : manages
    User "1" -- "0..*" Transmittal : sends

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

- `createDraft()` instantiates an Annex form according to the `formSchema` in `AnnexType`.
- `compileIntoAnnex1()` aggregates accepted student records into a tabular Annex 1 draft.
- `uploadSignedScan()` sets `fileUrl` and changes status to `UPLOADED`.
- `recordTransmittal()` creates a `Transmittal` record and marks the document `TRANSMITTED`.
