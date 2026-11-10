# Staff Coordinator — Component Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Component Diagram  
> **Standard:** UML 2.5 Component Specification

---

## 1. Purpose

The Component Diagram shows the software components, provided interfaces, and required dependencies within the Staff Coordinator operational subsystem.

---

## 2. Mermaid Component Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef compStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef ifaceStyle fill:#DCEFDD,stroke:#123F17,stroke-width:1.5px,color:#123F17;
    classDef dataComp fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;

    subgraph PRESENTATION["Presentation Layer"]
        DocUI["<<component>><br/>Document Preparation Form"]:::compStyle
        QueueUI["<<component>><br/>Registration Validation Queue"]:::compStyle
        VerifyUI["<<component>><br/>3-Way Verification View"]:::compStyle
        CertUI["<<component>><br/>Certificate Designer UI"]:::compStyle
        AnnounceUI["<<component>><br/>Announcement Editor"]:::compStyle
        RegistryUI["<<component>><br/>Outgoing Registry View"]:::compStyle
    end

    subgraph SECURITY["Security Layer"]
        StaffGuard["<<component>><br/>Staff RBAC Guard"]:::compStyle
    end

    subgraph SERVICES["Staff Operations Services"]
        DocService["<<component>><br/>Annex Document Service"]:::compStyle
        QueueService["<<component>><br/>Student Validation Service"]:::compStyle
        VerifyService["<<component>><br/>3-Way Verification Engine"]:::compStyle
        CertService["<<component>><br/>Certificate Designer Service"]:::compStyle
        ExportService["<<component>><br/>ExcelJS & Word Exporter"]:::compStyle
        AnnounceService["<<component>><br/>Announcement Service"]:::compStyle
        TransmittalService["<<component>><br/>Transmittal Registry Service"]:::compStyle
    end

    subgraph STORAGE["Storage Subsystem"]
        PrismaClient["<<component>><br/>Prisma ORM Client"]:::dataComp
        DiskStorage["<<component>><br/>Local File Storage (/uploads)"]:::dataComp
    end

    %% Interfaces
    IStaff(["IStaffGuard"]):::ifaceStyle
    IDocOps(["IDocOperations"]):::ifaceStyle
    IValidation(["IStudentValidation"]):::ifaceStyle
    IVerify(["IVerificationEngine"]):::ifaceStyle
    ICert(["ICertificateDesigner"]):::ifaceStyle
    IExport(["IDocumentExporter"]):::ifaceStyle
    IAnnounce(["IAnnouncementOps"]):::ifaceStyle
    ITransmit(["ITransmittalRegistry"]):::ifaceStyle
    IDB(["IDataAccess"]):::ifaceStyle

    %% Connections
    DocUI --> IStaff
    QueueUI --> IStaff
    VerifyUI --> IStaff
    CertUI --> IStaff

    IStaff --> DocService
    IStaff --> QueueService
    IStaff --> VerifyService
    IStaff --> CertService

    DocService --> IDocOps
    QueueService --> IValidation
    VerifyService --> IVerify
    CertService --> ICert
    ExportService --> IExport
    AnnounceService --> IAnnounce
    TransmittalService --> ITransmit

    DocService --> IExport
    VerifyService --> IExport
    CertService --> IExport
    DocService --> ITransmit

    DocService --> IDB
    QueueService --> IDB
    VerifyService --> IDB
    CertService --> IDB
    TransmittalService --> IDB

    IDB --> PrismaClient
    DocService --> DiskStorage
    CertService --> DiskStorage

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Comp["[Component Box]: Software Module"]:::compStyle
        L_Iface(["(Round Pin): Provided Interface"]):::ifaceStyle
        L_Data["[Gold Box]: Data Store / Storage"]:::dataComp
        L_Comp --> L_Iface --> L_Data
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Component Meaning | MinSU Implementation |
|---|---|---|---|
| `[Component]` | `["<<component>>\nName"]` | Autonomous modular unit with internal logic | Document Service, Verification Engine, Certificate Designer |
| `(Interface)` | `(["IName"])` | Formal contract or API boundary | `IVerificationEngine`, `IDocumentExporter`, `IStudentValidation` |
| `Solid Arrow` | `-->` | Direct dependency or communication invocation | UI invokes services through validated interfaces |
| `Data Component` | Gold Tone `#FFF1C2` | Persistence or storage component | Prisma ORM client and local file system storage |

---

## 4. Component Responsibilities

- **Document Preparation Form (`DocUI`)**: Collects Annex 1-5 and 10 dynamic form inputs with real-time field validation.
- **Registration Validation Queue (`QueueUI`)**: Displays submitted student registrations for batch `ACCEPT` or `REJECT` processing.
- **3-Way Verification Engine (`VerifyService`)**: Ingests CHED and Registrar CSV datasets, executes fuzzy cross-matching, and tracks discrepancy resolution.
- **Certificate Designer Service (`CertService`)**: Allows Staff to design award templates, configure signatories, and generate Word (`.doc`) outputs.
- **ExcelJS & Word Exporter (`ExportService`)**: Compiles validated grantee rosters into multi-tab `.xlsx` workbooks and official letters.
