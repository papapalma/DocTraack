# MinSU DocTrack — Master Implementation Plan

> **Mindoro State University (MinSU)**  
> **Tulong Dunong Program (TDP) Annex Management & Document Tracking System**

---

## 1. System Overview

**MinSU DocTrack** digitizes and replaces the slow manual routine (`prepare → review → scan → upload → email`) for **TDP Annexes 1 through 10** with a role-based, traceable web application.

- **Stack:** Next.js (App Router, Fullstack), TypeScript, PostgreSQL, Prisma ORM, Tailwind CSS, Shadcn UI / Radix primitives, Puppeteer PDF generator.
- **Brand Palette:** MinSU Forest Green (`#1B5E20`), MinSU Gold (`#F2B705`), Off-white/slate backgrounds (`#F6F8F6`).

---

## 2. Resolved Design Decisions

| # | Topic | Decision |
|---|---|---|
| 1 | **Annexes 6–9 Creators** | Both Staff **and** Accounting |
| 2 | **Director Return Notes** | Feedback comment is optional but encouraged |
| 3 | **Notifications** | In-app real-time notification center (bell menu) |
| 4 | **Registrar Role** | Excluded; simplified to 5 core institutional roles |
| 5 | **Document Generation** | Automated PDF compilation from structured form inputs |
| 6 | **Annex 1 Transmission** | Recorded manual dispatch with external Google Drive links |
| 7 | **Student Access** | Free open registration with institutional/student email |
| 8 | **Authentication** | Server-side secure HTTP-only cookies + sessions in PostgreSQL |
| 9 | **Storage** | Local disk `/uploads` with sanitized file path structures |
| 10 | **Annex 2 Applications** | Staff form builder with dynamic custom fields per call |
| 11 | **Executive Analytics** | Turnaround velocity charts, status distribution & CSV export |
| 12 | **Auth Presentation** | Interactive physics-based modal dialog (`AuthModal`) on homepage |
| 13 | **Loading Feedback** | Full shimmering Skeleton UI replacing all spinner screens |
| 14 | **Session Termination** | Dual-button confirmation modal before signing out |
| 15 | **Annex 1 GDrive Flow** | Staff downloads approved Annex 1, uploads to GDrive, and enters link in Transmittal |
| 16 | **Annex 2 Student Downloads** | Student Portal provides both blank official template and congratulations receipt slip |

---

## 3. User Roles & Permissions

| Role | Core Responsibilities | Access Boundaries |
|---|---|---|
| **Campus Director** | Reviews submitted annexes, executes 1-click approvals or returns with comments, monitors executive analytics KPIs. | Full review queue, analytics dashboard, all document views. |
| **Staff Coordinator** | Creates & edits Annexes 1–10, uploads signed scans, issues transmittal records, manages Outgoing Registry, configures Annex 2 calls. | Annexes 1–10, call management, outgoing transmittals registry. |
| **Accounting Officer** | Prepares and submits financial and disbursement annexes (Annexes 6, 7, 8, 9). | Annexes 6–9 creation and review history. |
| **System Admin** | Oversees user accounts & institutional role provisioning, inspects immutable audit logs, configures landing page CMS. | User management, audit logs, landing page CMS. |
| **Student Applicant** | Registers account, browses active TDP calls, applies online (Annex 2), tracks evaluation status with tracking codes. | Student portal (`/portal`), own applications. |

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

### Phase 6: Modular Landing Page & Admin Split-Screen CMS Editor [READY TO IMPLEMENT]
- [ ] `LandingPageConfig` schema in PostgreSQL with draft and published section arrays.
- [ ] Auto-seed initial MinSU DocTrack sections to ensure zero visual regression.
- [ ] Public landing data API (`/api/landing`) with resilient local fallback.
- [ ] Admin CMS API (`/api/landing/admin`) with RBAC enforcement (`SYSTEM_ADMIN`) and audit logging.
- [ ] 6 Modular section components (Hero, Announcement Ticker, Workflow Cards, Stats, FAQ Accordion, Contact & Office Info).
- [ ] Apple-feel Split-Screen Editor (`/dashboard/landing-editor`) with Section Manager (reorder, toggle, configure) and real-time responsive Live Preview frame (Mobile, Tablet, Desktop).
- [ ] Draft & Publish workflow with confirmation modals.

### Phase 7: Docker Containerization & Infrastructure [COMPLETED]
- [x] Multi-stage production `Dockerfile` with Next.js standalone runner and unprivileged `nextjs` user.
- [x] `.dockerignore` optimized for cache layers and preventing host binary leaks.
- [x] Production `docker-compose.yml` with PostgreSQL 16 service, health checks, and named volumes (`minsu_db_data`, `minsu_uploads_data`).
- [x] Ephemeral `db-init` migration service executing automated Prisma schema push and database seeding before app startup.
- [x] Development `docker-compose.dev.yml` override supporting live hot-reloading with anonymous volume isolation.
- [x] Dedicated Docker environment configuration (`.env.docker.example`) and npm helper scripts.

---

## 6. Recent UX & Architecture Refinements

