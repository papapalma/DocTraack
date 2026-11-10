# Composite Structure Diagram: Whole System

> **System:** MinSU DocTrack  
> **Diagram Type:** Composite Structure Diagram  
> **Classifier:** `DocumentWorkflowSubsystem`

---

## 1. Purpose

This Composite Structure Diagram depicts the internal architecture of the `DocumentWorkflowSubsystem`, the central engine of MinSU DocTrack. It shows how incoming API requests route through the global role guard to core controllers (documents, 3-way verification, multi-format export, certificate designer, announcements), how controllers connect to domain models, and where data moves downstream to schema validators, Excel/Word generators, audit dispatchers, notification emitters, and database adapters.

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

    subgraph SUBSYSTEM["«classifier» DocumentWorkflowSubsystem"]
        direction TB

        %% Boundary Ingress Port
        pHttpApiIn["Port: pHttpApiIn<br/>(HTTP Request Ingress / API Routes)"]:::portStyle

        %% Layer 1: Security & RBAC Gate
        subgraph LAYER_SECURITY ["Access Control Gate"]
            guard["guard : GlobalRBACGuard<br/>• verifySessionToken()<br/>• enforceRolePermissions()<br/>• checkRateLimits()"]:::guardStyle
        end

        %% Layer 2: Core Subsystem Controllers
        subgraph LAYER_CONTROLLERS ["Subsystem Controllers"]
            documentCtrl["documentCtrl : DocumentController<br/>• createAnnex()<br/>• submitToReview()<br/>• approveDocument()<br/>• returnDocument()"]:::ctrlStyle

            verificationCtrl["verificationCtrl : VerificationController<br/>• runTripartiteMatch()<br/>• calculateFuzzyScore()<br/>• resolveDiscrepancy()"]:::ctrlStyle

            exportCtrl["exportCtrl : MultiFormatExportController<br/>• streamExcelJSWorkbook()<br/>• streamWordDocx()"]:::ctrlStyle

            certCtrl["certCtrl : CertificateController<br/>• designTemplate()<br/>• renderCanvas()<br/>• resetDefaults()"]:::ctrlStyle

            announcementCtrl["announcementCtrl : AnnouncementController<br/>• publishAnnouncement()<br/>• togglePin()<br/>• filterAudience()"]:::ctrlStyle

            transmittalCtrl["transmittalCtrl : TransmittalController<br/>• createTransmittal()<br/>• attachSignedScan()<br/>• dispatchToAgency()"]:::ctrlStyle
        end

        %% Layer 3: Domain Entity Models
        subgraph LAYER_MODELS ["Domain Entity Models"]
            documentModel["documentModel : DocumentModel<br/>- id: String<br/>- title: String<br/>- annexType: AnnexType<br/>- status: DocumentStatus"]:::modelStyle

            verificationModel["verificationModel : VerificationModel<br/>- runNumber: Int<br/>- results: VerificationResult[]<br/>- discrepancyCounts: Json"]:::modelStyle

            announcementModel["announcementModel : AnnouncementModel<br/>- title: String<br/>- category: String<br/>- targetAudience: String"]:::modelStyle

            transmittalModel["transmittalModel : TransmittalModel<br/>- id: String<br/>- recipient: String<br/>- driveLink: String"]:::modelStyle
        end

        %% Layer 4: Infrastructure Services
        subgraph LAYER_SERVICES ["Downstream Services & Adapters"]
            excelService["excelService : ExcelJSEngine"]:::svcStyle
            auditLogger["auditLogger : ImmutableAuditLogger"]:::svcStyle
            prismaAdapter["prismaAdapter : PostgreSQLDataAdapter"]:::adapterStyle
        end

        %% Boundary Egress Ports
        pDbOut["Port: pDbOut<br/>(Prisma TCP Pool)"]:::portStyle
        pFileOut["Port: pFileOut<br/>(Storage Mount)"]:::portStyle
    end

    %% Internal Connectors
    pHttpApiIn --> guard
    guard --> documentCtrl
    guard --> verificationCtrl
    guard --> exportCtrl
    guard --> certCtrl
    guard --> announcementCtrl
    guard --> transmittalCtrl

    documentCtrl --> documentModel
    verificationCtrl --> verificationModel
    announcementCtrl --> announcementModel
    transmittalCtrl --> transmittalModel

    documentCtrl --> excelService
    verificationCtrl --> excelService
    documentCtrl --> auditLogger
    verificationCtrl --> auditLogger

    documentModel --> prismaAdapter
    verificationModel --> prismaAdapter
    announcementModel --> prismaAdapter
    auditLogger --> prismaAdapter

    prismaAdapter --> pDbOut
    transmittalCtrl --> pFileOut
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Concept | MinSU System Implementation |
|---|---|---|---|
| `Port` | `fill:#FFF1C2` | Subsystem Interaction Point | HTTP API Ingress (`pHttpApiIn`), Database Egress (`pDbOut`) |
| `Controller Part` | `fill:#EFF6FF` | Internal Component Part | `documentCtrl`, `verificationCtrl`, `exportCtrl`, `certCtrl` |
| `Internal Connector` | `-->` | Inter-part delegation | Guard routes valid requests to controllers; controllers mutate models |
