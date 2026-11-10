# Composite Structure Diagram: System Administrator Domain

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Composite Structure Diagram  
> **Classifier:** `AdminRoleSubsystem`

---

## 1. Purpose

This Composite Structure Diagram depicts the internal architecture of the `AdminRoleSubsystem`. It shows how administrative requests route through the role guard to controllers for user accounts, 2FA security, audit log forensics, Landing Page CMS, branding, and rate limits, connecting downstream to database adapters and disk sinks.

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

    subgraph SUBSYSTEM["«classifier» AdminRoleSubsystem"]
        direction TB

        %% Boundary Ingress Port
        pHttpAdminIn["Port: pHttpAdminIn<br/>(Admin HTTPS Requests / API Routes)"]:::portStyle

        %% Layer 1: Security Guard
        subgraph LAYER_SECURITY ["Access Control Gate"]
            guard["guard : AdminRBACGuard<br/>• verifySessionToken()<br/>• enforceRole('SYSTEM_ADMIN')"]:::guardStyle
        end

        %% Layer 2: Role Specific Controllers
        subgraph LAYER_CONTROLLERS ["Role Specific Controllers"]
            userCtrl["userCtrl : UserController<br/>• createUser()<br/>• updateUserRole()<br/>• resetTwoFactor()"]:::ctrlStyle

            auditCtrl["auditCtrl : AuditLogController<br/>• getAuditLogs()<br/>• filterByCategory()<br/>• exportAuditCSV()"]:::ctrlStyle

            cmsCtrl["cmsCtrl : LandingCMSController<br/>• saveDraftSections()<br/>• publishLandingPage()"]:::ctrlStyle

            brandingCtrl["brandingCtrl : BrandingController<br/>• uploadLogo()<br/>• updateHeaderTokens()"]:::ctrlStyle

            rateLimitCtrl["rateLimitCtrl : RateLimitController<br/>• toggleRateLimiting()<br/>• clearIpBlocks()"]:::ctrlStyle
        end

        %% Layer 3: Domain Entity Models
        subgraph LAYER_MODELS ["Domain Entity Models"]
            userModel["userModel : UserModel<br/>- id, email, role, active, twoFactorEnabled"]:::modelStyle
            auditModel["auditModel : AuditLogModel<br/>- id, actorId, action, entity, details"]:::modelStyle
            cmsModel["cmsModel : LandingConfigModel<br/>- draftSections, publishedSections, hasChanges"]:::modelStyle
            brandingModel["brandingModel : BrandingModel<br/>- institutionName, primaryLogoUrl, partnerLogoUrl"]:::modelStyle
        end

        %% Layer 4: Downstream Services & Persistence
        subgraph LAYER_DOWNSTREAM ["Downstream Pipeline & Storage Sinks"]
            hasher["hasher : BcryptHasher<br/>• hash(password, salt=10)"]:::svcStyle
            logoWriter["logoWriter : FileStorageWriter<br/>• writeUploadedLogos()"]:::svcStyle
            csvWriter["csvWriter : CsvStreamWriter<br/>• exportAuditRows()"]:::svcStyle
            prismaAdapter["prismaAdapter : PrismaClientAdapter<br/>• users, auditLogs, landingConfig, branding"]:::adapterStyle
        end

        %% Boundary Egress Ports
        pDbPostgresOut["Port: pDbPostgresOut<br/>(PostgreSQL Connection Pool)"]:::portStyle
        pLogosDiskOut["Port: pLogosDiskOut<br/>(Host Storage /uploads/logos)"]:::portStyle
        pAuditCsvOut["Port: pAuditCsvOut<br/>(Forensic CSV Stream)"]:::portStyle

        %% Connectors
        pHttpAdminIn --> guard
        guard --> userCtrl
        guard --> auditCtrl
        guard --> cmsCtrl
        guard --> brandingCtrl
        guard --> rateLimitCtrl

        userCtrl --> hasher
        userCtrl --> userModel
        auditCtrl --> auditModel
        auditCtrl --> csvWriter
        cmsCtrl --> cmsModel
        brandingCtrl --> brandingModel
        brandingCtrl --> logoWriter

        userModel --> prismaAdapter
        auditModel --> prismaAdapter
        cmsModel --> prismaAdapter
        brandingModel --> prismaAdapter

        logoWriter --> pLogosDiskOut
        csvWriter --> pAuditCsvOut
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
| `«classifier»` | Subsystem Classifier | Encapsulates internal structural parts | `AdminRoleSubsystem` |
| `Port` | Port Boundary | Ingress/egress interaction gate | HTTP Ingress, Logo Storage Out, PostgreSQL Out |
| `part` | Internal Component Part | Role controller or internal service | `UserController`, `LandingCMSController`, `BrandingController` |
| `-->` | Connector | Structural delegation or data flow | Routes administrative commands to database persistence |
