# Annex 09: TDP-TES Stipend Disbursement Payroll (General Payroll)

> **Document Code:** TDP-ANNEX-09  
> **Official Title:** TDP Form – Annex 9: Tulong Dunong Program – Tertiary Education Subsidy (TDP-TES) Payroll  
> **Source Template:** `Annex9.xlsx` (`General Payroll` Tab)  
> **Primary Creators:** Accounting Officer & Staff Coordinator (`Role.ACCOUNTING`, `Role.STAFF`)  
> **Certifying Authorities:** TES Focal Person, University Registrar, Chief Accountant  
> **Approving Authority:** University President / Campus Director  
> **Receiving Body:** MinSU Cashier / Disbursing Officer / Student Grantees / COA  
> **System Route:** `/documents/new?annex=9`, `/documents/[id]`, `/api/annex-9/export-excel`  

---

## 1. Overview & Institutional Purpose

**Annex 9**, officially titled **TDP Form – Annex 9: General Payroll**, is the legal disbursement roster and accounting payroll sheet used by Mindoro State University to record, calculate, and certify the distribution of scholarship stipends directly to qualified student scholars.

Whether payments are executed through electronic Advice to Debit Accounts (Annex 7) or through over-the-counter distributions administered by a Special Disbursing Officer (SDO), Annex 9 provides the definitive legal proof attesting that public funds were actually received by qualified scholars. It incorporates line-by-line student profiles, dual-semester payout tracking (First Semester and Second Semester), individual payment dates, and physical student acknowledgment receipt signatures.

Under MinSU DocTrack, Annex 9 features **1-Click Import from Billings (Annex 3 / 4)**, which immediately populates the payroll masterlist from verified billing rosters, alongside a bulk **Set All ₱7,500** action for rapid semester processing.

---

## 2. Legal & Regulatory Framework

1. **Executive Order No. 292 (Administrative Code of 1987, Book VI, Sec. 43):** Prohibits the disbursement of any public fund without an approved and certified payroll schedule.
2. **COA Circular No. 97-002 (Rules on Cash Advances & Payroll Disbursements):** Stipulates that payroll advances must be supported by completely signed payroll sheets bearing the valid acknowledgment receipts of student payees.
3. **UniFAST Operational Guidelines:** Mandates the statutory stipend allowance of **PHP 7,500.00 per semester** per qualified grantee and strictly prohibits unauthorized deductions or fees.
4. **Government Accounting Manual (GAM for SUCs):** Establishes standard payroll presentation requirements, double-underline summation lines, and multi-tier institutional endorsements.

---

## 3. Form Architecture & Data Structure

```mermaid
graph TD
    A3A4[Approved Annex 3 & 4 Billings] -->|1-Click Roster Sync| A9[Annex 9: General Payroll Suite]
    A9 -->|14-Column Dual-Semester Matrix| Canvas[Official General Payroll Canvas]
    Canvas -->|First Sem & Second Sem Signatures| Payout[Student Acknowledgment Receipts]
    Canvas -->|Quadruple Executive Signatures| Signatories[Focal Person, Registrar, Accountant, President]
    Canvas -->|Single-Tab Workbook| Excel[/api/annex-9/export-excel]
```

### 3.1. Header & Institutional Identification
- **Header Insignia:** Commission on Higher Education (CHED) Seal and UniFAST Secretariat Seal.
- **Top Label:** `TDP Form - Annex 9`.
- **Jurisdiction & Institution:** Republic of the Philippines, Mindoro State University, Alcate, Victoria, Oriental Mindoro.
- **Title:** `TULONG DUNONG PROGRAM – TERTIARY EDUCATION SUBSIDY (TDP-TES) PAYROLL`.
- **Academic Context:** Academic Year, Active Semester, Campus, Payroll Date.

### 3.2. Fourteen-Column Master Payroll Matrix
The table is organized into three distinct functional sections:
- **Student Profile (Columns 1–8):**
  1. `Seq. No.`: Sequential numerical index (e.g. `1, 2, 3...`).
  2. `TDP Award No.`: Official national grant identifier (e.g. `TDP-2023-IVB-00101`).
  3. `Student ID No.`: University student identification number (e.g. `21-0492`).
  4. `Last Name`: Student surname (e.g. `DELA CRUZ`).
  5. `Given Name`: Student first name (e.g. `JUAN`).
  6. `M.I.`: Middle initial (e.g. `P.`).
  7. `Degree Program`: Academic degree course (e.g. `BS Information Technology`).
  8. `Year Level`: Academic standing (`1` to `5`).
