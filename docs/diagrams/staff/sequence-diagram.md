# Staff Coordinator — Sequence Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Sequence Diagram  
> **Scenario:** 3-Way Tripartite Verification & Native Excel Export  
> **Standard:** UML 2.5 Sequence Specification

---

## 1. Purpose

The Sequence Diagram shows the chronological message flow when the Staff Coordinator executes a 3-way cross-matching run, resolves student discrepancies, imports verified grantees into Annex 4, and exports the native Excel workbook.

---

## 2. Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Staff Coordinator
    participant UI as Verification UI (/verification)
    participant VerifyAPI as /api/verification/run
    participant Engine as 3-Way Matcher Engine
    participant Prisma as Prisma ORM Client
    participant DB as PostgreSQL Database
    participant ExportAPI as /api/annex-4/export-excel
    participant Audit as Audit Log Service

    %% ─── 📌 VISUAL LEGEND ───
    Note over Staff,Audit: ─── 📌 DIAGRAM LEGEND: Solid Line (->>) = Request/Command | Dashed Line (-->>) = Response/Data | Rect = Phase Boundary ───

    rect rgb(241, 248, 241)
        Note over Staff,DB: Phase 1: CSV Dataset Ingestion & Tripartite Cross-Matching
        Staff->>UI: Uploads CHED CSV & Registrar CSV
        Staff->>UI: Clicks "Run Tripartite Verification"
        UI->>VerifyAPI: POST multipart/form-data (chedFile, regFile)
        activate VerifyAPI
        VerifyAPI->>Engine: executeTripartiteMatch(chedRows, registrarRows)
        activate Engine
        Engine->>Prisma: Fetch active student registrations from DB
        Prisma->>DB: SELECT * FROM registrations WHERE status = 'ACCEPTED'
        DB-->>Prisma: Return student masterlist
        Prisma-->>Engine: Masterlist records
        Engine->>Engine: Run Jaro-Winkler fuzzy matching & student ID normalization
        Engine-->>VerifyAPI: MatchSummary { fullyVerified, discrepancies, needsEncoding }
        deactivate Engine
        VerifyAPI->>Prisma: INSERT INTO verification_runs & verification_results
        Prisma->>DB: Save verification run and discrepancy rows
        DB-->>Prisma: Confirmed commit
        VerifyAPI->>Audit: logAuditEvent(staffId, "VERIFICATION_RUN_EXECUTED", runId)
        Audit->>DB: INSERT INTO audit_log
        VerifyAPI-->>UI: 200 OK { runId, stats, discrepancies }
        deactivate VerifyAPI
        UI-->>Staff: Display verification summary cards & discrepancy table
    end

    rect rgb(255, 241, 194)
        Note over Staff,DB: Phase 2: Discrepancy Evaluation & Resolution Gate
        alt Discrepancies Found? -- Yes
            Staff->>UI: Clicks "Resolve" on student discrepancy item
            Staff->>UI: Selects action ("CONFIRM" or "DISMISS") with justification
            UI->>VerifyAPI: POST /api/verification/resolve { resultId, resolutionAction, notes }
            VerifyAPI->>Prisma: UPDATE verification_results SET resolved = true, notes = notes
            Prisma->>DB: Update result status
            DB-->>Prisma: Confirmed update
            VerifyAPI-->>UI: 200 OK { resolved: true }
            UI-->>Staff: Discrepancy item marked resolved with green badge
        else Discrepancies Found? -- No
            UI-->>Staff: Display 100% verification badge: "Ready for Annex Billing Import"
        end
    end

    rect rgb(220, 239, 221)
        Note over Staff,Audit: Phase 3: Annex Compilation & Native Multi-Tab Excel Export
        Staff->>UI: Clicks "Import Verified Roster into Annex 4"
        UI->>VerifyAPI: POST /api/annex-4/sync-verified { runId }
        VerifyAPI->>Prisma: Populate Annex 4 Form 2 line items from verified grantees
        Prisma->>DB: INSERT / UPDATE documents (formData)
        DB-->>Prisma: Confirmed document draft updated
        VerifyAPI-->>UI: 200 OK { documentId, granteeCount }
        UI-->>Staff: Show Annex 4 draft populated with verified students

        Staff->>UI: Clicks "Export Native Excel (.xlsx)"
        UI->>ExportAPI: GET /api/annex-4/export-excel?docId=documentId
        activate ExportAPI
        ExportAPI->>ExportAPI: Build 3-Tab ExcelJS Workbook (Summary, Form 2, Details)
        ExportAPI->>ExportAPI: Calculate 0.5% Administrative Cost formula: ROUND(stipends * 0.005, 2)
        ExportAPI-->>UI: Stream application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
        deactivate ExportAPI
        UI-->>Staff: Download Annex4_Verified_Billing.xlsx file
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual / Symbol | Element Type | Technical Role | MinSU DocTrack Context |
|---|---|---|---|
| `Actor` | Human User | Initiator of operational procedures | Staff Coordinator executing verification runs |
| `Participant` | System Component | Boundary, controller, or data store | Verification API, 3-Way Matcher Engine, Prisma ORM |
| `->>` | Synchronous Message | Command or method invocation | Upload CSV files, run matching, resolve discrepancy |
| `-->>` | Return Message | Response data or confirmation payload | Returns summary metrics, discrepancy lists, streamed Excel file |
| `alt / else` | Conditional Frame | Guarded execution path (**Yes** / **No**) | Discrepancies Found? Yes -> manual resolution; No -> instant ready |
| `rect` | Grouping Boundary | Multi-step logical operational phase | Ingestion phase, discrepancy gate, compilation and export |

---

## 4. Execution Sequence Steps

1. Staff Coordinator uploads CHED and Registrar CSV datasets to `/verification`.
2. Staff clicks "Run Tripartite Verification".
3. System normalizes student IDs and applies Jaro-Winkler fuzzy name matching.
4. If discrepancies exist (**Yes**), Staff inspects items and manually resolves them.
5. If zero discrepancies exist (**No**), System marks the cohort ready for billing.
6. Staff clicks "Import Verified Roster into Annex 4".
7. System generates the Form 2 student grantee table.
8. Staff clicks "Export Native Excel".
9. System generates and streams a native 3-tab `ExcelJS` spreadsheet with automated fiscal formulas.
