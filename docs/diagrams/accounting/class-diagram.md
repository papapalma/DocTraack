# Class Diagram: Accounting Officer Domain

## 1. Description
This class diagram models the object-oriented structure of the Accounting Officer domain. It defines entities that manage financial reports (Annex 6 Fund Utilization, Annex 7 Advice to Debit Account, Annex 8 Checks Issued, and Annex 9 Beneficiary Payroll). The model enforces Philippine Peso precision, double-entry balance rules, and approval state tracking.

## 2. ASD-STE100 Technical Specifications
- Keep all currency calculations aligned to two decimal places.
- Link each financial document to an accounting author user instance.
- Track all status modifications through immutable history records.
- Notify coordinators and directors during balance transitions.

## 3. Class Diagram (Mermaid)

```mermaid
classDiagram
    direction TB

    class User {
        +String id
        +String email
        +String name
        +Role role
        +DateTime createdAt
        +createDocument(type: AnnexType, title: String) Document
        +submitDocument(documentId: String) StatusHistory
    }

    class Document {
        +String id
        +String title
        +AnnexType annexType
        +DocumentStatus status
        +String createdById
        +Json metadata
        +DateTime createdAt
        +DateTime updatedAt
        +calculateTotal() Decimal
        +validateZeroVariance() Boolean
        +addComment(userId: String, text: String) Comment
    }

    class AnnexType {
        <<enumeration>>
        ANNEX_6
        ANNEX_7
        ANNEX_8
        ANNEX_9
    }

    class DocumentStatus {
        <<enumeration>>
        DRAFT
        SUBMITTED
        APPROVED
        RETURNED
        ARCHIVED
    }

    class StatusHistory {
        +String id
        +String documentId
        +DocumentStatus fromStatus
        +DocumentStatus toStatus
        +String changedById
        +String remarks
        +DateTime createdAt
    }

    class Comment {
        +String id
        +String documentId
        +String userId
        +String content
        +DateTime createdAt
    }

    class FinancialMetadata {
        +Decimal allocatedFund
        +Decimal disbursedAmount
        +Decimal remainingBalance
        +String checkNumber
        +String bankAccount
        +Int beneficiaryCount
        +verifyBalance() Boolean
    }

    class Notification {
        +String id
        +String userId
        +String title
        +String message
        +Boolean isRead
        +DateTime createdAt
        +markAsRead() void
    }

    User "1" --> "*" Document : creates
    User "1" --> "*" StatusHistory : records
    User "1" --> "*" Comment : writes
    User "1" --> "*" Notification : receives
    Document "1" *-- "1" AnnexType : categorizes
    Document "1" *-- "1" DocumentStatus : state
    Document "1" *-- "1" FinancialMetadata : encapsulates
    Document "1" o-- "*" StatusHistory : tracks
    Document "1" o-- "*" Comment : maintains

    %% ─── 📌 VISUAL LEGEND ───
    note "<b>📌 DIAGRAM LEGEND & UML NOTATION</b>\n+ Public Attribute / Operation\n- Private / Internal Field\n*-- Strong Composition (Cascade Delete)\no-- Aggregation (Reference)\n-- Multiplicity Association\n..> Dependency / State Transition\n&lt;&lt;enumeration&gt;&gt; Strict Enum Domain"

```

---

## 4. Diagram Legend & Symbol Guide

| Symbol / UML Notation | Meaning & Syntax | Technical Function | MinSU Domain Example |
|---|---|---|---|
| `+` | Public Visibility | Readable attribute or callable method | `+id`, `+title`, `+submitDocument()`, `+validateZeroVariance()` |
| `-` | Private Visibility | Encapsulated field | Password hashes, system flags, sensitive session tokens |
| `<<enumeration>>` | Enum Classifier | Strict closed set of categorical values | `Role` (`DIRECTOR`, `STAFF`), `DocumentStatus` (`APPROVED`, `SUBMITTED`) |
| `*--` | Strong Composition | Lifecycle containment (child deleted on parent deletion) | `Document *-- StatusHistory`, `Document *-- Comment` |
| `o--` | Weak Aggregation | Referenced association without ownership | `Document o-- User` (Document references author) |
| `--` | Association (`"1" -- "*"`) | Multiplicity mapping between database entities | One user creates many documents or receives notifications |
| `..>` | Dependency | Usage or transition relationship | Domain model transitioning document lifecycle states |


## 5. Entity Responsibilities
- **User (Accounting)**: Submits fund utilization ledgers and balance reconciliations.
- **Document**: Stores core financial metadata, Annex identifiers, and workflow progress.
- **FinancialMetadata**: Contains fund allocation, disbursement totals, check numbers, and recipient tallies.
- **StatusHistory**: Preserves audit trails of financial status changes with timestamps and user identifiers.
