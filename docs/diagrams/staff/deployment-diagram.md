# Staff Coordinator — Deployment Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Deployment Diagram  
> **Standard:** UML 2.5 Deployment Specification

---

## 1. Purpose

The Deployment Diagram shows the hardware nodes, containers, storage mounts, and external cloud integrations that execute Staff coordinator operations.

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
        subgraph WEB_BROWSER["<<executionEnvironment>> Web Browser"]
            STAFF_SPA["<<artifact>> Staff Dashboard Bundle<br/>(Annex Form Builders & Outgoing Registry)"]:::artifactStyle
        end
    end

    subgraph SERVER_HOST["<<device>> MinSU Server Host"]
        subgraph DOCKER_ENGINE["<<executionEnvironment>> Docker Runtime"]

            subgraph PROXY_CONTAINER["<<node>> Container: reverse-proxy"]
                NGINX["<<executionEnvironment>> Nginx 1.25"]:::runtimeNode
            end

            subgraph APP_CONTAINER["<<node>> Container: web-application"]
                NODEJS["<<executionEnvironment>> Node.js 20 LTS"]:::runtimeNode
                STAFF_APIS["<<artifact>> Staff Handlers (/api/documents, /api/calls)"]:::artifactStyle
                PRISMA["<<artifact>> Prisma Engine"]:::artifactStyle
            end

            subgraph DB_CONTAINER["<<node>> Container: postgres-database"]
                PG_ENGINE["<<executionEnvironment>> PostgreSQL 16"]:::dbNode
            end

        end

        subgraph MOUNTED_STORAGE["<<storage>> Host Mounted Volume"]
            UPLOADS_VOL["Volume: ./uploads/scans/<br/>(Wet-Signed PDF Scans)"]:::deviceNode
        end
    end

    subgraph CLOUD_STORAGE["<<cloud>> External Services"]
        GDRIVE["Google Drive Storage<br/>(External Transmittal Folders)"]:::cloudNode
    end

    %% Network Paths
    STAFF_SPA -->|HTTPS : 443| NGINX
    NGINX -->|HTTP : 3000| STAFF_APIS
    STAFF_APIS --> PRISMA
    PRISMA -->|TCP : 5432| PG_ENGINE
    STAFF_APIS -->|File Stream Write| UPLOADS_VOL
    STAFF_SPA -.->|Manual File Upload| GDRIVE

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

node "Staff Workstation" <<device>> as staffDev {
  node "Browser" <<executionEnvironment>> {
    artifact "Staff Portal Bundle" as bundle
  }
}

node "MinSU Server Host" <<device>> as host {
  node "Docker Daemon" <<executionEnvironment>> {
    node "reverse-proxy" as proxy {
      artifact "Nginx Gateway" as nginx
    }
    node "web-app" as app {
      artifact "Staff APIs & Form Engine" as api
    }
    node "postgres-db" as db {
      database "PostgreSQL 16" as pg
    }
  }
  
  database "/uploads/scans" as disk
}

cloud "External Google Drive" as gdrive

bundle --> nginx : "HTTPS : 443"
nginx --> api : "HTTP : 3000"
api --> pg : "TCP : 5432"
api ..> disk : "Stream Write"
bundle ..> gdrive : "Upload Copy"

@enduml
```

---

## 5. Deployment Principles

- Staff forms upload binary scanned documents to the mounted `./uploads/scans` host directory.
- Database records link the generated file URL back to the `Document` model.
- External Google Drive links are recorded in transmittal metadata as external URLs.
