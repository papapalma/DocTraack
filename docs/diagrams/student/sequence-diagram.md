# Student Applicant — Sequence Diagram

> **Role:** `STUDENT`  
> **Diagram Type:** Sequence Diagram  
> **Scenario:** 2FA Setup, Online Application, Tracking Code Generation & Receipt Retrieval  
> **Standard:** UML 2.5 Sequence Specification

---

## 1. Purpose

The Sequence Diagram shows the chronological exchange of messages when a Student Applicant signs up with Microsoft Authenticator 2FA, submits an online application, receives an official tracking code, and downloads a receipt slip. All decision alternatives evaluate strictly to binary Yes and No paths.

---

## 2. Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Applicant
    participant UI as Portal View (/portal)
    participant AuthAPI as /api/auth/2fa/verify
    participant ApplyAPI as /api/registrations
    participant CodeGen as Tracking Code Generator
    participant Prisma as Prisma ORM Client
    participant DB as PostgreSQL Database

    %% ─── 📌 VISUAL LEGEND ───
    Note over Student,DB: ─── 📌 DIAGRAM LEGEND: Solid Line (->>) = Request/Command | Dashed Line (-->>) = Response/Data | Rect = Phase Boundary ───

    rect rgb(241, 248, 241)
        Note over Student,DB: Phase 1: 2FA Microsoft Authenticator Verification
        Student->>UI: Inputs 6-digit TOTP code from Microsoft Authenticator
        UI->>AuthAPI: POST /api/auth/2fa/verify { token: "492019" }
        activate AuthAPI
        AuthAPI->>AuthAPI: Verify RFC 6238 TOTP against stored secret
        alt Is 2FA Code Valid? -- Yes
            AuthAPI-->>UI: 200 OK { authenticated: true }
            UI-->>Student: Grant access to Student Portal (/portal)
        else Is 2FA Code Valid? -- No
            AuthAPI-->>UI: 401 Unauthorized { error: "Invalid TOTP code" }
            UI-->>Student: Display invalid code alert
        end
        deactivate AuthAPI
    end

    rect rgb(255, 241, 194)
        Note over Student,DB: Phase 2: Application Submission & Deadline Validation
        Student->>UI: Selects active scholarship call and inputs biodata
        UI->>ApplyAPI: Check deadline status
        activate ApplyAPI
        ApplyAPI->>Prisma: Query active call deadline
        Prisma->>DB: SELECT * FROM applicant_calls WHERE id = :callId
        DB-->>Prisma: Return call record
        deactivate ApplyAPI

        alt Is Call Deadline Open? -- Yes
            Student->>UI: Attaches Certificate of Registration (COR.pdf)
            alt Are Attachments Valid (<= 5MB PDF/Image)? -- Yes
                Student->>UI: Agrees to RA 10173 Privacy Notice & clicks Submit
                UI->>ApplyAPI: POST /api/registrations (multipart/form-data)
                activate ApplyAPI
                ApplyAPI->>CodeGen: generateUniqueTrackingCode("TDP-2026")
                CodeGen-->>ApplyAPI: Return "TDP-2026-X9B2"
                ApplyAPI->>Prisma: INSERT INTO registrations & applications
                Prisma->>DB: Commit student registration row
                DB-->>Prisma: Confirmed commit
                ApplyAPI-->>UI: 201 Created { trackingCode: "TDP-2026-X9B2" }
                deactivate ApplyAPI
                UI-->>Student: Display success modal with Tracking Code: TDP-2026-X9B2
                Student->>UI: Clicks "Download Official Receipt Slip"
                UI-->>Student: Stream downloadable PDF receipt
            else Are Attachments Valid (<= 5MB PDF/Image)? -- No
                UI-->>Student: Display file validation alert: "Exceeds 5MB limit or invalid MIME"
            end
        else Is Call Deadline Open? -- No
            UI-->>Student: Display alert: "Scholarship call is closed for submissions"
        end
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual / Symbol | Element Type | Technical Role | MinSU DocTrack Context |
|---|---|---|---|
| `Actor` | Human User | Initiator of operational procedures | Student Applicant submitting credentials |
| `Participant` | System Component | Boundary, controller, or data store | Portal UI, 2FA Controller, Prisma ORM, PostgreSQL |
| `->>` | Synchronous Message | Command or method invocation | Verify TOTP, check deadline, commit registration |
| `-->>` | Return Message | Response data or confirmation payload | Returns 200 OK, tracking code, downloadable receipt |
| `alt / else` | Conditional Frame | Guarded execution path (**Yes** / **No**) | Is Code Valid? Yes -> proceed; No -> alert |

---

## 4. Execution Sequence Steps

1. Student enters the 6-digit TOTP code from Microsoft Authenticator.
2. If the 2FA code is valid (**Yes**), system grants session access to `/portal`.
3. If invalid (**No**), system halts with an authentication error.
4. Student selects an active scholarship call.
5. If deadline is open (**Yes**), system validates document size and MIME types.
6. If attachments are valid (**Yes**), system saves the application, issues a tracking code, and generates a printable receipt.
7. If attachments are invalid (**No**), system prompts for compliant files.
8. If the deadline has elapsed (**No**), system displays a call closed banner.
