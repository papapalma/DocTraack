# Campus Director — Composite Structure Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Composite Structure Diagram  
> **Classifier:** `ExecutiveReviewEngine`

---

## 1. Purpose

The Composite Structure Diagram shows the internal parts, ports, and connectors of the `ExecutiveReviewEngine` that processes document reviews and endorsements.

---

## 2. Mermaid Composite Structure Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef classifierStyle fill:#F6F8F6,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef partStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef portStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:1.5px,color:#1F2A24;

    subgraph ENGINE["<<classifier>> ExecutiveReviewEngine"]
        %% Ports
        pIn["Port: pIn<br/>(Director Commands)"]:::portStyle
        pPreview["Port: pPreview<br/>(PDF Stream Out)"]:::portStyle
        pDbTx["Port: pDbTx<br/>(Prisma Transaction)"]:::portStyle
        pNotify["Port: pNotify<br/>(Notification Out)"]:::portStyle

        %% Parts
        subgraph PARTS["Internal Parts"]
            GuardPart["guard : SignatoryValidator"]:::partStyle
            QueueLoader["queueLoader : ReviewQueueLoader"]:::partStyle
            EndorseExec["endorseExec : StateTransitionExecutor"]:::partStyle
            FeedbackPart["feedback : FeedbackAttacher"]:::partStyle
            VelocityPart["velocity : VelocityCalculator"]:::partStyle
        end

        %% Connectors
        pIn --> GuardPart
        GuardPart --> QueueLoader
        GuardPart --> EndorseExec
        GuardPart --> FeedbackPart
        GuardPart --> VelocityPart

        QueueLoader --> pPreview
        EndorseExec --> pDbTx
        EndorseExec --> pNotify
        FeedbackPart --> pDbTx
        FeedbackPart --> pNotify
        VelocityPart --> pDbTx
    end

    %% ─── 📌 VISUAL LEGEND ───
    subgraph LEGEND ["📌 Diagram Legend"]
        direction TB
        L_Class["<<classifier>><br/>Encapsulating Unit"]:::classifierStyle
        L_Port["Port: pName<br/>(Interface Gate)"]:::portStyle
        L_Part["part : InternalComponent"]:::partStyle
        L_Port -->|Delegation| L_Part
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Structural Role | MinSU System Implementation |
|---|---|---|---|
| Outer Classifier | `subgraph UNIT` (`#F6F8F6`) | Encapsulating software unit | Domain engine or controller containing internal operational logic |
| 🟨 Port Node | `pName` (`#FFF1C2` / `#F2B705`) | Interaction boundary / gate | Inbound HTTP ports, state change events, database ports |
| ⬜ Internal Part | `part : Class` (`#FFFFFF` / `#1B5E20`) | Component instance owned by classifier | Schema validators, state machines, PDF compilers, audit loggers |
| `-->` Connector | Solid Arrow | Internal connector or port delegation | Linking external ports to internal validators and persistent adapters |


---

## 4. Parts and Ports Table

| Element | Type | Purpose |
|---|---|---|
| `pIn` | Port | Ingests approval, return, and queue view requests. |
| `guard` | Part (`SignatoryValidator`) | Verifies Director role and document reviewability. |
| `queueLoader` | Part (`ReviewQueueLoader`) | Loads submitted documents and prepares PDF streams. |
| `endorseExec` | Part (`StateTransitionExecutor`) | Transitions document status to `APPROVED`. |
| `feedback` | Part (`FeedbackAttacher`) | Attaches revision notes and transitions status to `RETURNED`. |
| `velocity` | Part (`VelocityCalculator`) | Aggregates SLA turnaround times. |
| `pDbTx` | Port | Executes atomic database transactions. |
| `pNotify` | Port | Dispatches instant alerts to document preparers. |
