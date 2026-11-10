# Student Applicant — Class Diagram

> **Role:** `STUDENT`  
> **Diagram Type:** Class Diagram  
> **Standard:** UML 2.5 Class Specification

---

## 1. Purpose

The Class Diagram shows the domain models, attributes, operations, and relationships governing student online applications, Microsoft Authenticator 2FA, RA 10173 identity locks, tracking code lookups, and announcement feeds.

---

## 2. Mermaid Class Diagram

```mermaid
classDiagram
    direction TB

    class RegistrationStatus {
        <<enumeration>>
        PENDING
        ACCEPTED
        REJECTED
    }

    class User {
        +String id
        +String email
        +String name
        +String role
        +Boolean twoFactorEnabled
        +String twoFactorSecret
        +registerAccount() User
        +setupTwoFactor(totpCode) Boolean
    }

    class Registration {
        +String id
        +String studentIdNumber
        +String fullName
        +Float gwa
        +String mobileNumber
        +String residentialAddress
        +String parentContact
        +RegistrationStatus status
        +Boolean identityLocked
        +updateProfile(gwa, contacts) Void
        +isIdentityLocked() Boolean
    }

    class ApplicantCall {
        +String id
        +String title
        +DateTime deadline
        +Boolean isActive
        +isOpen() Boolean
        +getPublishedSchema() Json
    }

    class Application {
        +String id
        +String callId
        +String studentId
        +String trackingCode
        +Json formData
        +DateTime submittedAt
        +generateTrackingCode() String
        +downloadReceiptSlip() Buffer
    }

    class Attachment {
        +String id
        +String applicationId
        +String documentType
        +String fileUrl
        +Int fileSizeBytes
        +validateMimeAndSize() Boolean
    }

    class Announcement {
        +String id
        +String title
        +String content
        +String audience
        +Boolean pinned
        +getStudentAnnouncements() List~Announcement~
    }

    User "1" -- "0..1" Registration : owns student profile
    User "1" -- "0..*" Application : submits
    ApplicantCall "1" *-- "0..*" Application : receives
    Application "1" *-- "1..*" Attachment : includes proof documents
    User "1" ..> Announcement : views feed

    %% ─── 📌 VISUAL LEGEND ───
    note "<b>📌 DIAGRAM LEGEND & UML NOTATION</b>\n+ Public Attribute / Operation\n- Private / Internal Field\n*-- Strong Composition (Cascade Delete)\no-- Aggregation (Reference)\n-- Multiplicity Association\n..> Dependency / State Transition\n&lt;&lt;enumeration&gt;&gt; Strict Enum Domain"
```

---

## 3. Diagram Legend & Symbol Guide

| Symbol / UML Notation | Meaning & Syntax | Technical Function | MinSU Domain Example |
|---|---|---|---|
| `+` | Public Visibility | Readable attribute or callable method | `+generateTrackingCode()`, `+updateProfile()` |
| `-` | Private Visibility | Encapsulated field | `twoFactorSecret`, session hashes |
| `<<enumeration>>` | Enum Classifier | Strict closed set of categorical values | `RegistrationStatus` (`PENDING`, `ACCEPTED`, `REJECTED`) |
| `*--` | Strong Composition | Lifecycle containment (child deleted on parent deletion) | `Application *-- Attachment` |
| `--` | Multiplicity Association | Association relationship between classes | One student user owns one official registration profile |

---

## 4. Operations & Domain Rules

- `isIdentityLocked()` returns true when an applicant is marked `ACCEPTED`, permanently preventing modification of `studentIdNumber` and `fullName` under RA 10173.
- `updateProfile()` permits students to maintain dynamic attributes (GWA, residential address, mobile number, parent contacts).
- `generateTrackingCode()` creates a unique 12-character lookup identifier formatted as `TDP-YYYY-XXXX`.
- `validateMimeAndSize()` restricts document attachments strictly to PDF or image files 5 MB or smaller.
