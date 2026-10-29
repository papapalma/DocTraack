# Activity Diagram: MinSU DocTrack Whole System

## 1. Description
This activity diagram models the end-to-end institutional workflow for the Tulong Dunong Program (TDP) across an entire academic semester. It traces actions, decisions, and handoffs through five swimlanes representing the Student Applicant, Staff Coordinator, Campus Director, Accounting Officer, and CHED Agency.

## 2. ASD-STE100 Technical Specifications
- Organize parallel and sequential actions into explicit actor swimlanes.
- Use diamond nodes for decisions with mutually exclusive guard conditions.
- Synchronize concurrent activities with fork and join bars.
- End all execution branches at terminal final nodes.

---

## 3. Institutional TDP Workflow Diagram (Mermaid)

```mermaid
graph TD
    %% Initial Node
    StartNode([Start: Academic Semester Begins]) --> A1

    subgraph Lane_Staff ["Staff Coordinator"]
        A1["Publish Annex 2 Scholarship Call<br/>(Set slot quota & cutoff date)"]
        A4["Review Submitted Student Applications"]
        A5["Compile Verified Students into Annex 2 Masterlist"]
        A6["Submit Annex 2 to Executive Queue"]
        A12["Scan Wet-Signed Physical Document"]
        A13["Upload Scanned PDF & Sync Google Drive"]
        A14["Package Transmittal & Record Courier Details"]
    end

    subgraph Lane_Student ["Student Applicant"]
        A2["Browse Call on Public Portal"]
        A3["Submit Application Form & Proof Scans"]
        A3_Receipt["Receive Tracking Code & Printable Receipt"]
    end

    subgraph Lane_Director ["Campus Director"]
        A7["Open Executive Review Queue"]
        D1{"Approve Annex?"}
        A8["Stamp Endorsement & Digital Signature"]
        A9["Return Document with Revision Notes"]
    end

    subgraph Lane_Accounting ["Accounting Officer"]
        A10["Prepare Annex 9 Payroll & Annex 6 Utilization"]
        D2{"Check Variance == 0.00?"}
        A11["Submit Balanced Financial Ledgers"]
        A10_Fix["Adjust Ledger Discrepancy"]
    end

    subgraph Lane_Agency ["CHED / External Agency"]
        A15["Receive Physical & Digital Transmittal"]
        A16["Acknowledge Receipt & Release Funds"]
    end

    %% Flow Connections
    A1 --> A2
    A2 --> A3
    A3 --> A3_Receipt
    A3_Receipt --> A4
    A4 --> A5
    A5 --> A6
    A6 --> A7
    A7 --> D1

    D1 -->|No: Needs Changes| A9
    A9 --> A5

    D1 -->|Yes: Approved| A8
    A8 --> A10

    A10 --> D2
    D2 -->|No: Discrepancy| A10_Fix
    A10_Fix --> A10

    D2 -->|Yes: Balanced| A11
    A11 --> A12
    A12 --> A13
    A13 --> A14
    A14 --> A15
    A15 --> A16

    A16 --> EndNode([End: Semester Cycle Complete & Archived])

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Start(["([Pill]): Start / End Node"]):::legStart
        L_Act["[Rectangle]: Operational Action"]:::legAct
        L_Dec{"{Diamond}: Guard Decision"}:::legDec
        L_App["Approved / Balanced Flow"]:::legApp
        L_Ret["Returned / Variance Fix"]:::legRet
        L_Start -.-> L_Act -.-> L_Dec
        L_Dec -.->|Condition Met| L_App
        L_Dec -.->|Discrepancy| L_Ret
    end
    classDef legStart fill:#123F17,stroke:#1B5E20,color:#fff;
    classDef legAct fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legDec fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
    classDef legApp fill:#DCEFDD,stroke:#1B5E20,color:#123F17;
    classDef legRet fill:#FEE2E2,stroke:#DC2626,color:#991B1B;
```

---

## 4. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Node Type | Technical Role | MinSU Domain Meaning |
|---|---|---|---|
| `([Pill Shape])` | `([Start / End])` | Initial or terminal workflow boundary | Academic semester opening & final archive closure |
| `[Rectangle]` | `["Action"]` | Operational process or staff task | Compiling Annex 2, verifying credentials, uploading signed scans |
| `{Diamond}` | `{"Decision"}` | Mutually exclusive condition / guard | "Approve Annex?" (Director) or "Variance == 0.00?" (Accounting) |
| `──▶` | Solid Line `-->` | Sequential flow transition | Standard forward progression between steps |
| `-->\|Label\|` | Guarded Branch | Conditional execution branch | "Yes: Approved", "No: Needs Changes", "Discrepancy" |
| 🔲 Subgraph | `subgraph Lane_Role` | Departmental Swimlane Boundary | Segregates duties between Student, Staff, Director, Accounting, and CHED |
| 🟢 Green Box | `#DCEFDD` / `#1B5E20` | MinSU Approval & Success State | Campus Director endorsement and balanced account records |
| 🟡 Gold Box | `#FFF1C2` / `#B88A00` | Review & Verification Gate | Executive evaluation queue and conditional checks |
| 🔴 Red / Rose Box | `#FEE2E2` / `#DC2626` | Revision & Discrepancy Alert | Document returned for revisions or ledger discrepancy adjustment |

---

## 5. Workflow Stages & Hand-offs
1. **Intake Phase**: The staff coordinator publishes the TDP call. Prospective students register, upload required documents, and receive tracking codes.
2. **Operational Compilation Phase**: The staff coordinator verifies enrollment and grade certificates, compiles the Annex 2 masterlist, and sends it to the executive queue.
3. **Executive Endorsement Phase**: The campus director evaluates the compiled masterlist. If revisions are required, the director returns the record with comments; otherwise, the director stamps approval.
4. **Financial Reconciliation Phase**: The accounting officer compiles the Annex 9 payroll and Annex 6 fund utilization. The system enforces zero variance against government grants before permitting submission.
5. **Transmittal & Dispatch Phase**: The staff coordinator uploads wet-signed physical scans, binds external agency tracking numbers, and transmits the package to CHED.
