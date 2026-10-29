# Campus Director — Deployment Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Deployment Diagram  
> **Standard:** UML 2.5 Deployment Specification

---

## 1. Purpose

The Deployment Diagram shows the physical nodes, execution environments, and runtime artifacts supporting the Campus Director review queue and analytics views.

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
        subgraph WEB_BROWSER["<<executionEnvironment>> Modern Web Browser"]
            DIRECTOR_SPA["<<artifact>> Review & Analytics Client Bundle<br/>(React UI & Recharts Analytics)"]:::artifactStyle
        end
    end

    subgraph SERVER_HOST["<<device>> University Server Host"]
        subgraph DOCKER_ENGINE["<<executionEnvironment>> Docker Runtime"]

            subgraph PROXY_BOX["<<node>> Container: reverse-proxy"]
                NGINX_PROXY["<<executionEnvironment>> Nginx SSL Reverse Proxy"]:::runtimeNode
            end

            subgraph APP_BOX["<<node>> Container: web-application"]
                NODE_RUNTIME["<<executionEnvironment>> Node.js 20 LTS"]:::runtimeNode
                REVIEW_API["<<artifact>> Review & Endorsement Endpoints<br/>(/api/documents/[id]/approve, /return)"]:::artifactStyle
                ANALYTICS_ENGINE["<<artifact>> Velocity Analytics Route<br/>(/api/analytics)"]:::artifactStyle
            end

            subgraph DB_BOX["<<node>> Container: postgres-database"]
                PG_SERVER["<<executionEnvironment>> PostgreSQL 16"]:::dbNode
                DOC_DATA["<<artifact>> documents & status_history Tables"]:::artifactStyle
            end

        end
    end

    %% Network Paths
    DIRECTOR_SPA -->|HTTPS / Port 443| NGINX_PROXY
    NGINX_PROXY -->|HTTP / Port 3000| REVIEW_API
    NGINX_PROXY -->|HTTP / Port 3000| ANALYTICS_ENGINE
    REVIEW_API --> PG_SERVER
    ANALYTICS_ENGINE --> PG_SERVER
    PG_SERVER --> DOC_DATA

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

node "Director Tablet / Workstation" <<device>> as directorDevice {
  node "Web Browser" <<executionEnvironment>> {
    artifact "Review & Analytics Bundle" as clientBundle
  }
}

node "MinSU Server Host" <<device>> as host {
  node "Docker Daemon" <<executionEnvironment>> {
    node "reverse-proxy" as proxy {
      artifact "Nginx Gateway" as nginx
    }
    node "web-app" as app {
      artifact "Endorsement API" as api
      artifact "Analytics Route" as analytics
    }
    node "postgres-db" as db {
      database "PostgreSQL 16" as pg
    }
  }
}

clientBundle --> nginx : "HTTPS : 443"
nginx --> api : "HTTP : 3000"
nginx --> analytics : "HTTP : 3000"
api --> pg : "TCP : 5432"
analytics --> pg : "TCP : 5432"

@enduml
```

---

## 5. Deployment Principles

- The Director client receives compiled interactive charts generated by Recharts without browser plugins.
- Review and return commands traverse the secure Nginx reverse proxy.
- Database queries use internal container connections protected from public exposure.
