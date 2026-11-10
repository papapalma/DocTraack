# Class Diagram

> **System:** MinSU DocTrack  
> **Diagram Type:** Class Diagram  
> **Standard:** UML 2.5 Class Specification

---

## 1. Purpose

The Class Diagram shows the domain models, attributes, operations, and relationships in the MinSU DocTrack persistence layer. It shows core documents, users, sessions, verification runs, announcements, landing CMS configs, and audit records.

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

    class ApplicationStatus {
        <<enumeration>>
        SUBMITTED
        UNDER_REVIEW
        ACCEPTED
        REJECTED
    }

    class User {
        +String id
        +String name
        +String email
        +String passwordHash
        +Role role
        +Boolean active
        +String departmentId
        +Json studentProfile
        +Boolean twoFactorEnabled
        +String twoFactorSecret
        +String[] twoFactorRecoveryCodes
        +String twoFactorType
        +Boolean authenticatorLocked
        +Boolean notifyAnnouncements
        +Boolean notifyPush
        +DateTime createdAt
        +DateTime updatedAt
        +verifyPassword(plainText) Boolean
        +validate2FACode(token) Boolean
    }

    class Session {
        +String id
        +String userId
        +String token
        +DateTime expiresAt
        +DateTime createdAt
        +isValid() Boolean
    }

    class AnnexType {
        +String id
        +Int number
        +String name
        +Role[] creatorRoles
        +Json formSchema
        +String pdfTemplate
    }

    class Document {
        +String id
        +String annexTypeId
        +String title
        +DocumentStatus status
        +Json formData
        +String fileUrl
        +String createdById
        +String departmentId
        +DateTime createdAt
        +DateTime updatedAt
        +submit() Boolean
        +approve() Boolean
        +returnWithNotes(notes) Boolean
    }

    class StatusHistory {
        +String id
        +String documentId
        +DocumentStatus fromStatus
        +DocumentStatus toStatus
        +String actorId
        +String comment
        +DateTime createdAt
    }

    class Comment {
        +String id
        +String documentId
        +String authorId
        +String body
        +DateTime createdAt
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
    }

    class ApplicantCall {
        +String id
        +String title
        +String description
        +Int batchNumber
        +DateTime startDate
        +DateTime deadline
        +Json formSchema
        +Boolean isActive
        +String createdById
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Application {
        +String id
        +String callId
        +String studentId
        +Int batchNumber
        +Json formData
        +String trackingCode
        +ApplicationStatus status
        +String reviewComment
        +String reviewedById
        +DateTime reviewedAt
        +String annex1DocumentId
        +DateTime submittedAt
    }

    class Notification {
        +String id
        +String userId
        +String title
        +String message
        +String link
        +Boolean read
        +DateTime createdAt
    }

    class AuditLog {
        +String id
        +String actorId
        +String action
        +String entity
        +String entityId
        +Json details
        +DateTime createdAt
    }

    class VerificationRun {
        +String id
        +Int runNumber
        +String title
        +String chedFileName
        +String registrarFileName
        +String systemDataSource
        +Int totalChedRows
        +Int totalRegistrarRows
        +Int totalSystemRows
        +Int fullyVerifiedCount
        +Int needsEncodingCount
        +Int notEnrolledCount
        +Int systemDiscrepancyCount
        +Int possibleMatchCount
        +Int enrolledNonScholarCount
        +String createdById
        +DateTime createdAt
        +executeTripartiteMatch() Boolean
    }

    class VerificationResult {
        +String id
        +String runId
        +String status
        +String studentIdNo
        +String lastName
        +String firstName
        +String middleName
        +String school
        +Boolean inChed
        +Boolean inRegistrar
        +Boolean inSystem
        +Float confidenceScore
        +Json matchDetails
        +Boolean isManuallyResolved
        +String resolvedStatus
        +String resolvedNotes
        +DateTime createdAt
    }

    class Announcement {
        +String id
        +String title
        +String content
        +String category
        +Boolean isPinned
        +String targetAudience
        +String authorId
        +DateTime createdAt
        +DateTime updatedAt
    }

    class LandingPageConfig {
        +String id
        +Json publishedSections
        +Json draftSections
        +Boolean hasUnpublishedChanges
        +DateTime publishedAt
        +DateTime updatedAt
        +String updatedById
        +publishDraft() Boolean
    }

    %% Relationships
    User "1" --> "*" Session : owns
    User "1" --> "*" Document : creates
    User "1" --> "*" Comment : authors
    User "1" --> "*" Notification : receives
    User "1" --> "*" AuditLog : generates
    User "1" --> "*" Application : submits
    User "1" --> "*" ApplicantCall : publishes
    User "1" --> "*" Transmittal : dispatches
    User "1" --> "*" VerificationRun : executes
    User "1" --> "*" Announcement : posts

    AnnexType "1" --> "*" Document : classifies
    Document "1" *-- "*" StatusHistory : records
    Document "1" *-- "*" Comment : holds
    Document "1" o-- "0..1" Transmittal : tracked_by

    ApplicantCall "1" *-- "*" Application : contains
    VerificationRun "1" *-- "*" VerificationResult : produces
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Concept | MinSU Domain Meaning |
|---|---|---|---|
| `Class` | `class Name` | Domain Model | Persistent entity backed by PostgreSQL Prisma schema |
| `Enumeration` | `<<enumeration>>` | Type Constants | System roles, document states, application review decisions |
| `-->` | Directed Association | Unidirectional pointer | User owns sessions, authors comments, receives notifications |
| `*--` | Composition | Strict ownership | Document owns StatusHistory; VerificationRun owns VerificationResults |
| `o--` | Aggregation | Weak ownership | Document is optionally associated with an Outgoing Transmittal |

---

## 4. PlantUML Class Diagram

```plantuml
@startuml
skinparam classBackgroundColor #FFFFFF
skinparam classBorderColor #1B5E20

enum Role {
  STAFF
  STUDENT
  DIRECTOR
  ACCOUNTING
  SYSTEM_ADMIN
}

enum DocumentStatus {
  DRAFT
  SUBMITTED
  RETURNED
  RESUBMITTED
  APPROVED
  UPLOADED
  TRANSMITTED
  ARCHIVED
}

class User {
  +id: String
  +name: String
  +email: String
  +role: Role
  +twoFactorEnabled: Boolean
  +studentProfile: Json
}

class Document {
  +id: String
  +title: String
  +status: DocumentStatus
  +formData: Json
}

class VerificationRun {
  +id: String
  +runNumber: Int
  +chedFileName: String
  +registrarFileName: String
  +fullyVerifiedCount: Int
}

class VerificationResult {
  +id: String
  +status: String
  +studentIdNo: String
  +confidenceScore: Float
  +isManuallyResolved: Boolean
}

class Announcement {
  +id: String
  +title: String
  +category: String
  +isPinned: Boolean
  +targetAudience: String
}

class LandingPageConfig {
  +id: String
  +publishedSections: Json
  +draftSections: Json
}

User "1" -- "*" Document : creates
User "1" -- "*" VerificationRun : triggers
User "1" -- "*" Announcement : publishes
VerificationRun "1" *-- "*" VerificationResult : contains
@enduml
```
