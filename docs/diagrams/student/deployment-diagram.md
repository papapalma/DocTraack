# Deployment Diagram: Student Applicant Domain

## 1. Description
This deployment diagram models the runtime execution environment and hardware topology for student interactions. It documents the network routes connecting external student smartphones, laptops, content delivery networks, application containers, and databases.

## 2. ASD-STE100 Technical Specifications
- Allow open public access to portal routes through standard HTTPS Port 443.
- Enforce strict DDoS mitigations and IP rate limiting at the reverse proxy.
- Deploy the Next.js portal application inside a scalable containerized node.
- Isolate student uploaded files in an authenticated static storage volume.

## 3. Deployment Diagram (Mermaid)

```mermaid
graph TB
    subgraph StudentDevices ["Student Device Nodes (Public Internet)"]
        SmartPhone["Student Smartphone<br/>[Mobile Browser / iOS / Android]"]
        PersonalLaptop["Student Personal Computer<br/>[Chrome / Firefox / Edge]"]
    end

    subgraph EdgeNode ["Reverse Proxy & Edge Gateway"]
        NginxProxy["Nginx Gateway Server<br/>[Port 443 HTTPS / SSL Termination]<br/>Rate Limit: 20 req/min/IP for tracking"]
    end

    subgraph AppHostNode ["Application Host Node (Docker Container)"]
        NextServer["Node.js 20 Runtime<br/>Next.js 16 Web Application<br/>[Port 3000 Internal]"]
        PrismaORM["Prisma Client v5.x"]
    end

    subgraph StorageNodes ["Data Storage Infrastructure"]
        PostgresInstance["PostgreSQL 16 Cluster<br/>[Port 5432 Internal SSL]"]
        AttachmentVolume[("Encrypted File Volume<br/>/var/data/uploads")]
    end

    SmartPhone -->|HTTPS TLS 1.3| NginxProxy
    PersonalLaptop -->|HTTPS TLS 1.3| NginxProxy
    NginxProxy -->|HTTP Forward| NextServer
    NextServer -->|Data Access| PrismaORM
    NextServer -->|Store Files| AttachmentVolume
    PrismaORM -->|SQL Queries| PostgresInstance

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

## 4. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Deployment Role | MinSU Infrastructure Context |
|---|---|---|---|
| `<<device>>` Box | `fill:#F6F8F6, stroke:#1B5E20` | Physical hardware or operating system host | Client Workstation, Ubuntu Linux Server |
| `<<node>>` Container | `fill:#F1F8F1, stroke:#164D1C` | Isolated containerized execution node | Docker containers: reverse-proxy, web-application, postgres-database |
| `<<executionEnvironment>>` | `fill:#FFFFFF, stroke:#2E7D32` | Application runtime or software engine | Node.js 20 LTS, Nginx 1.25 Alpine, Headless Chromium |
| `<<artifact>>` | `fill:#DCEFDD, stroke:#1B5E20` | Packaged deployable binary or file | Next.js standalone build, Prisma engine, nginx.conf |
| 🟨 Database Engine | `fill:#FFF1C2, stroke:#F2B705` | Relational database runtime | PostgreSQL 16 Alpine Server |
| `-->` Solid Arrow | Network Communication Link | Transport protocol and network port | Port 443 (HTTPS), Port 3000 (Internal HTTP), Port 5432 (Internal TCP) |
| `-.->` Dashed Arrow | Storage Mount / Stream | Host volume bind mount or disk I/O | `./uploads` (Signed PDF scans) and `pgdata` (PostgreSQL WAL files) |


## 5. Node Responsibilities
- **Student Device Nodes**: External clients accessing public portal routes without university intranet constraints.
- **Reverse Proxy & Edge Gateway**: Filters malicious requests, terminates SSL certificates, and applies rate limits.
- **Application Host Node**: Serves React Server Components, executes form parsing, and computes tracking tokens.
- **Storage Infrastructure**: Stores structured relational data and encrypted PDF attachments.
