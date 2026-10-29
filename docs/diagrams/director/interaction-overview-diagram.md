# Campus Director — Interaction Overview Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Interaction Overview Diagram  
> **Workflow:** Executive Review & Endorsement Orchestration

---

## 1. Purpose

The Interaction Overview Diagram joins high-level activity control flow with sequence interaction frames. It shows the control flow between distinct review operations.

---

## 2. Interaction Overview Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef controlNode fill:#1B5E20,stroke:#123F17,stroke-width:2px,color:#FFFFFF;
    classDef frameNode fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef decisionNode fill:#FFF1C2,stroke:#F2B705,stroke-width:1.5px,color:#1F2A24;

    Start(( )):::controlNode --> RefAuth["ref: Authenticate Director Session"]:::frameNode
    RefAuth --> RefFetchQueue["ref: Fetch /review Pending Documents"]:::frameNode
    
    RefFetchQueue --> HasPending{Pending documents exist?}:::decisionNode
    HasPending -- No --> EndNoQueue((( ))):::controlNode

    HasPending -- Yes --> SdInspect["sd: Inspect Annex Details & PDF Preview<br/>Director examines student roster & fiscal totals"]:::frameNode
    
    SdInspect --> DecisionAccept{Evaluation Decision}:::decisionNode

    DecisionAccept -- Endorsement --> RefApprove["ref: Execute Endorsement Sequence<br/>(Sets APPROVED, alerts preparer, logs audit)"]:::frameNode

    DecisionAccept -- Revisions Needed --> RefReturn["ref: Execute Return Sequence<br/>(Sets RETURNED, attaches feedback, unlocks form)"]:::frameNode

    RefApprove --> JoinDecisions(( )):::controlNode
    RefReturn --> JoinDecisions

    JoinDecisions --> ReviewMore{Review next document?}:::decisionNode
    ReviewMore -- Yes --> RefFetchQueue
    ReviewMore -- No --> EndDone((( ))):::controlNode

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

## 4. Interaction Stages & References

| Stage Frame | Diagram Type | Reference Link | Purpose |
|---|---|---|---|
| `Authenticate Director Session` | Sequence (`ref`) | System Auth | Validates session token and verifies `DIRECTOR` privileges. |
| `Fetch /review Pending Documents` | Sequence (`ref`) | Document Service | Loads documents with status `SUBMITTED` or `RESUBMITTED`. |
| `Inspect Annex Details & PDF Preview` | Inline (`sd`) | Review UI | Displays structured roster and compiles visual PDF preview. |
| `Execute Endorsement Sequence` | Sequence (`ref`) | [`sequence-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/director/sequence-diagram.md) | Executes 1-click approval transaction and notifies preparer. |
| `Execute Return Sequence` | Sequence (`ref`) | [`sequence-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/director/sequence-diagram.md) | Captures revision comments, updates status, and unlocks form. |

---

## 5. STE Rules Applied

- The diagram uses standard control flow symbols with nested interaction frames.
- Guard conditions on decision diamonds are mutually exclusive.
- Each branch resolves to a final node.
