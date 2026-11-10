# Student Applicant — System Architecture Diagram

> **Role:** `STUDENT`  
> **Diagram Type:** System Architecture Diagram  
> **Scope:** Student Portal, 2FA Verification, Application Ingestion & Storage Architecture  
> **Standard:** ISO/IEC/IEEE 42010 Architecture Description

---

## 1. Purpose

The System Architecture Diagram shows the multi-tier hardware and software architecture serving student scholarship applicants in MinSU DocTrack. It details how students authenticate with Microsoft 2FA, browse active TDP calls, submit digital application packets, track progress, and access protected profile records.

---

## 2. Mermaid System Architecture Diagram

```mermaid
graph TB
    subgraph ClientTier ["Client Tier (Student Devices)"]
        MobileClient["Mobile Web Browser<br/>[iOS Safari / Android Chrome]"]
        DesktopClient["Desktop Web Browser<br/>[Student Laboratory / Personal PC]"]
    end

    subgraph EdgeTier ["Edge & Security Tier"]
        EdgeMiddleware["Next.js Edge Middleware<br/>[Security Headers & Isolation Guards]"]
        RateLimiter["Anti-Brute-Force Rate Limiter<br/>[10 submissions/hr & 20 lookups/min]"]
    end

    subgraph AppTier ["Application Tier (Next.js 16 Portal Server)"]
        PortalRouter["App Router: /portal, /landing<br/>[Server Components & RSC]"]
        TwoFactorEngine["Two-Factor Auth Engine<br/>[Microsoft Authenticator TOTP]"]
        FormHandler["Application Intake Handler<br/>[Zod Schema & MIME Validation]"]
        TrackerEngine["Tracking Code Search Engine<br/>[TDP-YYYY-XXXX Public Lookup]"]
        ReceiptGenerator["Receipt Slip Compiler<br/>[Client/Server Print Engine]"]
        ProfileLockService["RA 10173 Profile Lock Service<br/>[Selective Identity Protection]"]
    end

    subgraph DataTier ["Data & Persistence Tier"]
        PrismaClient["Prisma Data Access Layer"]
        PostgresDB[("PostgreSQL Database<br/>Users, Registrations, Applications, Calls")]
        BlobStorage[("Secure File Storage<br/>Encrypted Grades & COR Proofs")]
    end

    MobileClient -->|HTTPS Port 443| EdgeMiddleware
    DesktopClient -->|HTTPS Port 443| EdgeMiddleware
    EdgeMiddleware --> RateLimiter
    RateLimiter --> PortalRouter

    PortalRouter --> TwoFactorEngine
    PortalRouter --> FormHandler
    PortalRouter --> TrackerEngine
    PortalRouter --> ReceiptGenerator
    PortalRouter --> ProfileLockService

    TwoFactorEngine --> PrismaClient
    FormHandler -->|Save Application Metadata| PrismaClient
    FormHandler -->|Upload Proof Files| BlobStorage
    TrackerEngine -->|Query Status| PrismaClient
    ProfileLockService -->|Update Profile| PrismaClient
    PrismaClient --> PostgresDB

    %% ─── 📌 VISUAL LEGEND ───
    subgraph LEGEND ["📌 Diagram Legend"]
        direction TB
        L_Client["Client Tier Actor / Device"]:::clientStyle
        L_Edge["Edge / Gateway Security Tier"]:::edgeStyle
        L_App["Application Tier Service / Engine"]:::appStyle
        L_Data[("Data Tier Persistence / Storage")]:::dataStyle
        L_Client -->|HTTPS Request| L_Edge
        L_Edge --> L_App
        L_App --> L_Data
    end
    classDef clientStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef edgeStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:1.5px,color:#1F2A24;
    classDef appStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef dataStyle fill:#DCEFDD,stroke:#123F17,stroke-width:2px,color:#123F17;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | Architecture Tier | MinSU Implementation Mapping |
|---|---|---|---|
| ⬜ Client Box | `fill:#FFFFFF, stroke:#1B5E20` | Client Presentation Tier | Responsive mobile and desktop browsers |
| 🟨 Gold Box | `fill:#FFF1C2, stroke:#F2B705` | Edge & Security Tier | Next.js Edge Middleware and IP-based rate limiters |
| 🟩 Light Green Box | `fill:#F1F8F1, stroke:#1B5E20` | Application Server Tier | React Server Components, 2FA controllers, and Zod validators |
| 🟩 Dark Green Cylinder | `fill:#DCEFDD, stroke:#123F17` | Data & Persistence Tier | PostgreSQL database and isolated file storage directories |
| `-->` Solid Arrow | Request / Data Flow | Directional communication between architectural tiers |

---

## 4. Architectural Layer Responsibilities

- **Client Tier**: Fully responsive mobile-first UI built with Tailwind CSS, supporting smartphones, tablets, and campus desktop laboratories.
- **Edge Tier**: Enforces strict HTTP security headers (`X-Frame-Options: SAMEORIGIN`, `nosniff`, `CSP`) and shields application endpoints against scraping and brute-force flooding.
- **Application Tier**: Next.js 16 App Router handles server-rendered student catalog pages, Microsoft Authenticator 2FA validation, Zod-guarded application intake, and PDF receipt rendering.
- **Data Tier**: Prisma ORM coordinates transactions across PostgreSQL tables while document proof assets reside securely in designated non-public storage directories.
