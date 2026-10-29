# Interaction Overview Diagram: MinSU DocTrack Whole System

## 1. Description
This interaction overview diagram combines high-level decision logic with sequence interaction frames to orchestrate the entire institutional lifecycle of the Tulong Dunong Program (TDP). It models the transitions between authentication, student onboarding, operational annex compilation, executive approval, financial disbursement, and external transmittal.

## 2. ASD-STE100 Technical Specifications
- Structure major interaction stages inside sequence frames (`sd`).
- Model control flow between frames using activity decision diamonds.
- Include explicit error and revision loops for non-compliant states.
- Connect the final operational step to a terminal node.

---

## 3. System Interaction Overview Diagram (Mermaid)

```mermaid
graph TD
    StartNode([Start: Semester TDP Cycle Initiated]) --> Frame_Auth["sd: AuthenticateAndAuthorize<br/>- Validate session cookie<br/>- Enforce RBAC permissions"]

    Frame_Auth --> Frame_Call["sd: PublishApplicantCall<br/>- Set slot quotas and submission deadline<br/>- Display on public landing page"]

    Frame_Call --> Frame_Intake["sd: StudentApplicationIntake<br/>- Student registers & enters academic data<br/>- Uploads proof PDFs (<= 5MB)<br/>- Issues tracking code & printable slip"]

    Frame_Intake --> Frame_Eval["sd: CoordinatorEvaluation<br/>- Evaluate grades & indigency certificates<br/>- Compile Annex 2 TDP Masterlist<br/>- Submit to Executive Review Queue"]

    Frame_Eval --> Decision_Director{"Campus Director Decision"}

    Decision_Director -->|Return with Remarks| Frame_Return["sd: ProcessRevision<br/>- Notify coordinator of required changes<br/>- Reopen masterlist for editing"]
    Frame_Return --> Frame_Eval

    Decision_Director -->|1-Click Approve| Frame_Approve["sd: ExecutiveEndorsement<br/>- Stamp digital signature & verification hash<br/>- Lock masterlist against modifications<br/>- Record audit event"]

    Frame_Approve --> Frame_Financial["sd: AccountingReconciliation<br/>- Prepare Annex 9 Payroll & Annex 6 Ledgers<br/>- Validate zero variance (0.00 PHP)"]

    Frame_Financial --> Decision_Variance{"Is Variance == 0.00 PHP?"}

    Decision_Variance -->|No: Discrepancy| Frame_FixFin["sd: AdjustLedger<br/>- Highlight red cells & prompt officer balance"]
    Frame_FixFin --> Frame_Financial

    Decision_Variance -->|Yes: Balanced| Frame_Dispatch["sd: DispatchTransmittal<br/>- Upload wet-signed physical document scan<br/>- Bind courier tracking & control number<br/>- Deliver package to CHED / UniFAST"]

    Frame_Dispatch --> EndNode([End: Cycle Completed & Records Archived])

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Frame["sd: InteractionFrame<br/>(Sub-sequence scenario)"]:::legFrame
        L_Dec{"{Decision Node}"}:::legDec
        L_Term(["([Terminal / End])"]):::legTerm
        L_Frame --> L_Dec
        L_Dec -->|Approved / Success| L_Term
    end
    classDef legFrame fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legDec fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
    classDef legTerm fill:#123F17,stroke:#1B5E20,color:#fff;
```

---

## 4. Diagram Legend & Symbol Guide

| Symbol / Element | Syntax / Type | Technical Meaning | MinSU Interaction Context |
|---|---|---|---|
| `sd: FrameName` | `["sd: ..."]` | Sequence interaction scenario frame | Encapsulates an entire sequence flow (e.g., `AuthenticateAndAuthorize`, `ExecutiveEndorsement`) |
| `{Decision}` | `{"Decision"}` | Activity decision branch point | Campus Director decision gate (`1-Click Approve` vs. `Return with Remarks`) |
| `([Pill Node])` | `([Start / End])` | Lifecycle start or terminal archive node | Initiating semester intake or locking final records in archive |
| `-->` Solid Arrow | Control Flow Connector | Sequential hand-off between interaction frames | Passing state from student intake to coordinator compilation |
| `-->\|Label\|` | Guarded Branch | Conditional scenario path | "Yes: Balanced", "No: Discrepancy", "Return with Remarks" |
| 🟢 Green Box | `#F1F8F1` / `#1B5E20` | Successful Workflow Phase | Forward operational processing and executive approval |
| 🟡 Gold Diamond | `#FFF1C2` / `#B88A00` | Critical Institutional Checkpoint | Campus Director review and zero-variance fiscal math check |

---

## 5. Interaction Frame Descriptions
- **AuthenticateAndAuthorize**: Enforces role access boundaries before permitting administrative actions.
- **PublishApplicantCall**: Establishes the digital intake parameters for the upcoming semester.
- **StudentApplicationIntake**: Allows students to submit credentials and receive instant tracking slips.
- **CoordinatorEvaluation**: Filters applicants against scholarship criteria and builds official masterlists.
- **ExecutiveEndorsement**: Provides the Campus Director with a rapid, secure approval interface.
- **AccountingReconciliation**: Enforces exact fiscal alignment between disbursements and government allocations.
- **DispatchTransmittal**: Concludes the semester cycle by delivering digital and physical records to CHED.
