# Composite Structure Diagram: Student Applicant Domain

> **Role:** `STUDENT` (Public Scholarship Portal & Applicant)  
> **Diagram Type:** Composite Structure Diagram  
> **Classifier:** `StudentPortalSubsystem`

---

## 1. Purpose

This Composite Structure Diagram depicts the internal architecture of the `StudentPortalSubsystem`. It shows how student requests route through rate limiting and 2FA guards to specialized controllers for scholarship applications, tracking lookups, and RA 10173 profile maintenance, connecting downstream to database adapters and proof storage.

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

    subgraph SUBSYSTEM["«classifier» StudentPortalSubsystem"]
        direction TB

        %% Boundary Ingress Port
        pHttpPortalIn["Port: pHttpPortalIn<br/>(Student Requests / Portal Form Posts)"]:::portStyle

        %% Layer 1: Security & Rate Limiting Gate
        subgraph LAYER_SECURITY ["Security & Rate Limiting Gate"]
            guard["guard : PortalSecurityShield<br/>• verifyRateLimit(10 req/hr)<br/>• verifyTwoFactorTOTP()<br/>• enforceAntiIdor(studentId == session.id)"]:::guardStyle
        end

        %% Layer 2: Role Specific Controllers
        subgraph LAYER_CONTROLLERS ["Portal Specific Controllers"]
            callBrowserCtrl["callBrowserCtrl : PublicCallController<br/>• listActiveCalls()<br/>• verifyDeadline()"]:::ctrlStyle

            applicationIntakeCtrl["applicationIntakeCtrl : ApplicationController<br/>• validateBiodata()<br/>• generateTrackingCode()<br/>• submitApplication()"]:::ctrlStyle

            profileCtrl["profileCtrl : ProfileMaintenanceController<br/>• enforceIdentityLock(RA 10173)<br/>• updateGwaAndContacts()"]:::ctrlStyle

            trackingLookupCtrl["trackingLookupCtrl : TrackingLookupController<br/>• resolveTrackingCode()<br/>• getReviewProgress()"]:::ctrlStyle

            receiptSlipCtrl["receiptSlipCtrl : ReceiptSlipController<br/>• renderReceiptSlipPdf()"]:::ctrlStyle
        end

        %% Layer 3: Domain Entity Models
        subgraph LAYER_MODELS ["Domain Entity Models"]
            registrationModel["registrationModel : RegistrationModel<br/>- studentIdNumber, fullName, identityLocked, gwa"]:::modelStyle
            applicationModel["applicationModel : ApplicationModel<br/>- id, callId, trackingCode, status, formData"]:::modelStyle
            attachmentModel["attachmentModel : AttachmentModel<br/>- id, applicationId, fileUrl, fileSize"]:::modelStyle
            trackingModel["trackingModel : TrackingStatusModel<br/>- trackingCode, status, submittedAt"]:::modelStyle
        end

        %% Layer 4: Downstream Services & Storage Sinks
        subgraph LAYER_DOWNSTREAM ["Downstream Pipeline & Storage Sinks"]
            codeGen["codeGen : CryptoSlugGenerator<br/>• format('TDP-YYYY-XXXX')"]:::svcStyle
            proofWriter["proofWriter : FileStorageWriter<br/>• writeProofBuffer(max 5MB)"]:::svcStyle
            receiptRenderer["receiptRenderer : PdfSlipRenderer<br/>• compileSlip()"]:::svcStyle
            prismaAdapter["prismaAdapter : PrismaClientAdapter<br/>• registrations, applications, attachments"]:::adapterStyle
        end

        %% Boundary Egress Ports
        pDbPostgresOut["Port: pDbPostgresOut<br/>(PostgreSQL Connection Pool)"]:::portStyle
        pProofStorageOut["Port: pProofStorageOut<br/>(Local Storage /uploads/proofs)"]:::portStyle
        pReceiptStreamOut["Port: pReceiptStreamOut<br/>(Downloadable PDF Stream)"]:::portStyle

        %% Connectors
        pHttpPortalIn --> guard
        guard --> callBrowserCtrl
        guard --> applicationIntakeCtrl
        guard --> profileCtrl
        guard --> trackingLookupCtrl

        applicationIntakeCtrl --> codeGen
        applicationIntakeCtrl --> proofWriter
        applicationIntakeCtrl --> applicationModel
        applicationIntakeCtrl --> attachmentModel

        profileCtrl --> registrationModel
        trackingLookupCtrl --> trackingModel
        trackingLookupCtrl --> receiptSlipCtrl
        receiptSlipCtrl --> receiptRenderer

        registrationModel --> prismaAdapter
        applicationModel --> prismaAdapter
        attachmentModel --> prismaAdapter

        proofWriter --> pProofStorageOut
        receiptRenderer --> pReceiptStreamOut
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
| `«classifier»` | Subsystem Classifier | Encapsulates internal structural parts | `StudentPortalSubsystem` |
| `Port` | Port Boundary | Ingress/egress interaction gate | HTTP Ingress, Proofs Storage Out, PostgreSQL Out |
| `part` | Internal Component Part | Role controller or internal service | `ApplicationController`, `ProfileMaintenanceController` |
| `-->` | Connector | Structural delegation or data flow | Delegates verified application data to storage adapters |
