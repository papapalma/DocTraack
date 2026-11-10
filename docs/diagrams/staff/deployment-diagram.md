# Staff Coordinator — Deployment Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Deployment Diagram  
> **Standard:** UML 2.5 Deployment Specification

---

## 1. Purpose

The Deployment Diagram shows the hardware nodes, execution containers, file storage volumes, and external cloud integrations that host Staff Coordinator services.

---

## 2. Mermaid Deployment Diagram

```mermaid
flowchart TB
    %% Styling Classes
    classDef deviceNode fill:#F6F8F6,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef dockerNode fill:#F1F8F1,stroke:#164D1C,stroke-width:2px,color:#164D1C;
    classDef runtimeNode fill:#FFFFFF,stroke:#2E7D32,stroke-width:1.5px,color:#1F2A24;
    classDef artifactStyle fill:#DCEFDD,stroke:#1B5E20,stroke-width:1px,color:#123F17;
    classDef dbNode fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;
    classDef cloudNode fill:#FFF1C2,stroke:#55645B,stroke-width:1.5px,stroke-dasharray: 4 4,color:#1F2A24;

    subgraph STAFF_STATION["<<device>> Staff Coordinator Workstation"]
        subgraph WEB_BROWSER["<<executionEnvironment>> Web Browser (Chrome / Edge / Firefox)"]
            STAFF_SPA["<<artifact>> Next.js Client Bundle<br/>• /documents (Annex 1-5, 10)<br/>• /registrations (Validation Queue)<br/>• /verification (3-Way Matching UI)<br/>• /certificate-editor (Designer UI)"]:::artifactStyle
        end
    end

    subgraph SERVER_HOST["<<device>> MinSU Campus Server Host"]
        subgraph DOCKER_ENGINE["<<executionEnvironment>> Docker Runtime"]

            subgraph PROXY_CONTAINER["<<node>> Container: reverse-proxy"]
                NGINX["<<executionEnvironment>> Nginx 1.25<br/>• HTTPS TLS 1.3 Termination<br/>• 15MB Multipart Upload Limit"]:::runtimeNode
            end

            subgraph APP_CONTAINER["<<node>> Container: web-application"]
                NODEJS["<<executionEnvironment>> Node.js 20 LTS"]:::runtimeNode
                STAFF_APIS["<<artifact>> Next.js Server Controllers<br/>• /api/verification/run (CSV Matcher)<br/>• /api/registrations (Identity Lock)<br/>• /api/certificate-template (Layouts)<br/>• /api/annex-*/export-excel (ExcelJS)"]:::artifactStyle
                PRISMA["<<artifact>> Prisma Engine Client"]:::artifactStyle
            end

            subgraph DB_CONTAINER["<<node>> Container: postgres-database"]
                PG_ENGINE["<<executionEnvironment>> PostgreSQL 16<br/>Database: minsu_doctrack"]:::dbNode
            end

        end

        subgraph MOUNTED_STORAGE["<<storage>> Host Mounted Volumes"]
            UPLOADS_VOL["Volume: ./storage/uploads/scans/<br/>(Wet-Signed PDF Scans)"]:::deviceNode
            LOGOS_VOL["Volume: ./storage/uploads/logos/<br/>(Institutional Seals & Signatures)"]:::deviceNode
            DB_VOL["Volume: ./docker/data/postgres/<br/>(Persistent Relational Storage)"]:::deviceNode
        end
    end

    subgraph CLOUD_STORAGE["<<cloud>> External Services"]
        GDRIVE["Google Drive API / Cloud Sinks<br/>(Transmittal Backup Folders)"]:::cloudNode
    end

    %% Network Connections
    STAFF_SPA -->|"HTTPS / Port 443"| NGINX
    NGINX -->|"HTTP Reverse Proxy / Port 3000"| APP_CONTAINER
    APP_CONTAINER -->|"TCP / Port 5432"| DB_CONTAINER
    APP_CONTAINER -->|"File System I/O"| UPLOADS_VOL
    APP_CONTAINER -->|"Read Logo Buffers"| LOGOS_VOL
    DB_CONTAINER -->|"Block Storage I/O"| DB_VOL
    APP_CONTAINER -->|"HTTPS REST API"| GDRIVE

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Device["<<device>>: Hardware Node"]:::deviceNode
        L_Exec["<<executionEnvironment>>: Container / Engine"]:::runtimeNode
        L_Art["<<artifact>>: Software Component / Script"]:::artifactStyle
        L_Store["<<storage>>: Persistent Storage Volume"]:::deviceNode
        L_Device -.-> L_Exec -.-> L_Art -.-> L_Store
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Deployment Concept | MinSU Implementation |
|---|---|---|---|
| `<<device>>` | Double Bracket Node | Hardware computational machine | Coordinator workstation, campus physical server host |
| `<<executionEnvironment>>` | Runtime Sub-node | Container or execution platform | Docker engine, Node.js 20, PostgreSQL 16 engine |
| `<<artifact>>` | Shaded Pill / Box | Deployed software artifact | Next.js SPA bundle, API route handlers, Prisma engine |
| `<<storage>>` | File Volume Box | Persistent file system partition | Scanned PDFs volume, logo upload repository, database blocks |

---

## 4. Deployment Specifications

- **Client Workstation**: Renders the administrative SPA bundles with client-side CSV validation and fast fuzzy match previews.
- **Reverse Proxy**: Enforces a 15 MB file upload limit and routes requests securely to Node.js on port 3000.
- **Application Container**: Runs the in-memory 3-way cross-matching engine, ExcelJS streaming buffers, and dynamic Word generators.
- **PostgreSQL Container**: Stores normalized grantee records, audit events, and verification runs with persistent host disk volume mounting.
