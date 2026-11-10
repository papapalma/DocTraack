# MinSU DocTrack — Master Implementation Plan

> **Mindoro State University (MinSU)**  
> **Tulong Dunong Program (TDP) Annex Management, Verification & Document Tracking System**

---

## 1. System Overview

**MinSU DocTrack** digitizes and replaces the slow manual routine (`prepare → review → scan → upload → email`) for **TDP Annexes 1 through 10** with a role-based, traceable, fullstack web application.

- **Stack:** Next.js 16 (App Router, Fullstack), TypeScript, PostgreSQL 16, Prisma ORM, Tailwind CSS, Radix UI, ExcelJS, HTML-to-Docx, Puppeteer.
- **Brand Palette:** MinSU Forest Green (`#1B5E20`), MinSU Gold (`#F2B705`), Off-white/slate backgrounds (`#F6F8F6`).

---

## 2. Resolved Design Decisions

| # | Topic | Decision |
|---|---|---|
| 1 | **Annexes 6–9 Creators** | Both Staff **and** Accounting |
| 2 | **Director Return Notes** | Feedback comment is optional but encouraged |
| 3 | **Notifications** | In-app real-time notification center (bell menu) & push preferences |
| 4 | **Registrar Role** | Excluded; simplified to 5 core institutional roles |
| 5 | **Document Generation** | Automated PDF compilation, ExcelJS multi-tab workbooks, and native Word (`.doc`) letters |
| 6 | **Annex 1 Transmission** | Recorded manual dispatch with external Google Drive links & transmittal tracking |
| 7 | **Student Access** | Free open registration with institutional/student email and 2FA options |
| 8 | **Authentication** | Server-side secure HTTP-only cookies + sessions in PostgreSQL + Microsoft Authenticator TOTP |
| 9 | **Storage** | Local disk `/uploads` with sanitized file path structures and SVG XSS CSP protection |
| 10 | **Annex 2 Applications** | Staff form builder with dynamic custom fields per call |
| 11 | **Executive Analytics** | Turnaround velocity charts, status distribution & CSV export |
| 12 | **Auth Presentation** | Interactive physics-based modal dialog (`AuthModal`) on homepage |
| 13 | **Loading Feedback** | Full shimmering Skeleton UI replacing all spinner screens |
| 14 | **Session Termination** | Dual-button confirmation modal before signing out |
| 15 | **Annex 1 GDrive Flow** | Staff downloads approved Annex 1, uploads to GDrive, and enters link in Transmittal |
| 16 | **Annex 2 Student Downloads** | Student Portal provides both blank official template and congratulations receipt slip |
| 17 | **3-Way Cross-Matching** | Automated tripartite fuzzy matching cross-referencing CHED, Registrar, and System datasets |
| 18 | **Certificate Designer** | In-app visual editor with customizable typography, paper size, orientation, and dynamic signatories |
| 19 | **Data Privacy Lock** | Strict RA 10173 compliance: Student ID Number and Full Legal Name lock upon acceptance; GWA/contacts remain editable |
| 20 | **Landing Page CMS** | Apple-style split-screen editor with drag-and-drop section management and responsive live device frames |

---

## 3. User Roles & Permissions

