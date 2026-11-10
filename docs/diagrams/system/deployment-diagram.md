# Deployment Diagram

> **System:** MinSU DocTrack  
> **Diagram Type:** Deployment Diagram  
> **Standard:** UML 2.5 Deployment Specification

---

## 1. Purpose

The Deployment Diagram shows where software artifacts run on hardware and container nodes. It shows ports, runtimes, container configurations, and persistent storage volumes.

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

    subgraph CLIENT_DEVICE["<<device>> Client Workstation / Mobile Phone"]
        subgraph WEB_BROWSER["<<executionEnvironment>> Web Browser (Chrome / Safari / Firefox)"]
            SPA_ARTIFACT["<<artifact>><br/>React Server / Client Bundle<br/>(Tailwind / Radix / ES2024)"]:::artifactStyle
        end
    end

    subgraph DOCKER_HOST["<<device>> University Application Server (Ubuntu Linux / Host OS)"]
        subgraph DOCKER_ENGINE["<<executionEnvironment>> Docker Engine & Compose"]

            subgraph NEXTJS_CONTAINER["<<node>> Container: app (minsu_app)"]
                NODE_RUNTIME["<<executionEnvironment>> Node.js 20/24 Standalone Runner"]:::runtimeNode
                SERVER_ARTIFACT["<<artifact>> Next.js Standalone Build (.next/standalone)"]:::artifactStyle
                PRISMA_CLIENT["<<artifact>> Prisma 6 Client Engine"]:::artifactStyle
                EXCEL_ARTIFACT["<<artifact>> ExcelJS & Docx Generator Engines"]:::artifactStyle
            end

            subgraph DB_INIT_CONTAINER["<<node>> Ephemeral Container: db-init"]
                MIGRATE_RUNTIME["<<executionEnvironment>> Prisma DB Push & Seed Script"]:::runtimeNode
            end

            subgraph POSTGRES_CONTAINER["<<node>> Container: postgres (minsu_postgres)"]
                PG_ENGINE["<<executionEnvironment>> PostgreSQL 16 Alpine Server (Port 5432)"]:::dbNode
                DATA_DIR["<<artifact>> /var/lib/postgresql/data"]:::artifactStyle
            end

        end

        subgraph PERSISTENT_VOLUMES["<<storage>> Docker Named Volumes"]
            PG_DATA_VOL["Volume: minsu_db_data<br/>(PostgreSQL Relational DB Files)"]:::deviceNode
            UPLOADS_VOL["Volume: minsu_uploads_data<br/>(Scans, Logos & Landing Media)"]:::deviceNode
        end
    end

    %% Network Connections
    WEB_BROWSER -->|HTTPS / Port 443 -> 3000| NEXTJS_CONTAINER
    DB_INIT_CONTAINER -->|Prisma Schema Push / Port 5432| POSTGRES_CONTAINER
    NEXTJS_CONTAINER -->|TCP Connection Pool / Port 5432| POSTGRES_CONTAINER
    NEXTJS_CONTAINER -->|Read / Write Storage| UPLOADS_VOL
    POSTGRES_CONTAINER -->|Persistent Disk Mount| PG_DATA_VOL

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Device["<<device>>: Physical/Virtual Host"]:::deviceNode
        L_Node["<<node>>: Docker Container Instance"]:::dockerNode
        L_Runtime["<<executionEnvironment>>: Runtime Engine"]:::runtimeNode
        L_Artifact["<<artifact>>: Software Deployment Package"]:::artifactStyle
        L_Device --> L_Node
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | UML Deployment Concept | MinSU System Implementation |
|---|---|---|
| `<<device>>` | Hardware or Virtual Host | Client browser device, Docker Host server |
| `<<node>>` | Execution Node | Docker containers: `app`, `postgres`, `db-init` |
| `<<executionEnvironment>>` | Software Runtime | Node.js standalone runtime, PostgreSQL 16 Alpine |
| `<<artifact>>` | Compiled Binary or Package | Next.js standalone bundle, Prisma 6 client, ExcelJS exporter |
| `<<storage>>` | Persistent Storage Volume | `minsu_db_data`, `minsu_uploads_data` |

---

## 4. PlantUML Deployment Diagram

```plantuml
@startuml
skinparam nodeBackgroundColor #F6F8F6
skinparam nodeBorderColor #1B5E20

node "Client Device" as Client {
  artifact "Browser Web Bundle" as Bundle
}

node "MinSU Application Server" as Server {
  node "Docker Host" {
    node "minsu_app Container" as App {
      artifact "Next.js Standalone Runner"
      artifact "Prisma 6 Client"
      artifact "ExcelJS Exporter"
    }

    node "db-init Ephemeral Container" as DBInit {
      artifact "Prisma DB Push & Seed"
    }

    node "minsu_postgres Container" as Postgres {
      artifact "PostgreSQL 16 Engine"
    }
  }

  storage "minsu_db_data Volume" as DBVol
  storage "minsu_uploads_data Volume" as UploadVol
}

Client --> App : HTTP Port 3000
DBInit --> Postgres : Port 5432
App --> Postgres : TCP Connection Pool
App --> UploadVol : File I/O
Postgres --> DBVol : Data Persistence
@enduml
```