### A. Modal Authentication (`AuthModal`)
- Replaced standalone `/login` and `/register` views with a spring-animated modal dialog directly on the homepage.
- Tab-pill switcher between **Sign In** and **Student Registration**.
- Deep linking support (`/?auth=login` and `/?auth=register`) with automatic fallback 307 redirects from legacy paths.
- 1-Click Quick Demo account buttons for testing.

### B. Skeleton UI System
- Removed all full-screen spinners and raw loading screens.
- Implemented `DashboardSkeleton`, `PortalSkeleton`, `SkeletonForm`, and `SkeletonTableRows`.
- Added Next.js streaming route `loading.tsx` boundaries for instant feedback during navigation.

### C. Logout Confirmation
- Added dual-action confirmation modal (`LogoutModal`) to prevent accidental session termination.

## 7. Security Rules & Protocols

MinSU DocTrack enforces a strict defense-in-depth security model:

### A. Mandatory Security Checks & Baseline
- **Zero Hardcoded Secrets:** All credentials, database URIs, and session secrets are managed via environment variables (`.env`).
- **SQL Injection Prevention:** 100% of database operations use Prisma ORM parameterized queries. Raw string concatenations in database calls are strictly prohibited.
- **XSS & Clickjacking Shield:** Hardened HTTP response headers enforced at the middleware edge:
  - `X-Frame-Options: SAMEORIGIN` (Clickjacking prevention).
  - `X-Content-Type-Options: nosniff` (MIME sniffing prevention).
  - `Referrer-Policy: strict-origin-when-cross-origin` (Referrer leakage protection).
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()` (Unauthorized hardware access restriction).
  - `Cross-Origin-Opener-Policy: same-origin` & `Cross-Origin-Resource-Policy: same-origin`.
- **Error Information Disclosure:** Server errors return sanitized messages to clients without leaking internal stack traces or database error structures.

### B. Authentication & Session Security
- **Cryptographic Password Hashing:** Passwords are hashed using `bcryptjs` with 12 salt rounds before database persistence. Plaintext passwords are never stored or logged.
- **Password Complexity Policy:** Enforced minimum 8 characters with mandatory alphanumeric criteria (at least one letter and one number).
- **Cookie & Session Hygiene:**
  - Session tokens generated with `crypto.randomBytes(32).toString("hex")`.
  - Stored in PostgreSQL `Session` table with explicit expiration timestamps (`expiresAt`).
  - Cookies set with `HttpOnly` (inaccessible to JavaScript), `SameSite=lax` (CSRF defense), `path=/`, and `Secure` in production.
- **Privilege Escalation Prevention:** Open registration endpoint (`/api/auth/register`) strictly sets `role: Role.STUDENT`. Institutional roles (`STAFF`, `ACCOUNTING`, `DIRECTOR`, `SYSTEM_ADMIN`) can only be provisioned by an authenticated System Administrator.

### C. Role-Based Access Control (RBAC) & State Machine Integrity
- **Edge Route Guarding:** Next.js Edge Middleware (`src/middleware.ts`) validates session tokens on all protected routes (`/dashboard`, `/documents`, `/review`, `/analytics`, `/notifications`, `/users`, `/calls`, `/outgoing`).
- **Server-Side API Verification:** Every mutation endpoint runs `requireAuth()` and `requireRole(...)` server-side before processing requests.
- **Document Mutability Locks:**
  - `DRAFT` / `RETURNED`: Editable only by the original preparer.
  - `SUBMITTED` / `RESUBMITTED`: Read-only, locked in review queue. Only Campus Director can trigger `APPROVE` or `RETURN`.
  - `APPROVED` / `TRANSMITTED` / `ARCHIVED`: Immutably locked against direct field edits to guarantee legal and institutional document integrity.

### D. File Upload & Storage Hardening
- **MIME Allowlist:** Restricted exclusively to verified document/image types (`application/pdf`, `image/png`, `image/jpeg`).
- **Payload Limits:** Maximum file size capped at 10MB per upload.
- **Directory Traversal Protection:** Filenames are sanitized, stripping `..`, slashes, and control characters. Files are stored in isolated document directories (`public/uploads/<document-id>/`).

### E. Immutable Audit Logging
- Every sensitive operation (`submit`, `approve`, `return`, `upload`, `transmit`, `archive`, `role_change`) writes an unalterable record to the `AuditLog` table detailing `actorId`, `action`, `entity`, `entityId`, and timestamp.

---

## 8. Default Demo Test Accounts

All accounts share the default development password: **`Password@123`**

| Role | Email Address | Primary Landing Route |
|---|---|---|
| **Campus Director** | `director@minsu.edu.ph` | `/dashboard` (Review Queue & Analytics) |
| **Staff Coordinator** | `staff@minsu.edu.ph` | `/dashboard` (Annex Preparation & Calls) |
| **Accounting Officer** | `accounting@minsu.edu.ph` | `/dashboard` (Annexes 6–9 Creation) |
| **System Admin** | `admin@minsu.edu.ph` | `/dashboard` (Users & Outgoing Registry) |
| **Student Applicant** | `student@minsu.edu.ph` | `/portal` (Active Calls & Applications) |