| Role | Core Responsibilities | Access Boundaries |
|---|---|---|
| **Campus Director** | Reviews submitted annexes, executes 1-click approvals or returns with comments, monitors executive analytics KPIs, reviews 3-way verification runs, and endorses award certificate templates. | Full review queue, analytics dashboard, all document views, verification run results. |
| **Staff Coordinator** | Creates & edits Annexes 1–5 & 10, uploads signed scans, issues transmittal records, manages Outgoing Registry, configures Annex 2 calls, validates student registrations (`/registrations`), executes 3-way verification cross-matching (`/verification`), designs certificate templates (`/certificate-editor`), and publishes announcements. | Annexes 1–5 & 10, call management, outgoing transmittals registry, registration queue, verification engine, certificate designer, announcements. |
| **Accounting Officer** | Prepares and submits financial and disbursement annexes (Annexes 6, 7, 8, 9), reconciles bank debit advices, inspects cashier check records, and exports multi-tab Excel workbooks. | Annexes 6–9 creation and review history, financial document exports. |
| **System Admin** | Oversees user accounts & institutional role provisioning, inspects immutable audit logs, configures landing page CMS, manages institutional branding & logos, controls anti-brute-force rate limiting, and broadcasts IT announcements. | User management, audit logs, landing page CMS, branding API, rate limiting toggles, platform announcements. |
| **Student Applicant** | Registers account, configures Microsoft Authenticator 2FA, browses active TDP calls, applies online (Annex 2), tracks evaluation status with tracking codes, maintains profile (GWA, contacts, parents), and views announcements feed. | Student portal (`/portal`), own applications, security preferences. |

---

## 4. Document Status Lifecycle

```
Draft ───────► Submitted ───────► Approved ───────► Uploaded ───────► Transmitted ───────► Archived
                 │       ▲
                 ▼       │
              Returned ──┘ (in-place revisions & resubmission)
```

### Lifecycle Rules:
1. **Draft:** Created by Staff or Accounting; editable only by preparer.
2. **Submitted / Resubmitted:** Locked for review; visible in the Campus Director's review queue.
3. **Returned:** Disapproved by Director with feedback; unlocked for preparer to correct and resubmit.
4. **Approved:** Endorsed by Director; locked against direct edits.
5. **Uploaded:** Signed, stamped physical document scanned and uploaded to system.
6. **Transmitted:** Officially dispatched to external agencies/CHED; transmittal link and timestamp logged.
7. **Archived:** Formal retention record; hidden from active filters but preserved in audit history.

---

## 5. Phased Implementation Roadmap

### Phase 1: Foundation & Security [COMPLETED]
- [x] Next.js App Router fullstack architecture with TypeScript.
- [x] PostgreSQL database connected via Prisma ORM.
- [x] MinSU design system (Forest Green `#1B5E20`, Gold `#F2B705`, surface tokens).
- [x] Session-based authentication with secure HTTP-only cookies and bcrypt password hashing.
- [x] Role-Based Access Control (RBAC) middleware for edge routes.
- [x] Immutable `AuditLog` recording every action and status change.
- [x] Pure RSC `RootLayout` architecture.

### Phase 2: Core Annex Workflow (Annexes 3–10) [COMPLETED]
- [x] Document CRUD API supporting flexible JSON form schemas.
- [x] Document preparation forms for Annexes 3 through 10.
- [x] Status transition endpoints (`/submit`, `/approve`, `/return`, `/archive`).
- [x] Director Review Queue with approval and return actions.
- [x] Comment and revision history trail on document detail views.
- [x] Signed scan upload handler (`/api/documents/[id]/upload`).
- [x] Automated PDF document rendering.

### Phase 3: Annex 1 & Outgoing Registry [COMPLETED]
- [x] Annex 1 external transmittal workflow.
- [x] Transmittal recording (method, recipient, Google Drive links, notes).
- [x] Outgoing Documents Registry for Staff transmittal tracking and archival.

### Phase 4: Annex 2 & Student Portal [COMPLETED]
- [x] Staff dynamic Call Form Builder for custom TDP applicant guidelines.
- [x] Student Portal (`/portal`) with active calls catalog.
- [x] Dynamic online application form submission.
- [x] Automatic unique tracking code generation.
- [x] Student application tracking dashboard.

### Phase 5: Executive Analytics, Admin & Polish [COMPLETED]
- [x] Campus Director Executive Analytics with KPI cards and live metrics.
- [x] Turnaround time calculations and CSV export endpoint.
- [x] Dedicated System Admin Platform Console (user metrics, real-time audit event feed, CMS status).
- [x] System Admin User Management (role switching, account creation).
- [x] In-app notification center for pending approvals and status changes.
- [x] Accessible empty states and error boundaries.

