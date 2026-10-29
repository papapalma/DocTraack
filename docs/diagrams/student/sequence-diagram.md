# Student Applicant — Sequence Diagram

> **Role:** `STUDENT`  
> **Diagram Type:** Sequence Diagram  
> **Scenario:** Application Submission, Tracking Code Generation & Receipt Retrieval

---

## 1. Purpose

The Sequence Diagram shows the chronological exchange of messages when a Student Applicant submits an online scholarship application and receives an official tracking code and receipt.

---

## 2. Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Applicant
    participant UI as Portal Application View (/portal)
    participant API as Application Endpoint (/api/portal/apply)
    participant CodeGen as Tracking Code Generator
    participant Prisma as Prisma ORM Client
    participant PDF as Receipt Slip Compiler
    participant DB as PostgreSQL Database

    %% ─── 📌 VISUAL LEGEND ───
    Note over Student,DB: ─── 📌 DIAGRAM LEGEND: Solid Line (->>) = Request/Command | Dashed Line (-->>) = Response/Data | Rect = Phase Boundary ───


    Student->>UI: Fills form fields and uploads COR (cor_2026.pdf)
    Student->>UI: Agrees to privacy consent and clicks "Submit"
    
    UI->>API: POST /api/portal/apply { callId: "call_1", formData: { ... } }
    activate API
    
    API->>Prisma: Verify call exists and isActive == true
    Prisma->>DB: SELECT * FROM applicant_calls WHERE id = 'call_1'
    DB-->>Prisma: Return call (deadline in future)
    
    API->>CodeGen: generateUniqueTrackingCode("TDP-2026")
    activate CodeGen
    CodeGen->>CodeGen: Generate cryptographically secure slug: TDP-2026-X9B2
    CodeGen-->>API: Return trackingCode
    deactivate CodeGen
    
    API->>Prisma: INSERT INTO applications (callId, studentId, formData, trackingCode, status)
    activate Prisma
    Prisma->>DB: Write application row with status = SUBMITTED
    DB-->>Prisma: Insert confirmed
    deactivate Prisma
    
    API-->>UI: 201 Created { success: true, trackingCode: "TDP-2026-X9B2" }
    deactivate API
    
    UI-->>Student: Display congratulations modal with code: TDP-2026-X9B2
    
    Student->>UI: Clicks "Download Receipt Slip"
    UI->>API: GET /api/portal/receipt/TDP-2026-X9B2
    activate API
    API->>PDF: renderReceiptSlip({ studentName, trackingCode, timestamp })
    activate PDF
    PDF-->>API: Return PDF binary buffer
    deactivate PDF
    API-->>UI: 200 OK (Content-Type: application/pdf)
    deactivate API
    
    UI-->>Student: Browser initiates download of TDP-Receipt-X9B2.pdf

```

---

## 3. Diagram Legend & Symbol Guide

| Visual / Symbol | Element Type | Technical Role | MinSU DocTrack Context |
|---|---|---|---|
| 👤 `actor` | Human Actor | External user role triggering system operations | Student Applicant, Staff Coordinator, Campus Director, Accounting Officer |
| 🔲 `participant` | System Component | Internal software subsystem or persistence boundary | Web UI, API Endpoint, Workflow Engine, Prisma/PostgreSQL, PDF Compiler |
| ──▶ `->>` | Solid Arrow | Synchronous invocation or command message | Submitting forms, verifying tokens, invoking database writes |
| - - ▷ `-->>` | Dashed Arrow | Return response or data payload | Confirmation slips, tracking codes, PDF binary buffers, query results |
| 🔲 `activate / deactivate` | Activation Lifeline | Period during which a component executes logic | Active request execution on API controllers or PDF engines |
| 🔲 `alt / else` | Conditional Fragment | Decision tree handling alternative workflow paths | Approval vs. Return branching, SLA compliance checks |


---

## 4. Sequence Details

1. Student completes personal information and attaches documentary files.
2. API confirms that the target scholarship call is currently active.
3. Code Generator constructs a unique uppercase alphanumeric tracking code.
4. Database records the application in `SUBMITTED` status.
5. Student receives visual confirmation and clicks to download the official receipt.
6. PDF Engine compiles the verification slip containing the university seal and timestamp.
