# Accounting Officer — Class Diagram

> **Role:** `ACCOUNTING_OFFICER`  
> **Diagram Type:** Class Diagram  
> **Standard:** UML 2.5 Class Specification

---

## 1. Purpose

The Class Diagram shows the domain models, attributes, operations, and relationships for the Accounting Officer role. It defines entities that manage financial reports (Annexes 6, 7, 8, and 9), zero-variance ledger balancing, multi-tab Excel exports, and 2FA authentication.

---

## 2. Mermaid Class Diagram

```mermaid
classDiagram
    direction TB

    class Role {
        <<enumeration>>
        ACCOUNTING_OFFICER
        STAFF
        DIRECTOR
        SYSTEM_ADMIN
        STUDENT
    }

    class AnnexType {
        <<enumeration>>
        ANNEX_6
        ANNEX_7
        ANNEX_8
        ANNEX_9
    }

    class DocumentStatus {
        <<enumeration>>
        DRAFT
        SUBMITTED
        APPROVED
        RETURNED
        ARCHIVED
    }

    class User {
        +String id
        +String email
        +String name
        +Role role
        +Boolean twoFactorEnabled
        +createFinancialDocument(type, title) Document
        +submitToExecutiveQueue(documentId) StatusHistory
    }

    class Document {
        +String id
        +String title
        +AnnexType annexType
        +DocumentStatus status
        +String createdById
        +Json formData
        +calculateTotalDisbursed() Float
        +validateZeroVariance() Boolean
        +exportExcel() Buffer
    }

    class FundUtilizationSummary {
        +Float allocationAmount
        +Float totalDisbursed
        +Float unutilizedBalance
        +computeVariance() Float
    }

    class DebitAdviceEntry {
        +String checkNumber
        +String accountTitle
        +Float amount
        +String bankReference
    }

    class PayrollGranteeItem {
        +String studentIdNumber
        +String studentName
        +Float stipendTierAmount
        +Int semesterTerm
        +Float netPayable
    }

    class StatusHistory {
        +String id
        +String documentId
        +DocumentStatus fromStatus
        +DocumentStatus toStatus
        +String actorId
        +String remarks
        +DateTime createdAt
    }

    Document "1" *-- "0..*" StatusHistory : tracks transitions
    Document "1" -- "0..1" FundUtilizationSummary : captures Annex 6 totals
    Document "1" *-- "0..*" DebitAdviceEntry : captures Annex 7/8 checks
    Document "1" *-- "0..*" PayrollGranteeItem : captures Annex 9 stipends
    User "1" -- "0..*" Document : drafts and submits
    User ..> Role : assigned

    %% ─── 📌 VISUAL LEGEND ───
    note "<b>📌 DIAGRAM LEGEND & UML NOTATION</b>\n+ Public Attribute / Operation\n- Private / Internal Field\n*-- Strong Composition (Cascade Delete)\no-- Aggregation (Reference)\n-- Multiplicity Association\n..> Dependency / State Transition\n&lt;&lt;enumeration&gt;&gt; Strict Enum Domain"
```

---

## 3. Diagram Legend & Symbol Guide

| Symbol / UML Notation | Meaning & Syntax | Technical Function | MinSU Domain Example |
|---|---|---|---|
| `+` | Public Visibility | Readable attribute or callable method | `+validateZeroVariance()`, `+exportExcel()` |
| `-` | Private Visibility | Encapsulated field | Internal hash codes, session secrets |
| `<<enumeration>>` | Enum Classifier | Strict closed set of categorical values | `AnnexType` (`ANNEX_6`, `ANNEX_7`, `ANNEX_8`, `ANNEX_9`) |
| `*--` | Strong Composition | Lifecycle containment (child deleted on parent deletion) | `Document *-- PayrollGranteeItem` |
| `--` | Multiplicity Association | Association relationship between classes | One accounting officer prepares many financial reports |

---

## 4. Operations & Domain Rules

- `validateZeroVariance()` verifies that total disbursed amounts match the official grant allocation down to 0.00 Philippine Pesos.
- `calculateTotalDisbursed()` computes line item sums across checking and debit entries in real time.
- `exportExcel()` invokes `ExcelJS` to stream multi-tab workbooks with automated sum formulas.
- `submitToExecutiveQueue()` elevates balanced financial documents to the Campus Director for endorsement.