- **First Semester Payout (Columns 9–11):**
  9. `Total Amount Received`: Statutory stipend allowance (`₱7,500.00`).
  10. `Date Received`: Payout calendar date (`YYYY-MM-DD`).
  11. `Student's Signature`: Student acknowledgment receipt signature or bank electronic confirmation code.
- **Second Semester Payout (Columns 12–14):**
  12. `Total Amount Received`: Statutory stipend allowance (`₱7,500.00`).
  13. `Date Received`: Payout calendar date (`YYYY-MM-DD`).
  14. `Student's Signature`: Student acknowledgment receipt signature.

### 3.3. Summation Totals & Formulas
$$\text{First Semester Total} = \sum \text{First Sem Amounts}$$
$$\text{Second Semester Total} = \sum \text{Second Sem Amounts}$$
$$\text{Grand Total Payroll} = \text{First Semester Total} + \text{Second Semester Total}$$
*(Formatted with official double-underline accounting borders and native `=SUM()` formulas in Excel).*

### 3.4. Quadruple Institutional Signatory Hierarchy
1. **Certified Correct:** TES Focal Person / TDP Institutional Coordinator.
2. **Verified as to Enrollment:** University Registrar.
3. **Certified Funds Available:** Chief Accountant.
4. **Approved for Payment:** University President / Campus Director.

---

## 4. Roles, Stakeholders & RBAC Permissions

| Role | System Permission | Action Required |
|---|---|---|
| **Staff Coordinator** | Co-Author (`STAFF`) | Syncs verified grantees from Annex 3/4 billings, enters student profile details, and assists in payout distribution. |
| **Accounting Officer** | Co-Author (`ACCOUNTING`) | Audits payout amounts, verifies fund availability, runs bulk stipend auto-fills, and certifies correct. |
| **University Registrar** | Verification | Attests that every student listed on the payroll is officially enrolled for the term. |
| **Campus Director** | Executive Approval (`CAMPUS_DIRECTOR`) | Executes final approval authorizing the release of cash or electronic credits. |
| **Student Scholar** | Payee (`STUDENT`) | Signs or thumbmarks the payroll sheet upon receiving their ₱7,500 semester stipend. |

---

## 5. Step-by-Step Lifecycle Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Acct as Accounting Officer
    actor Staff as Staff Coordinator
    actor Director as Campus Director
    actor Student as Student Scholar
    participant System as MinSU DocTrack

    Staff->>System: Opens /documents/new?annex=9
    Staff->>System: Clicks "Import from Billings (Annex 3 / 4)"
    Note over System: Auto-populates student demographic & award profile
    Acct->>System: Clicks "Set All ₱7,500" for active semester
    Acct->>System: Submits draft to Director review queue
    Note over System: Status: SUBMITTED (Review Queue)
    Director->>System: Reviews payroll volume and budget allocation
    Director->>System: Executes digital approval
    Note over System: Status: APPROVED
    Acct->>System: Exports Excel payroll via /api/annex-9/export-excel
    Staff->>Student: Conducts payout; student signs physical payroll receipt
    Acct->>Director: Directs physical signing by Focal Person, Registrar, Accountant, President
    Acct->>System: Scans signed payroll and uploads PDF
    Note over System: Status: UPLOADED
```

---

## 6. System & Physical Output Artifacts

1. **Official Single-Tab Excel Workbook:** Downloadable via `/api/annex-9/export-excel?documentId=[id]`, reproducing `Annex9.xlsx` (`General Payroll` tab) with `=SUM()` formulas, thin cell borders, and 4-column signature hierarchy.
2. **Print-Optimized Payroll Canvas:** Formatted via `@media print` with filler rows preserving standard 25-row government ledger dimensions.
3. **Disbursement Evidence for Liquidation:** Serves as the primary legal evidence supporting the Fund Utilization Report (Annex 6).