### Phase 6: Modular Landing Page & Admin Split-Screen CMS Editor [COMPLETED]
- [x] `LandingPageConfig` schema in PostgreSQL with draft and published section arrays.
- [x] Auto-seed initial MinSU DocTrack sections to ensure zero visual regression.
- [x] Public landing data API (`/api/landing`) with resilient local fallback.
- [x] Admin CMS API (`/api/landing/admin`) with RBAC enforcement (`SYSTEM_ADMIN`) and audit logging.
- [x] 6 Modular section components (Hero, Announcement Ticker, Workflow Cards, Stats, FAQ Accordion, Contact & Office Info).
- [x] Apple-feel Split-Screen Editor (`/dashboard/landing-editor`) with Section Manager (reorder, toggle, configure) and real-time responsive Live Preview frame (Mobile, Tablet, Desktop).
- [x] Draft & Publish workflow with confirmation modals.

### Phase 7: Docker Containerization & Infrastructure [COMPLETED]
- [x] Multi-stage production `Dockerfile` with Next.js standalone runner and unprivileged `nextjs` user.
- [x] `.dockerignore` optimized for cache layers and preventing host binary leaks.
- [x] Production `docker-compose.yml` with PostgreSQL 16 service, health checks, and named volumes (`minsu_db_data`, `minsu_uploads_data`).
- [x] Ephemeral `db-init` migration service executing automated Prisma schema push and database seeding before app startup.
- [x] Development `docker-compose.dev.yml` override supporting live hot-reloading with anonymous volume isolation.
- [x] Dedicated Docker environment configuration (`.env.docker.example`) and npm helper scripts.

### Phase 8: 3-Way Cross-Matching Verification Engine [COMPLETED]
- [x] Database models: `VerificationRun` and `VerificationResult`.
- [x] In-memory streaming CSV parsing for CHED and Registrar datasets.
- [x] Tripartite reconciliation cross-referencing CHED, Registrar, and System Student Masterlist records.
- [x] Jaro-Winkler & Levenshtein fuzzy matching algorithm with confidence scoring.
- [x] Discrepancy classifications (`FULLY_VERIFIED`, `NEEDS_ENCODING`, `NOT_ENROLLED`, `SYSTEM_DISCREPANCY`, `POSSIBLE_MATCH`, `ENROLLED_NON_SCHOLAR`).
- [x] Manual discrepancy resolution modal (`CONFIRM` / `DISMISS`) with audit logging.
- [x] Multi-tab Excel audit report export (`/api/verification/runs/[id]/export`).

### Phase 9: Microsoft Authenticator 2FA & Identity Extensions [COMPLETED]
- [x] TOTP 2FA secret generation and QR code provisioning (`/api/auth/2fa/setup`).
- [x] TOTP token verification and activation (`/api/auth/2fa/enable`).
- [x] One-time emergency backup recovery codes generation and hashing.
- [x] Anti-lockout handling and user security preferences.
- [x] Student profile persistence and RA 10173 data privacy lock: permanent lock on Student ID Number & Name after acceptance; non-static attributes (GWA, phone, address, parents) remain editable.

### Phase 10: Certificate Designer & Native Multi-Format Document Generation [COMPLETED]
- [x] Interactive visual Certificate Designer (`/certificate-editor`) with real-time canvas preview.
- [x] Paper size configurations (Letter, A4, Legal, Folio) and orientation toggle (Portrait, Landscape).
- [x] Dynamic signatory placement and title editing.
- [x] Reset-to-default template fallback and persistent template state.
- [x] Native multi-tab Excel workbook generation via `ExcelJS` (Annexes 1, 3, 4, 5, 6, 7, 8, 9).
- [x] Native Microsoft Word (`.doc`) generation for Annex 10 Notice of Awards.
- [x] Dual-mode interactive suites (Interactive Workspace vs. Official Government Canvas).

