# Staff Coordinator — Communication Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Communication Diagram  
> **Scenario:** 3-Way Tripartite Verification & Annex 4 Compilation Message Collaboration  
> **Standard:** UML 2.5 Communication Specification

---

## 1. Purpose

The Communication Diagram shows which objects interact during a 3-way verification run and Annex 4 billing compilation. It shows the structural links between runtime objects and uses numbered messages to show order.

---

## 2. Mermaid Communication Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef actorStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef objStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;

    StaffUser["staff : StaffCoordinator"]:::actorStyle
    VerifyUI["verifyUI : VerificationView"]:::objStyle
    VerifyCtrl["verifyCtrl : VerificationController"]:::objStyle
    Matcher["matcher : TripartiteMatchEngine"]:::objStyle
    DocCtrl["docCtrl : DocumentController"]:::objStyle
    Exporter["exporter : ExcelJSExporter"]:::objStyle
    AuditObj["audit : AuditService"]:::objStyle
    DBAdapter["db : PrismaClient"]:::objStyle

    %% Object Links and Numbered Messages
    StaffUser ---|1: triggerTripartiteMatch(chedCsv, regCsv)| VerifyUI
    VerifyUI ---|2: POST /api/verification/run| VerifyCtrl
    VerifyCtrl ---|3: fetchAcceptedStudents()| DBAdapter
    DBAdapter ---|4: returnMasterlistRecords()| VerifyCtrl
    VerifyCtrl ---|5: runJaroWinklerCrossMatch(ched, reg, system)| Matcher
    Matcher ---|6: returnMatchMetrics(verified, discrepancies)| VerifyCtrl
    VerifyCtrl ---|7: insertVerificationRunAndResults()| DBAdapter
    VerifyCtrl ---|8: logAuditEvent(VERIFICATION_RUN_EXECUTED)| AuditObj
    VerifyCtrl ---|9: 200 OK (MatchSummary)| VerifyUI
    StaffUser ---|10: resolveDiscrepancies(action, notes)| VerifyUI
    VerifyUI ---|11: syncVerifiedToBilling(runId)| DocCtrl
    DocCtrl ---|12: populateAnnex4Form2()| DBAdapter
    DocCtrl ---|13: streamWorkbook()| Exporter
    Exporter ---|14: downloadFile(Annex4.xlsx)| VerifyUI
    VerifyUI ---|15: displaySuccessNotice()| StaffUser

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Node["Node : Subsystem Component"]:::legNode
        L_Msg["Link: N: methodName(args)"]:::legMsg
        L_Node -->|Call Sequence| L_Msg
    end
    classDef legNode fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legMsg fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Communication Meaning | MinSU Implementation |
|---|---|---|---|
| `[Object]` | `["instance : Class"]` | Named runtime instance participating in flow | `verifyCtrl`, `matcher`, `db : PrismaClient` |
| `---` | Association Line | Structural communication link between objects | Connects controller to database adapter or UI |
| `N: method()` | Sequence Call Number | Chronological order and message invocation | `1: triggerMatch()`, `2: POST /run`, `5: runCrossMatch()` |
| 🟢 Green Tone | `#F1F8F1` / `#1B5E20` | Operational Actor / Authorized Endpoint | Authenticated Staff Coordinator interacting with verification gateway |

---

## 4. Message Invocation Sequence

1. Staff initiates the tripartite verification run with CHED and Registrar CSV datasets.
2. UI submits the multipart request to `/api/verification/run`.
3. Controller retrieves accepted student registrations from PostgreSQL.
4. Matcher engine calculates Jaro-Winkler string similarity scores and evaluates student ID matches.
5. Controller writes `VerificationRun` and `VerificationResult` records to the database.
6. Audit service records an immutable security log entry.
7. Staff resolves any flagged discrepancies with mandatory notes.
8. Verified grantees are synchronized into Annex 4 New Billing Statement.
9. `ExcelJS` streams the multi-tab spreadsheet to the Staff browser.
