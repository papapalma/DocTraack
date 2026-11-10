# Campus Director — Deployment Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Deployment Diagram  
> **Standard:** UML 2.5 Deployment Specification

---

## 1. Purpose

The Deployment Diagram shows the physical devices, execution containers, network connections, and runtime software artifacts supporting the Campus Director review queue and analytics dashboard.

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

    subgraph DIRECTOR_WORKSTATION["<<device>> Campus Director Workstation / Tablet"]
        subgraph WEB_BROWSER["<<executionEnvironment>> Modern Web Browser (Safari / Chrome)"]
            DIRECTOR_SPA["<<artifact>> Next.js Client Bundle<br/>• /review (Executive Queue)<br/>• /analytics (Turnaround KPIs)<br/>• /announcements (Broadcasts)<br/>• 2FA Verification Modal"]:::artifactStyle
        end
    end

    subgraph SERVER_HOST["<<device>> MinSU Campus Server Host"]
        subgraph DOCKER_ENGINE["<<executionEnvironment>> Docker Runtime"]

            subgraph PROXY_BOX["<<node>> Container: reverse-proxy"]
                NGINX_PROXY["<<executionEnvironment>> Nginx SSL Reverse Proxy<br/>• HTTPS TLS 1.3 Termination<br/>• Rate Limit Shield"]:::runtimeNode
            end

            subgraph APP_BOX["<<node>> Container: web-application"]
                NODE_RUNTIME["<<executionEnvironment>> Node.js 20 LTS"]:::runtimeNode
                REVIEW_API["<<artifact>> Executive Endorsement Controller<br/>• /api/documents/:id/approve<br/>• /api/documents/:id/return<br/>• /api/verification/:id/sign-off"]:::artifactStyle
                ANALYTICS_ENGINE["<<artifact>> Turnaround Analytics Controller<br/>• /api/analytics (SLA Metrics)"]:::artifactStyle
            end

            subgraph DB_BOX["<<node>> Container: postgres-database"]
                PG_SERVER["<<executionEnvironment>> PostgreSQL 16<br/>Database: minsu_doctrack"]:::dbNode
            end

        end

        subgraph STORAGE_VOLS["<<storage>> Persistent Host Volumes"]
            DOC_DATA["Volume: ./docker/data/postgres/<br/>(Relational State & Audit Logs)"]:::deviceNode
            SCANS_DATA["Volume: ./storage/uploads/scans/<br/>(Signed PDF Scans)"]:::deviceNode
        end
    end

    %% Network Paths
    DIRECTOR_SPA -->|"HTTPS / Port 443"| NGINX_PROXY
    NGINX_PROXY -->|"HTTP / Port 3000"| REVIEW_API
    NGINX_PROXY -->|"HTTP / Port 3000"| ANALYTICS_ENGINE
    REVIEW_API -->|"TCP / Port 5432"| PG_SERVER
    ANALYTICS_ENGINE -->|"TCP / Port 5432"| PG_SERVER
    PG_SERVER -->|"Disk I/O"| DOC_DATA
    REVIEW_API -->|"Read File Stream"| SCANS_DATA

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Device["<<device>>: Physical Hardware"]:::deviceNode
        L_Node["<<node>>: Docker Container"]:::runtimeNode
        L_Art["<<artifact>>: Software Artifact"]:::artifactStyle
        L_Store["<<storage>>: Host Storage Volume"]:::deviceNode
        L_Device -.-> L_Node -.-> L_Art -.-> L_Store
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Deployment Concept | MinSU Implementation |
|---|---|---|---|
| `<<device>>` | Double Bracket Box | Physical hardware machine | Director Workstation / iPad, Campus Server Host |
| `<<node>>` | Container Box | Virtualized service environment | Reverse proxy, Node.js web application, PostgreSQL |
| `<<artifact>>` | Shaded Component | Executable software code or bundle | Next.js review SPA, executive controllers, analytics route |
| `<<storage>>` | File Volume Box | Block storage volume | PostgreSQL database directory, scanned PDFs storage |

---

## 4. Deployment Specifications

- **Director Device**: Optimized for desktop browsers and tablet touch interfaces with responsive PDF rendering.
- **Reverse Proxy**: Enforces TLS 1.3 encryption and validates session cookies before reaching the application container.
- **Web Application Container**: Houses the review and return controller, enforcing that only `CAMPUS_DIRECTOR` roles can execute endorsement operations.
- **Database Container**: Stores tamper-evident `status_history` and `audit_log` records on a persistent volume mount.
