# Class Diagram: Student Applicant Domain

## 1. Description
This class diagram details the object-oriented data structures, enums, attributes, and associations supporting scholarship application submissions, document verifications, and applicant tracking.

## 2. ASD-STE100 Technical Specifications
- Define unique tracking codes for every scholarship application record.
- Associate applications with an active applicant call cycle.
- Link applicant records optionally with a registered user entity.
- Store file attachments with verified file hashes and MIME types.

## 3. Class Diagram (Mermaid)

```mermaid
classDiagram
    direction TB

    class ApplicantCall {
        +String id
        +String title
        +String academicYear
        +String semester
        +Int slotQuota
        +DateTime openDate
        +DateTime closeDate
        +Boolean isActive
        +isOpen() Boolean
        +getApplications() List~Application~
    }

    class Application {
        +String id
        +String callId
        +String studentNumber
        +String fullName
        +String email
        +String course
        +Int yearLevel
        +String trackingCode
        +ApplicationStatus status
        +DateTime submittedAt
        +DateTime updatedAt
        +generateTrackingCode() String
        +updateStatus(newStatus: ApplicationStatus, notes: String) void
    }

    class ApplicationStatus {
        <<enumeration>>
        SUBMITTED
        UNDER_REVIEW
        QUALIFIED
        DISQUALIFIED
        AWARDED
    }

    class Attachment {
        +String id
        +String applicationId
        +String documentType
        +String fileUrl
        +Int fileSizeBytes
        +String mimeType
        +DateTime uploadedAt
        +verifyFileSize() Boolean
    }

    class TrackingLookupResult {
        +String trackingCode
        +String applicantName
        +String callTitle
        +ApplicationStatus status
        +DateTime submittedDate
        +String remarks
    }

    class Notification {
        +String id
        +String email
        +String subject
        +String messageContent
        +DateTime sentAt
    }

    ApplicantCall "1" o-- "*" Application : contains
    Application "1" *-- "1" ApplicationStatus : state
    Application "1" *-- "*" Attachment : requires
    Application "1" ..> TrackingLookupResult : provides
    Application "1" ..> Notification : generates

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


## 5. Class Responsibilities
- **ApplicantCall**: Represents an administrative call for scholarship applicants under Annex 2.
- **Application**: The core entity storing student personal data, academic standing, and submission status.
- **Attachment**: Represents uploaded evidence files (Certificate of Registration, Grades Slip, Certificate of Indigency).
- **TrackingLookupResult**: DTO returned to students searching by tracking code in the public portal.
