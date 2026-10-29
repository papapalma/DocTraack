# Staff Coordinator — Interaction Overview Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Interaction Overview Diagram  
> **Workflow:** Annex Preparation, Revision Loops, Scan Ingestion & Transmittal

---

## 1. Purpose

The Interaction Overview Diagram coordinates high-level staff activities with detailed sequence reference frames across the document lifecycle.

---

## 2. Mermaid Interaction Overview Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef controlNode fill:#1B5E20,stroke:#123F17,stroke-width:2px,color:#FFFFFF;
    classDef frameNode fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef decisionNode fill:#FFF1C2,stroke:#F2B705,stroke-width:1.5px,color:#1F2A24;

    Start(( )):::controlNode --> RefDraft["ref: Prepare Annex Document Draft<br/>(Staff inputs student roster into form)"]:::frameNode
    RefDraft --> RefSubmit["ref: Submit Annex for Executive Review<br/>(Sets status to SUBMITTED)"]:::frameNode

    RefSubmit --> ReviewDecision{Review Outcome?}:::decisionNode

    ReviewDecision -- Returned --> SdFix["sd: Read Director Comments & Correct Fields<br/>Staff updates defective data in form"]:::frameNode
    SdFix --> RefSubmit

    ReviewDecision -- Approved --> SdSign["sd: Print Official PDF & Apply Wet-Signatures<br/>Signatories sign physical university copy"]:::frameNode
    
    SdSign --> RefUploadScan["ref: Execute Signed Scan Upload<br/>(Streams PDF to /uploads, sets UPLOADED)"]:::frameNode
    
    RefUploadScan --> RefTransmit["ref: Record Agency Transmittal<br/>(Logs courier & Google Drive URL, sets TRANSMITTED)"]:::frameNode

    RefTransmit --> End((( ))):::controlNode

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

| Frame Name | Type | Reference Link | Purpose |
|---|---|---|---|
| `Prepare Annex Document Draft` | Sequence (`ref`) | `src/components/documents` | Ingests student and stipend records into dynamic schema. |
| `Submit Annex for Executive Review` | Sequence (`ref`) | `src/app/api/documents/[id]/submit` | Validates form and places document into Director review queue. |
| `Read Director Comments & Correct Fields` | Inline (`sd`) | Review Comments | Unlocks form and applies feedback corrections. |
| `Print Official PDF & Apply Wet-Signatures` | Inline (`sd`) | Manual Step | Hardcopy printing and physical university dry seal. |
| `Execute Signed Scan Upload` | Sequence (`ref`) | [`sequence-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/staff/sequence-diagram.md) | Ingests binary PDF scan and marks status `UPLOADED`. |
| `Record Agency Transmittal` | Sequence (`ref`) | [`sequence-diagram.md`](file:///c:/Users/Paolo%20Amor%20P.%20Palma/Desktop/NICKO/docs/diagrams/staff/sequence-diagram.md) | Dispatches package to CHED and updates Outgoing Registry. |
