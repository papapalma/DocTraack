# Accounting Officer — Deployment Diagram

> **Role:** `ACCOUNTING_OFFICER`  
> **Diagram Type:** Deployment Diagram  
> **Standard:** UML 2.5 Deployment Specification

---

## 1. Purpose

The Deployment Diagram shows the hardware devices, Docker container nodes, network protocols, and storage volumes supporting the Accounting Officer financial subsystem.

---

## 2. Mermaid Deployment Diagram

```mermaid
flowchart TB
    classDef deviceNode fill:#F6F8F6,stroke:#1B5E20,stroke-width:2px,color:#1F2A24
    classDef dockerNode fill:#F1F8F1,stroke:#164D1C,stroke-width:2px,color:#164D1C
    classDef runtimeNode fill:#FFFFFF,stroke:#2E7D32,stroke-width:1.5px,color:#1F2A24
    classDef artifactStyle fill:#DCEFDD,stroke:#1B5E20,stroke-width:1px,color:#123F17
    classDef dbNode fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24

    subgraph CLIENT_STATION["«device» Accounting Officer Workstation"]
        subgraph WEB_BROWSER["«executionEnvironment» Modern Web Browser"]
            ACCOUNTING_SPA["«artifact» Financial Dashboard Bundle<br/>• /documents (Annexes 6, 7, 8, 9)<br/>• Real-Time Ledger Table<br/>• Zero-Variance Indicator"]
        end
    end

    subgraph SERVER_HOST["«device» MinSU Campus Server Host"]
        subgraph DOCKER_ENGINE["«executionEnvironment» Docker Runtime"]

            subgraph PROXY_BOX["«node» Container: reverse-proxy"]
                NGINX["«executionEnvironment» Nginx 1.25 Alpine<br/>• TLS 1.3 Termination<br/>• Reverse Proxy / Port 3000"]
            end

            subgraph APP_BOX["«node» Container: web-application"]
                NODEJS["«executionEnvironment» Node.js 20 LTS"]
                FINANCIAL_APIS["«artifact» Financial Route Handlers<br/>• /api/documents/:id/submit<br/>• /api/annex-*/export-excel (ExcelJS)<br/>• /api/documents/:id/upload"]
                PRISMA["«artifact» Prisma Query Engine"]
            end

            subgraph DB_BOX["«node» Container: postgres-database"]
                PG_ENGINE["«executionEnvironment» PostgreSQL 16<br/>Database: minsu_doctrack"]
            end

        end

        subgraph STORAGE_VOLS["«storage» Persistent Host Volumes"]
            SCANS_VOL["Volume: ./storage/uploads/scans/<br/>(Wet-Signed Financial PDF Scans)"]
            DB_VOL["Volume: ./docker/data/postgres/<br/>(Relational State & Audit Logs)"]
        end
    end

    ACCOUNTING_SPA -->|"HTTPS (TLS 1.3) / Port 443"| NGINX
    NGINX -->|"HTTP / Port 3000"| FINANCIAL_APIS
    FINANCIAL_APIS --> PRISMA
    PRISMA -->|"TCP / Port 5432"| PG_ENGINE
    PG_ENGINE -->|"Disk Block I/O"| DB_VOL
    FINANCIAL_APIS -->|"Write Signed Scans"| SCANS_VOL

    class ACCOUNTING_SPA,FINANCIAL_APIS,PRISMA artifactStyle
    class NGINX,NODEJS runtimeNode
    class PG_ENGINE dbNode
    class SCANS_VOL,DB_VOL deviceNode

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
| `«device»` | Double Angle Bracket | Hardware computational machine | Accounting Workstation, MinSU Linux Server |
| `«node»` | Container Box | Virtualized runtime environment | Reverse proxy, Node.js web application, PostgreSQL |
| `«artifact»` | Shaded Component | Executable software code or bundle | Financial SPA, ExcelJS exporter, Prisma engine |
| `«storage»` | Volume Node | File system partition on host | Mounted scans volume, PostgreSQL database blocks |

---

## 4. Deployment Specifications

- **Accounting Workstation**: Executes client-side currency math and renders real-time balanced indicators.
- **Reverse Proxy**: Handles HTTPS encryption and proxies requests to the Next.js application container.
- **Application Container**: Runs the in-memory zero-variance calculator and streams native multi-tab `ExcelJS` files.
- **Database Container**: Persists financial ledger line items, approval transitions, and audit records with disk volume mounting.
