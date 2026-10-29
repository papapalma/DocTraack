# System Admin — Class Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Class Diagram  
> **Standard:** UML 2.5 Class Specification

---

## 1. Purpose

The Class Diagram shows the domain classes, attributes, methods, and relationships relevant to the System Administrator role.

---

## 2. Mermaid Class Diagram

```mermaid
classDiagram
    direction TB

    class Role {
        <<enumeration>>
        STAFF
        STUDENT
        DIRECTOR
        ACCOUNTING
        SYSTEM_ADMIN
    }

    class User {
        +String id
        +String name
        +String email
        +String passwordHash
        +Role role
        +Boolean active
        +String departmentId
        +DateTime createdAt
        +DateTime updatedAt
        +create(data) User
        +updateRole(newRole, adminId) User
        +deactivate(adminId) Boolean
        +hashPassword(plainText) String
    }

    class Session {
        +String id
        +String userId
        +String token
        +DateTime expiresAt
        +DateTime createdAt
        +revoke() Boolean
    }

    class AuditLog {
        +String id
        +String actorId
        +String action
        +String entity
        +String entityId
        +Json details
        +DateTime createdAt
        +record(actorId, action, entity, id, diff) AuditLog
        +filter(entity, fromDate, toDate) List~AuditLog~
    }

    class LandingPageConfig {
        +String id
        +Json publishedSections
        +Json draftSections
        +Boolean hasUnpublishedChanges
        +DateTime publishedAt
        +DateTime updatedAt
        +String updatedById
        +saveDraft(sections) Void
        +publishDraft(adminId) Void
    }

    User "1" -- "0..*" Session : owns
    User "1" -- "0..*" AuditLog : triggers as actor
    User "0..1" -- "0..*" LandingPageConfig : edits as updatedBy
    User ..> Role : has

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

## 4. Class Responsibilities

- **User**: Represents user identities and handles role transitions.
- **Session**: Manages cryptographic tokens with server-side expiry.
- **AuditLog**: Stores append-only records of actions and metadata diffs.
- **LandingPageConfig**: Maintains draft and published states for public portal content.
