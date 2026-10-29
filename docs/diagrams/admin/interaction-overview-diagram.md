# System Admin — Interaction Overview Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Interaction Overview Diagram  
> **Workflow:** Administrative Governance & CMS Orchestration

---

## 1. Purpose

The Interaction Overview Diagram combines high-level procedural control flow with detailed interaction sequence frames across administrative operations.

---

## 2. Mermaid Interaction Overview Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef controlNode fill:#1B5E20,stroke:#123F17,stroke-width:2px,color:#FFFFFF;
    classDef frameNode fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef decisionNode fill:#FFF1C2,stroke:#F2B705,stroke-width:1.5px,color:#1F2A24;

    Start(( )):::controlNode --> RefAuth["ref: Authenticate Admin Session<br/>(Verify token & role == SYSTEM_ADMIN)"]:::frameNode
    
    RefAuth --> AdminChoice{Select Administrative Action}:::decisionNode

    %% Provisioning Branch
    AdminChoice -- User Management --> RefUser["ref: Provision User & Assign Role<br/>(See sequence-diagram.md)"]:::frameNode

    %% Audit Branch
    AdminChoice -- Security Audit --> RefAudit["ref: Ingest & Filter Audit Logs<br/>(Query chronological diffs)"]:::frameNode

    %% CMS Branch
    AdminChoice -- Landing CMS --> SdCMS["sd: Edit & Publish Landing CMS<br/>Admin updates banners, staging drafts & pushes live"]:::frameNode

    RefUser --> JoinAdmin(( )):::controlNode
    RefAudit --> JoinAdmin
    SdCMS --> JoinAdmin

    JoinAdmin --> ContinueAdmin{Perform another operation?}:::decisionNode
    ContinueAdmin -- Yes --> AdminChoice
    ContinueAdmin -- No --> EndAdmin((( ))):::controlNode

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

## 3. Diagram Legend & Symbol Guide

| Symbol / Element | Syntax / Type | Technical Meaning | MinSU Interaction Context |
|---|---|---|---|
| `sd: FrameName` | `["sd: ..."]` | Sequence interaction scenario frame | Encapsulates an entire sequence scenario (e.g., `Authenticate`, `ReviewQueue`) |
| `{Decision}` | `{"Decision"}` | Activity decision branch point | Critical decision gate (e.g., approval vs. return, variance check) |
| `([Pill Node])` | `([Start / End])` | Lifecycle start or terminal archive node | Initiating semester operations or locking final records in archive |
| `-->` Solid Arrow | Control Flow Connector | Sequential hand-off between frames | Passing control from one interaction frame to the next |
| `-->|Label|` | Guarded Branch | Conditional scenario path | "Yes: Approved", "No: Discrepancy", "Return with Remarks" |
| 🟢 Green Box | `#F1F8F1` / `#1B5E20` | Successful Workflow Phase | Forward operational processing and executive approval |
| 🟡 Gold Diamond | `#FFF1C2` / `#B88A00` | Institutional Checkpoint | Evaluation queue and zero-variance fiscal math check |


---

## 4. Interaction Frames Table

| Frame Name | Type | Reference / Scope | Purpose |
|---|---|---|---|
| `Authenticate Admin Session` | Sequence (`ref`) | `src/lib/auth.ts` | Validates session token and enforces `SYSTEM_ADMIN` privilege. |
| `Provision User & Assign Role` | Sequence (`ref`) | [`sequence-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/admin/sequence-diagram.md) | Validates credentials, executes bcrypt hash, and logs audit event. |
| `Ingest & Filter Audit Logs` | Sequence (`ref`) | `src/app/api/audit-logs` | Queries PostgreSQL audit logs with actor and entity filters. |
| `Edit & Publish Landing CMS` | Inline (`sd`) | `src/app/(dashboard)/landing-editor` | Saves draft changes and updates published JSON config. |
