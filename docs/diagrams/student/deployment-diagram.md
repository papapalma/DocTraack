# Student Applicant — Deployment Diagram

> **Role:** `STUDENT`  
> **Diagram Type:** Deployment Diagram  
> **Standard:** UML 2.5 Deployment Specification

---

## 1. Purpose

The Deployment Diagram shows the hardware devices, mobile clients, Docker container boundaries, and network topologies supporting the Student Portal, Microsoft Authenticator 2FA, and application intake.

---

## 2. Mermaid Deployment Diagram

```mermaid
flowchart TB
    classDef deviceNode fill:#F6F8F6,stroke:#1B5E20,stroke-width:2px,color:#1F2A24
    classDef dockerNode fill:#F1F8F1,stroke:#164D1C,stroke-width:2px,color:#164D1C
    classDef runtimeNode fill:#FFFFFF,stroke:#2E7D32,stroke-width:1.5px,color:#1F2A24
    classDef artifactStyle fill:#DCEFDD,stroke:#1B5E20,stroke-width:1px,color:#123F17
    classDef dbNode fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24

    subgraph STUDENT_DEVICES["«device» Student Hardware Nodes (Public Internet)"]
        MOBILE["Smartphone (iOS / Android)<br/>• Mobile Browser (/portal)<br/>• Microsoft Authenticator App (2FA)"]
        LAPTOP["Personal Computer / Laptop<br/>• Chrome / Edge / Firefox"]
    end

    subgraph SERVER_HOST["«device» MinSU Campus Server Host"]
        subgraph DOCKER_ENGINE["«executionEnvironment» Docker Runtime"]

            subgraph PROXY_BOX["«node» Container: reverse-proxy"]
                NGINX["«executionEnvironment» Nginx 1.25 Alpine<br/>• HTTPS TLS 1.3 Termination<br/>• Rate Limit: 10 applies/hr/IP, 20 status/min"]
            end

            subgraph APP_BOX["«node» Container: web-application"]
                NODEJS["«executionEnvironment» Node.js 20 LTS"]
                PORTAL_BUNDLE["«artifact» Student Portal Bundle<br/>• /portal (Active Calls & Applications)<br/>• /portal/profile (RA 10173 Locked Editor)<br/>• /api/registrations (Intake API)<br/>• /api/auth/2fa (TOTP Auth Route)"]
                PRISMA["«artifact» Prisma Query Engine"]
            end

            subgraph DB_BOX["«node» Container: postgres-database"]
                PG_ENGINE["«executionEnvironment» PostgreSQL 16<br/>Database: minsu_doctrack"]
            end

        end

        subgraph STORAGE_VOLS["«storage» Persistent Host Volumes"]
            PROOFS_VOL["Volume: ./storage/uploads/proofs/<br/>(Applicant Scanned Attachments <= 5MB)"]
            DB_VOL["Volume: ./docker/data/postgres/<br/>(Relational State & Registrations)"]
        end
    end

    MOBILE -->|"HTTPS (TLS 1.3) / Port 443"| NGINX
    LAPTOP -->|"HTTPS (TLS 1.3) / Port 443"| NGINX
    NGINX -->|"HTTP Forward / Port 3000"| PORTAL_BUNDLE
    PORTAL_BUNDLE --> PRISMA
    PRISMA -->|"TCP / Port 5432"| PG_ENGINE
    PG_ENGINE -->|"Disk Block I/O"| DB_VOL
    PORTAL_BUNDLE -->|"Write Proof Buffers"| PROOFS_VOL

    class MOBILE,LAPTOP,PROOFS_VOL,DB_VOL deviceNode
    class NGINX,NODEJS runtimeNode
    class PORTAL_BUNDLE,PRISMA artifactStyle
    class PG_ENGINE dbNode

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Device["«device»: Physical Machine"]:::deviceNode
        L_Node["«node»: Container Host"]:::runtimeNode
        L_Art["«artifact»: Code Artifact"]:::artifactStyle
        L_Store["«storage»: Host Mounted Volume"]:::deviceNode
        L_Device -.-> L_Node -.-> L_Art -.-> L_Store
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Deployment Concept | MinSU Implementation |
|---|---|---|---|
| `«device»` | Double Angle Bracket | Hardware computational machine | Student Mobile / PC, MinSU Server Host |
| `«node»` | Container Box | Virtualized runtime environment | Reverse proxy, Node.js web application, PostgreSQL |
| `«artifact»` | Shaded Component | Executable software code or bundle | Student Portal SPA, Registration API, Prisma engine |
| `«storage»` | Volume Node | File system partition on host | Mounted proofs storage volume, PostgreSQL data blocks |

---

## 4. Deployment Specifications

- **Student Devices**: Interacts via responsive mobile browsers and generates 6-digit TOTP codes with Microsoft Authenticator.
- **Reverse Proxy**: Enforces anti-brute-force rate limiting (maximum 10 public submissions per IP per hour) and shields against DDoS attacks.
- **Application Container**: Sanitizes multipart proof uploads, validates 5 MB size thresholds, and issues cryptographic tracking codes.
- **Persistent Volumes**: Stores student attachments on dedicated disk mounts and commits registration rows to PostgreSQL.