### Phase 11: Campus & Public Announcements Hub [COMPLETED]
- [x] Announcement database schema with categories (`GENERAL`, `URGENT`, `DEADLINE`, `REQUIREMENTS`, `PAYROLL`).
- [x] Audience targeting tiers (`ALL`, `STUDENTS`, `PUBLIC`) and priority pinning.
- [x] Staff Coordinator announcement manager (`/announcements`) with rich editing and delete confirmations.
- [x] Student Portal dedicated announcement feed (`/portal/announcements`).
- [x] Push notification and email preference toggles in user settings.

---

## 6. Security Rules & Protocols

MinSU DocTrack enforces a strict defense-in-depth security model:

### A. Mandatory Security Checks & Baseline
- **Zero Hardcoded Secrets:** All credentials, database URIs, and session secrets are managed via environment variables (`.env`).
- **SQL Injection Prevention:** 100% of database operations use Prisma ORM parameterized queries.
- **XSS & Clickjacking Shield:** Hardened HTTP response headers enforced at the middleware edge:
  - `X-Frame-Options: SAMEORIGIN` (Clickjacking prevention).
  - `X-Content-Type-Options: nosniff` (MIME sniffing prevention).
  - `Referrer-Policy: strict-origin-when-cross-origin` (Referrer leakage protection).
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()` (Unauthorized hardware access restriction).
  - `Cross-Origin-Opener-Policy: same-origin` & `Cross-Origin-Resource-Policy: same-origin`.
- **SVG XSS CSP Defense:** Media logo serving endpoint enforces strict `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`.

### B. Authentication & Session Security
- **Cryptographic Password Hashing:** Passwords hashed with `bcryptjs` (minimum 10 salt rounds).
- **Two-Factor Authentication:** TOTP algorithm compatible with Microsoft Authenticator and Google Authenticator.
- **Cookie & Session Hygiene:**
  - Session tokens generated with `crypto.randomBytes(32).toString("hex")`.
  - Stored in PostgreSQL `Session` table with explicit expiration timestamps (`expiresAt`).
  - Cookies set with `HttpOnly` (inaccessible to JavaScript), `SameSite=lax` (CSRF defense), `path=/`, and `Secure` in production.
- **Rate Limiting:** Sliding-window rate limiting on login (5 attempts/min), registration (3 attempts/10min), and application submission (10/hr) with System Administrator toggle.

### C. Role-Based Access Control (RBAC) & State Machine Integrity
- **Edge Route Guarding:** Next.js Edge Middleware (`src/middleware.ts`) validates session tokens on all protected routes.
- **Server-Side API Verification:** Every mutation endpoint runs `requireAuth()` and `requireRole(...)` server-side before processing requests.
- **Document Mutability Locks:**
  - `DRAFT` / `RETURNED`: Editable only by the original preparer.
  - `SUBMITTED` / `RESUBMITTED`: Read-only, locked in review queue. Only Campus Director can trigger `APPROVE` or `RETURN`.
  - `APPROVED` / `TRANSMITTED` / `ARCHIVED`: Immutably locked against direct field edits to guarantee legal and institutional document integrity.

### D. File Upload & Storage Hardening
- **MIME Allowlist:** Restricted exclusively to verified document/image types (`application/pdf`, `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`).
- **Payload Limits:** Maximum file size capped at 10MB per upload (5MB for branding assets).
- **Directory Traversal Protection:** Filenames are cryptographically generated via `crypto.randomBytes(12)` and timestamp prefixes. Never construct file system paths using raw client-supplied filenames.

### E. Immutable Audit Logging
- Every sensitive operation (`submit`, `approve`, `return`, `upload`, `transmit`, `archive`, `role_change`, `verification_run`, `announcement_post`) writes an unalterable record to the `AuditLog` table detailing `actorId`, `action`, `entity`, `entityId`, and timestamp.
