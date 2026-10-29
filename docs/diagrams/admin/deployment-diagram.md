# System Admin — Deployment Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Deployment Diagram  
> **Standard:** UML 2.5 Deployment Specification

---

## 1. Purpose

The Deployment Diagram shows how the administrative subsystem runs on physical and virtual nodes, including container boundaries, network ports, and storage partitions.

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
            ADMIN_BUNDLE["«artifact» Admin Dashboard Bundle<br/>(SPA React Components)"]
        end
    end

    subgraph SERVER_HOST["«device» University Server Host (Ubuntu Linux)"]
        subgraph DOCKER_HOST["«executionEnvironment» Docker Runtime"]

            subgraph PROXY_BOX["«node» Container: reverse-proxy"]
                NGINX["«executionEnvironment» Nginx 1.25 Alpine"]
            end

            subgraph APP_BOX["«node» Container: web-application"]
                NODE_ENV["«executionEnvironment» Node.js 20 LTS"]
                ADMIN_ROUTES["«artifact» Admin Route Handlers<br/>(/api/users, /api/audit-logs)"]
                PRISMA_ENGINE["«artifact» Prisma Query Engine"]
            end

            subgraph DB_BOX["«node» Container: postgres-database"]
                PG_ENGINE["«executionEnvironment» PostgreSQL 16 Alpine"]
                ADMIN_TABLES["«artifact» tables: users, audit_log, landing_page_config"]
            end

        end
    end

    ADMIN_BUNDLE -->|"HTTPS (TLS 1.3) / Port 443"| NGINX
    NGINX -->|"HTTP / Port 3000"| ADMIN_ROUTES
    ADMIN_ROUTES --> PRISMA_ENGINE
    PRISMA_ENGINE -->|"TCP / Port 5432"| PG_ENGINE
    PG_ENGINE --> ADMIN_TABLES

    class ADMIN_BUNDLE,ADMIN_ROUTES,PRISMA_ENGINE,ADMIN_TABLES artifactStyle
    class NGINX,NODE_ENV runtimeNode
    class PG_ENGINE dbNode
    class ADMIN_CLIENT,SERVER_HOST deviceNode
    class DOCKER_HOST,PROXY_BOX,APP_BOX,DB_BOX dockerNode

    %% ─── 📌 VISUAL LEGEND ───
    subgraph LEGEND ["📌 Diagram Legend"]
        direction TB
        L_Dev["<<device>> Physical / Virtual Server"]:::deviceNode
        L_Env["<<executionEnvironment>> Runtime Engine"]:::runtimeNode
        L_Art["<<artifact>> Software Executable / Bundle"]:::artifactStyle
        L_Db["<<executionEnvironment>> PostgreSQL Database"]:::dbNode
        L_Art -->|Network Protocol & Port| L_Env
        L_Env -.->|File Mount / Binding| L_Dev
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Deployment Role | MinSU Infrastructure Context |
|---|---|---|---|
| `<<device>>` Box | `fill:#F6F8F6, stroke:#1B5E20` | Physical hardware or operating system host | Client Workstation, Ubuntu Linux Server |
| `<<node>>` Container | `fill:#F1F8F1, stroke:#164D1C` | Isolated containerized execution node | Docker containers: reverse-proxy, web-application, postgres-database |
| `<<executionEnvironment>>` | `fill:#FFFFFF, stroke:#2E7D32` | Application runtime or software engine | Node.js 20 LTS, Nginx 1.25 Alpine, Headless Chromium |
| `<<artifact>>` | `fill:#DCEFDD, stroke:#1B5E20` | Packaged deployable binary or file | Next.js standalone build, Prisma engine, nginx.conf |
| 🟨 Database Engine | `fill:#FFF1C2, stroke:#F2B705` | Relational database runtime | PostgreSQL 16 Alpine Server |
| `-->` Solid Arrow | Network Communication Link | Transport protocol and network port | Port 443 (HTTPS), Port 3000 (Internal HTTP), Port 5432 (Internal TCP) |
| `-.->` Dashed Arrow | Storage Mount / Stream | Host volume bind mount or disk I/O | `./uploads` (Signed PDF scans) and `pgdata` (PostgreSQL WAL files) |


---

## 4. PlantUML Deployment Diagram

```plantuml
@startuml
skinparam nodeBackgroundColor #F1F8F1
skinparam nodeBorderColor #1B5E20
skinparam artifactBackgroundColor #DCEFDD

node "Admin Workstation" <<device>> as client {
  node "Web Browser" <<executionEnvironment>> {
    artifact "Admin Console Bundle" <<artifact>> as bundle
  }
}

node "MinSU Server Host" <<device>> as server {
  node "Docker Daemon" <<executionEnvironment>> {
    node "reverse-proxy" <<node>> as proxy {
      artifact "Nginx SSL Proxy" as nginx
    }
    node "web-app" <<node>> as webapp {
      artifact "Admin API & Pages" as adminApi
      artifact "Prisma Engine" as prisma
    }
    node "postgres-db" <<node>> as dbContainer {
      database "PostgreSQL 16" as pg
    }
  }
}

bundle --> nginx : "HTTPS : 443"
nginx --> adminApi : "HTTP : 3000"
adminApi --> prisma
prisma --> pg : "TCP : 5432"

@enduml
```

---

## 5. Deployment Principles

- Admin traffic enters over HTTPS with HTTP-only secure cookie validation.
- Administrative APIs run inside the isolated `web-application` container.
- Direct database access is restricted to the internal Docker bridge network on port 5432.
