# Staff Coordinator — Sequence Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Sequence Diagram  
> **Scenario:** Signed Scan Upload & Transmittal Registration

---

## 1. Purpose

The Sequence Diagram shows the messages exchanged when the Staff Coordinator uploads a wet-signed PDF scan and registers the outgoing transmittal to CHED.

---

## 2. Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Staff Coordinator
    participant UI as Document Detail UI
    participant UploadAPI as /api/documents/[id]/upload
    participant Disk as Local Disk Storage (/uploads)
    participant TransmitAPI as /api/documents/[id]/transmit
    participant Prisma as Prisma ORM Client
    participant Audit as Audit Log Service
    participant DB as PostgreSQL Database

    %% ─── 📌 VISUAL LEGEND ───
    Note over Staff,DB: ─── 📌 DIAGRAM LEGEND: Solid Line (->>) = Request/Command | Dashed Line (-->>) = Response/Data | Rect = Phase Boundary ───


    Staff->>UI: Selects signed scan file (annex1_signed.pdf)
    Staff->>UI: Clicks "Upload Signed Copy"
    UI->>UploadAPI: POST multipart/form-data (file: Buffer, mime: application/pdf)
    
    activate UploadAPI
    UploadAPI->>UploadAPI: Verify file MIME type & 15MB size limit
    UploadAPI->>Disk: Write stream to /uploads/scans/annex1_signed_uuid.pdf
    Disk-->>UploadAPI: File path acknowledged (/uploads/scans/...)
    
    UploadAPI->>Prisma: UPDATE documents SET fileUrl = '/uploads/...', status = 'UPLOADED'
    Prisma->>DB: Execute document status update
    DB-->>Prisma: Confirm status = UPLOADED
    
    UploadAPI->>Audit: logAuditEvent(staffId, "SCAN_UPLOADED", "DOCUMENT", docId)
    Audit->>DB: INSERT INTO audit_log (...)
    
    UploadAPI-->>UI: 200 OK { success: true, fileUrl: "/uploads/..." }
    deactivate UploadAPI
    UI-->>Staff: Show badge: UPLOADED

    Staff->>UI: Clicks "Record Transmittal"
    Staff->>UI: Inputs: Recipient: "CHED MMARO", Method: "Courier", DriveLink: "https://drive.google.com/..."
    UI->>TransmitAPI: POST /api/documents/docId/transmit { recipient, method, driveLink, notes }
    
    activate TransmitAPI
    TransmitAPI->>Prisma: $transaction(Create Transmittal & Set Status to TRANSMITTED)
    activate Prisma
    Prisma->>DB: INSERT INTO transmittals (documentId, sentById, recipient, method, driveLink)
    Prisma->>DB: UPDATE documents SET status = 'TRANSMITTED'
    Prisma->>DB: INSERT INTO status_history (...)
    Prisma-->>TransmitAPI: Transaction successful
    deactivate Prisma
    
    TransmitAPI->>Audit: logAuditEvent(staffId, "TRANSMITTAL_LOGGED", "DOCUMENT", docId)
    Audit->>DB: INSERT INTO audit_log (...)
    
    TransmitAPI-->>UI: 200 OK { success: true, status: "TRANSMITTED" }
    deactivate TransmitAPI
    
    UI-->>Staff: Display green toast: "Transmittal successfully cataloged in Outgoing Registry"

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

## 4. Sequence Steps

1. Staff uploads the scanned PDF via the document detail screen.
2. API validates file type and streams binary data to local `/uploads` storage.
3. Database marks the document as `UPLOADED`.
4. Staff enters courier tracking information and the external Google Drive link.
5. API creates a `Transmittal` record and marks the document `TRANSMITTED`.
6. Audit Log Service stores the dispatch event, and the Outgoing Registry updates.
