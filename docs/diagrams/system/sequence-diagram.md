# Sequence Diagram: MinSU DocTrack Whole System

## 1. Description
This sequence diagram illustrates the chronological message exchange between actors, user interfaces, backend controllers, validation engines, database adapters, and external storage across a full document lifecycle.

## 2. ASD-STE100 Technical Specifications
- Order participants from left to right according to execution initiation.
- Draw synchronous calls with solid arrows and returns with dashed arrows.
- Enforce audit event emission for every status modification.
- Handle decision branches with `alt` and `opt` frames.

---

## 3. End-to-End System Sequence Diagram (Mermaid)

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    actor Staff as Staff Coordinator
    actor Director as Campus Director
    actor Acct as Accounting Officer
    participant WebUI as Next.js Web App
    participant Engine as WorkflowEngine
    participant DB as Prisma (PostgreSQL)
    participant Storage as File / Blob Store

    %% ─── 📌 VISUAL LEGEND ───
    Note over Student,Storage: ─── 📌 DIAGRAM LEGEND: Solid Line (->>) = Request/Command | Dashed Line (-->>) = Response/Data | Green = Intake/Liquidation | Gold = Review Queue | Neutral = Staff Operations ───

    %% Step 1: Student Applies
    rect rgb(241, 248, 241)
        Student->>WebUI: Submit Application Form & Scanned Proofs
        WebUI->>Storage: Store PDF attachments (<= 5MB)
        Storage-->>WebUI: attachmentUrls
        WebUI->>Engine: createApplication(studentData, attachmentUrls)
        Engine->>DB: INSERT INTO Application & Attachment
        DB-->>Engine: applicationRecord
        Engine-->>WebUI: trackingCode ("TDP-2026-XXXX")
        WebUI-->>Student: Display Confirmation Slip & Code
    end

    %% Step 2: Staff Compiles Annex 2
    rect rgb(255, 255, 255)
        Staff->>WebUI: Evaluate Applicants & Compile Annex 2
        WebUI->>Engine: submitDocument(ANNEX_2, studentIds)
        Engine->>DB: INSERT INTO Document (status='SUBMITTED')
        Engine->>DB: INSERT INTO AuditLog (DOCUMENT_SUBMITTED)
        DB-->>Engine: docSuccess
        Engine-->>WebUI: notifyDirector(docId)
        WebUI-->>Staff: Display "Submitted to Director" Badge
    end

    %% Step 3: Director Endorsement
    rect rgb(255, 241, 194)
        Director->>WebUI: Open Executive Queue & Review Annex 2
        alt Approval Path
            Director->>WebUI: Click "1-Click Approve"
            WebUI->>Engine: approveDocument(docId, digitalSignature)
            Engine->>DB: UPDATE Document SET status='APPROVED'
            Engine->>DB: INSERT INTO AuditLog (DOCUMENT_APPROVED)
            DB-->>Engine: ok
            Engine-->>WebUI: notifyStaffAndAccounting(docId)
            WebUI-->>Director: Show Approved State Badge
        else Rejection / Return Path
            Director->>WebUI: Click "Return with Comments"
            WebUI->>Engine: returnDocument(docId, revisionComments)
            Engine->>DB: UPDATE Document SET status='RETURNED'
            Engine->>DB: INSERT INTO AuditLog (DOCUMENT_RETURNED)
            WebUI-->>Director: Reopened for Coordinator Edits
        end
    end

    %% Step 4: Accounting Liquidation
    rect rgb(241, 248, 241)
        Acct->>WebUI: Prepare Annex 9 Payroll & Annex 6 Ledgers
        WebUI->>Engine: validateZeroVariance(allocated, disbursed)
        Engine-->>WebUI: varianceResult (0.00 PHP)
        WebUI->>Engine: submitFinancialAnnex(docId)
        Engine->>DB: UPDATE Document (status='SUBMITTED')
        Engine->>DB: INSERT INTO AuditLog (FINANCIAL_SUBMITTED)
        WebUI-->>Acct: Confirm Financial Reconciliation
    end

    %% Step 5: Staff Dispatches to Agency
    rect rgb(255, 255, 255)
        Staff->>WebUI: Create Transmittal & Upload Wet-Signed PDF
        WebUI->>Storage: Store Final Signed Scan
        Storage-->>WebUI: scanUrl
        WebUI->>Engine: dispatchTransmittal(controlNumber, courier, recipient)
        Engine->>DB: INSERT INTO Transmittal & Link Document
        Engine->>DB: UPDATE Document SET status='SENT_TO_AGENCY'
        Engine->>DB: INSERT INTO AuditLog (TRANSMITTAL_DISPATCHED)
        DB-->>Engine: confirmed
        WebUI-->>Staff: Display Tracking Receipt & Courier Barcode
    end
```

---

## 4. Diagram Legend & Symbol Guide

| Visual / Symbol | Element Type | Technical Role | MinSU DocTrack Context |
|---|---|---|---|
| 👤 `actor` | Human Actor | External user role triggering system operations | Student Applicant, Staff Coordinator, Campus Director, Accounting Officer |
| 🔲 `participant` | System Component | Internal software subsystem or persistence boundary | Next.js Web App, WorkflowEngine, Prisma/PostgreSQL, File/Blob Storage |
| ──▶ `->>` | Solid Arrow | Synchronous invocation or command message | Submitting application, calling `approveDocument()`, dispatching transmittal |
| - - ▷ `-->>` | Dashed Arrow | Return response or asynchronous receipt | Returning `trackingCode`, confirmation receipts, status badges |
| 🔲 `alt / else` | Conditional Fragment | Decision tree handling alternative workflow paths | Campus Director approving document vs. returning with revision notes |
| 🟩 `rect rgb(241, 248, 241)` | Soft Green Container | MinSU Approved / Intake Phase | Successful student application submission & accounting liquidation |
| 🟨 `rect rgb(255, 241, 194)` | Soft Gold Container | MinSU Review / Pending SLA Phase | Campus Director executive review queue & endorsement evaluation |
| ⬜ `rect rgb(255, 255, 255)` | Neutral Container | Staff Operations Phase | Staff Annex 2 compilation & courier agency transmittal dispatch |

---

## 5. Key Transaction Boundaries
- **Intake Transaction**: Atomic insertion of student demographic data, file references, and generated tracking tokens.
- **Executive Approval Transaction**: Synchronous update of document status, creation of status history rows, and recording of immutable audit logs.
- **Financial Validation Boundary**: Mathematical check rejecting any payload where `allocatedFund - disbursedAmount != 0.00`.
- **Transmittal Packaging**: Association of the physical scanned PDF with external courier tracking metadata.
