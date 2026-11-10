# Composite Structure Diagram: Campus Director Domain

> **Role:** `CAMPUS_DIRECTOR`  
> **Diagram Type:** Composite Structure Diagram  
> **Classifier:** `DirectorExecutiveSubsystem`

---

## 1. Purpose

This Composite Structure Diagram depicts the internal architecture of the `DirectorExecutiveSubsystem`. It shows how incoming executive commands pass through the director access gate to controllers for review, endorsement, verification oversight, and KPI analytics, connecting downstream to database adapters and notification emitters.

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

    subgraph SUBSYSTEM["«classifier» DirectorExecutiveSubsystem"]
        direction TB

        %% Boundary Ingress Port
        pHttpDirectorIn["Port: pHttpDirectorIn<br/>(Director HTTPS Requests / API Routes)"]:::portStyle

        %% Layer 1: Security & RBAC Gate
        subgraph LAYER_SECURITY ["Access Control Gate"]
            guard["guard : DirectorRBACGuard<br/>• verifySessionToken()<br/>• enforceRole('CAMPUS_DIRECTOR')"]:::guardStyle
        end

        %% Layer 2: Role Specific Controllers
        subgraph LAYER_CONTROLLERS ["Role Specific Controllers"]
            reviewQueueCtrl["reviewQueueCtrl : ReviewQueueController<br/>• getPendingQueue()<br/>• filterByUrgency()<br/>• getSLAStatus()"]:::ctrlStyle

            endorsementCtrl["endorsementCtrl : EndorsementController<br/>• approveDocument()<br/>• lockDocumentRecord()<br/>• stampEndorsement()"]:::ctrlStyle

            revisionCtrl["revisionCtrl : RevisionCommentController<br/>• returnDocument()<br/>• attachRevisionComment()<br/>• reopenForEditing()"]:::ctrlStyle

            verifyOversightCtrl["verifyOversightCtrl : VerificationOversightController<br/>• inspectMatchResults()<br/>• signOffVerificationRun()"]:::ctrlStyle

            analyticsCtrl["analyticsCtrl : KPIAnalyticsController<br/>• getApprovalVelocity()<br/>• getTurnaroundMetrics()<br/>• evaluateComplianceScore()"]:::ctrlStyle
        end

        %% Layer 3: Domain Entity Models
        subgraph LAYER_MODELS ["Domain Entity Models"]
            documentModel["documentModel : DocumentModel<br/>- id, title, annexType, status, metadata"]:::modelStyle
            verifyRunModel["verifyRunModel : VerificationRunModel<br/>- id, matchedCount, discrepancyCount"]:::modelStyle
            statusHistoryModel["statusHistoryModel : StatusHistoryModel<br/>- id, fromStatus, toStatus, actorId"]:::modelStyle
            commentModel["commentModel : CommentModel<br/>- id, documentId, userId, content"]:::modelStyle
        end

        %% Layer 4: Downstream Services & Adapters
        subgraph LAYER_DOWNSTREAM ["Downstream Pipeline & Cloud Sinks"]
            notifier["notifier : InAppNotificationEmitter<br/>• notifyPreparer('APPROVED')<br/>• notifyPreparer('RETURNED')"]:::svcStyle

            auditLogger["auditLogger : AuditEventEmitter<br/>• emit('DOCUMENT_APPROVED')<br/>• emit('DOCUMENT_RETURNED')"]:::svcStyle

            prismaAdapter["prismaAdapter : PrismaClientAdapter<br/>• document.update()<br/>• statusHistory.create()<br/>• comment.create()"]:::adapterStyle
        end

        %% Boundary Egress Ports
        pDbPostgresOut["Port: pDbPostgresOut<br/>(PostgreSQL Connection Pool)"]:::portStyle
        pAuditLogOut["Port: pAuditLogOut<br/>(Append-Only Audit Sink)"]:::portStyle
        pNotificationOut["Port: pNotificationOut<br/>(Realtime WebSocket / Toast Stream)"]:::portStyle

        %% Connectors
        pHttpDirectorIn --> guard
        guard --> reviewQueueCtrl
        guard --> endorsementCtrl
        guard --> revisionCtrl
        guard --> verifyOversightCtrl
        guard --> analyticsCtrl

        reviewQueueCtrl --> documentModel
        endorsementCtrl --> documentModel
        endorsementCtrl --> statusHistoryModel
        revisionCtrl --> commentModel
        verifyOversightCtrl --> verifyRunModel

        documentModel --> prismaAdapter
        statusHistoryModel --> prismaAdapter
        commentModel --> prismaAdapter
        verifyRunModel --> prismaAdapter

        endorsementCtrl --> notifier
        revisionCtrl --> notifier
        endorsementCtrl --> auditLogger
        revisionCtrl --> auditLogger

        notifier --> pNotificationOut
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
| `«classifier»` | Subsystem Classifier | Encapsulates internal structural parts | `DirectorExecutiveSubsystem` |
| `Port` | Port Boundary | Ingress/egress interaction gate | HTTP Ingress, Notification Out, PostgreSQL DB Out |
| `part` | Internal Component Part | Role controller or internal service | `EndorsementController`, `KPIAnalyticsController` |
| `-->` | Connector | Structural delegation or data flow | Routes authorized commands to downstream persistence |
