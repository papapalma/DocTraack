# System Admin — Deployment Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Deployment Diagram  
> **Standard:** UML 2.5 Deployment Specification

---

## 1. Purpose

The Deployment Diagram shows the hardware devices, Docker container boundaries, network ports, and persistent storage mounts that host the System Administrator subsystem.

---

## 2. Mermaid Deployment Diagram

```mermaid
flowchart TB
    classDef deviceNode fill:#F6F8F6,stroke:#1B5E20,stroke-width:2px,color:#1F2A24
    classDef dockerNode fill:#F1F8F1,stroke:#164D1C,stroke-width:2px,color:#164D1C
    classDef runtimeNode fill:#FFFFFF,stroke:#2E7D32,stroke-width:1.5px,color:#1F2A24
    classDef artifactStyle fill:#DCEFDD,stroke:#1B5E20,stroke-width:1px,color:#123F17
    classDef dbNode fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24

    subgraph ADMIN_CLIENT["«device» Administrator Workstation"]
        subgraph ADMIN_BROWSER["«executionEnvironment» Modern Web Browser"]
            ADMIN_BUNDLE["«artifact» Admin Dashboard Bundle<br/>• /users (Role & 2FA Management)<br/>• /audit-logs (Forensics Explorer)<br/>• /landing-editor (Split-Screen CMS)<br/>• Branding & Logo Controls"]
        end
    end

    subgraph SERVER_HOST["«device» University Server Host (Ubuntu Linux)"]
        subgraph DOCKER_HOST["«executionEnvironment» Docker Runtime"]

            subgraph PROXY_BOX["«node» Container: reverse-proxy"]
                NGINX["«executionEnvironment» Nginx 1.25 Alpine<br/>• TLS 1.3 Termination<br/>• Admin IP Guard & Rate Limiter"]
            end

            subgraph APP_BOX["«node» Container: web-application"]
                NODE_ENV["«executionEnvironment» Node.js 20 LTS"]
                ADMIN_ROUTES["«artifact» Admin Route Handlers<br/>• /api/users (User & 2FA Admin)<br/>• /api/audit-logs (Forensic Stream)<br/>• /api/landing (CMS Staging/Publish)<br/>• /api/branding/logo (Upload Handler)"]
                PRISMA_ENGINE["«artifact» Prisma Query Engine"]
            end

            subgraph DB_BOX["«node» Container: postgres-database"]
                PG_ENGINE["«executionEnvironment» PostgreSQL 16 Alpine<br/>Database: minsu_doctrack"]
            end

        end

        subgraph STORAGE_VOLS["«storage» Persistent Host Volumes"]
            LOGOS_VOL["Volume: ./storage/uploads/logos/<br/>(Institutional Seals & SVGs)"]
            LANDING_VOL["Volume: ./storage/uploads/landing/<br/>(Hero Banners & CMS Media)"]
            DB_VOL["Volume: ./docker/data/postgres/<br/>(Relational State & Audit Logs)"]
        end
    end

    ADMIN_BUNDLE -->|"HTTPS (TLS 1.3) / Port 443"| NGINX
    NGINX -->|"HTTP / Port 3000"| ADMIN_ROUTES
    ADMIN_ROUTES --> PRISMA_ENGINE
    PRISMA_ENGINE -->|"TCP / Port 5432"| PG_ENGINE
    PG_ENGINE -->|"Disk Block I/O"| DB_VOL
    ADMIN_ROUTES -->|"Write Sanitized Media"| LOGOS_VOL
    ADMIN_ROUTES -->|"Write Media Assets"| LANDING_VOL

    class ADMIN_BUNDLE,ADMIN_ROUTES,PRISMA_ENGINE artifactStyle
    class NGINX,NODE_ENV runtimeNode
    class PG_ENGINE dbNode
    class LOGOS_VOL,LANDING_VOL,DB_VOL deviceNode

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
| `«device»` | Double Angle Bracket | Hardware computational machine | Administrator Workstation, MinSU Linux Server Host |
| `«node»` | Container Box | Virtualized runtime environment | Reverse proxy, Node.js web application, PostgreSQL |
| `«artifact»` | Shaded Component | Executable software code or bundle | Admin client bundle, route handlers, query engine |
| `«storage»` | Volume Node | File system partition on host | Mounted logos volume, landing media volume, PostgreSQL data |

---

## 4. Deployment Specifications

- **Administrator Workstation**: Authenticated client accessing `/users`, `/audit-logs`, `/landing-editor`, and branding controls.
- **Reverse Proxy**: Enforces TLS 1.3 encryption, CSP headers, and administrative route protections.
- **Application Container**: Executes bcrypt hashing with 10 salt rounds and streams forensic audit logs.
- **Host Volumes**: Stores institutional crests and banners with sanitized paths (`path.basename`) and SVG script prevention headers.
