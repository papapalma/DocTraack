# Composite Structure Diagram: Accounting Officer Domain

> **Role:** `ACCOUNTING` (`ACCOUNTING_OFFICER`)  
> **Diagram Type:** Composite Structure Diagram  
> **Classifier:** `AccountingFiscalSubsystem`

---

## 1. Purpose

This Composite Structure Diagram depicts the internal architecture of the `AccountingFiscalSubsystem`. It shows how financial commands pass through the accounting access gate to controllers for Annexes 6, 7, 8, and 9, zero-variance math engines, ExcelJS workbook generators, and PostgreSQL persistence.

---

## 2. Mermaid Composite Structure Diagram

```mermaid
flowchart TB
    %% Styling Classes
    classDef classifierStyle fill:#F6F8F6,stroke:#1B5E20,stroke-width:2.5px,color:#1F2A24
    classDef portStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24
    classDef guardStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:1.5px,color:#123F17
    classDef ctrlStyle fill:#EFF6FF,stroke:#2563EB,stroke-width:1.5px,color:#1E3A8A
    classDef modelStyle fill:#FAF5FF,stroke:#9333EA,stroke-width:1.5px,color:#581C87
    classDef svcStyle fill:#FEFCE8,stroke:#CA8A04,stroke-width:1.5px,color:#713F12
    classDef adapterStyle fill:#DCEFDD,stroke:#164D1C,stroke-width:2px,color:#123F17

    subgraph SUBSYSTEM["«classifier» AccountingFiscalSubsystem"]
        direction TB

        %% Boundary Ingress Port
        pHttpAccountingIn["Port: pHttpAccountingIn<br/>(Accounting HTTP Actions / Financial APIs)"]:::portStyle

        %% Layer 1: Security & RBAC Gate
        subgraph LAYER_SECURITY ["Access Control Gate"]
            guard["guard : AccountingRBACGuard<br/>• verifySessionToken()<br/>• enforceRole('ACCOUNTING_OFFICER')"]:::guardStyle
        end

        %% Layer 2: Role Specific Controllers
        subgraph LAYER_CONTROLLERS ["Role Specific Controllers"]
            financialAnnexCtrl["financialAnnexCtrl : FinancialAnnexController<br/>• draftAnnex6FundUtilization()<br/>• draftAnnex7AdviceToDebit()<br/>• recordAnnex8ChecksIssued()"]:::ctrlStyle

            payrollCompilerCtrl["payrollCompilerCtrl : BeneficiaryPayrollController<br/>• importStudentBeneficiaries()<br/>• calculateStipendTiers()<br/>• compileAnnex9Payroll()"]:::ctrlStyle

            balanceValidatorCtrl["balanceValidatorCtrl : ZeroVarianceReconciliationController<br/>• compareAllocatedVsDisbursed()<br/>• enforceZeroVariance()"]:::ctrlStyle
        end

        %% Layer 3: Domain Entity Models
        subgraph LAYER_MODELS ["Domain Entity Models"]
            documentModel["documentModel : DocumentModel<br/>- id, title, annexType, status, formData"]:::modelStyle
            payrollModel["payrollModel : PayrollEntryModel<br/>- studentIdNumber, studentName, stipendAmount"]:::modelStyle
            varianceModel["varianceModel : VarianceSummaryModel<br/>- allocated, disbursed, variance"]:::modelStyle
            statusHistoryModel["statusHistoryModel : StatusHistoryModel<br/>- id, fromStatus, toStatus, remarks"]:::modelStyle
        end

        %% Layer 4: Downstream Services & Export Sinks
        subgraph LAYER_DOWNSTREAM ["Downstream Pipeline & Export Sinks"]
            varianceValidator["varianceValidator : ZeroVarianceValidator<br/>• assertZeroVariancePHP()"]:::svcStyle
            excelExporter["excelExporter : ExcelJSExporter<br/>• buildMultiTabWorkbooks()<br/>• formatCurrencyPHP()"]:::svcStyle
            auditLogger["auditLogger : AuditEventEmitter<br/>• emit('FINANCIAL_ANNEX_SUBMITTED')"]:::svcStyle
            prismaAdapter["prismaAdapter : PrismaClientAdapter<br/>• documents, statusHistory, auditLogs"]:::adapterStyle
        end

        %% Boundary Egress Ports
        pDbPostgresOut["Port: pDbPostgresOut<br/>(PostgreSQL Connection Pool)"]:::portStyle
        pExcelExportOut["Port: pExcelExportOut<br/>(Native Multi-Tab Excel Stream)"]:::portStyle
        pAuditLogOut["Port: pAuditLogOut<br/>(Append-Only Audit Sink)"]:::portStyle

        %% Connectors
        pHttpAccountingIn --> guard
        guard --> financialAnnexCtrl
        guard --> payrollCompilerCtrl
        guard --> balanceValidatorCtrl

        financialAnnexCtrl --> documentModel
        payrollCompilerCtrl --> payrollModel
        balanceValidatorCtrl --> varianceModel

        balanceValidatorCtrl --> varianceValidator
        financialAnnexCtrl --> excelExporter
        payrollCompilerCtrl --> excelExporter

        documentModel --> prismaAdapter
        payrollModel --> prismaAdapter
        statusHistoryModel --> prismaAdapter

        excelExporter --> pExcelExportOut
        auditLogger --> pAuditLogOut
        prismaAdapter --> pDbPostgresOut
    end

    %% ─── 📌 VISUAL LEGEND ───
    subgraph LEGEND ["📌 Diagram Legend"]
        direction TB
        L_Class["<<classifier>><br/>Encapsulating Unit"]:::classifierStyle
        L_Port["Port: pName<br/>(Interface Gate)"]:::portStyle
        L_Part["part : InternalComponent"]:::ctrlStyle
        L_Port -->|Delegation| L_Part
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Symbol | UML Concept | Technical Function | MinSU Operational Meaning |
|---|---|---|---|
| `«classifier»` | Subsystem Classifier | Encapsulates internal structural parts | `AccountingFiscalSubsystem` |
| `Port` | Port Boundary | Ingress/egress interaction gate | HTTP Ingress, Excel Stream Out, PostgreSQL Out |
| `part` | Internal Component Part | Role controller or internal service | `FinancialAnnexController`, `ZeroVarianceValidator` |
| `-->` | Connector | Structural delegation or data flow | Delegates verified ledgers to persistence and export |
