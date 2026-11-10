# MinSU DocTrack — Project Rules, Design System & Security Guidelines

> **Target Project**: Mindoro State University (MinSU) — Tulong Dunong Program (TDP) Annex Management System  
> **Applicability**: All frontend components, backend routes, database operations, and security policies.

---

## 1. 🏛️ MinSU Color System & Palette Rules

All user interface elements must adhere to the official Mindoro State University green and gold visual identity. **Never use generic or unapproved hex codes.** Always reference the Tailwind tokens configured in `tailwind.config.ts` or the CSS variables in `src/app/globals.css`.

### Brand Color Palette

| Token / Class | Hex Code | Purpose & Usage Guidelines |
|---|---|---|
| `minsu-green-900` | `#123F17` | Deepest contrast tone. Used for dark footer accents, "Sent to Agency" badges, and high-contrast text on light green containers. |
| `minsu-green-800` | `#164D1C` | Secondary dark green. Active sidebar item backgrounds, dark table header borders. |
| `minsu-green-700` | `#1B5E20` | **Official MinSU Primary Green**. Primary navigation headers, primary CTA buttons (`bg-minsu-green-700 hover:bg-minsu-green-600`), and active state markers. |
| `minsu-green-600` | `#25702A` | Hover and focus state for primary buttons and active link highlights. |
| `minsu-green-500` | `#2E7D32` | Accent green, success icon fills, and approved item highlights. |
| `minsu-green-100` | `#DCEFDD` | Subtle green tint for badge backgrounds (`Approved` status), table row selection highlights. |
| `minsu-green-50`  | `#F1F8F1` | Soft tinted card backgrounds and alternate table rows. |
| `minsu-gold-600`  | `#B88A00` | **Accessible Gold Text & Borders**. Use this for gold text, icons, and borders on light backgrounds (ensures WCAG AA compliance). |
| `minsu-gold-500`  | `#F2B705` | **Official MinSU Accent Gold**. Nav bar bottom highlight lines, star badges, primary alert indicators, and accent ribbons. |
| `minsu-gold-400`  | `#F9C733` | Hover states for gold action buttons and subtle highlight borders. |
| `minsu-gold-100`  | `#FFF1C2` | Gold badge pill background for `Submitted / In Review` statuses. |

### Neutral & Surface Tokens

| Token / Class | Hex Code | Usage |
|---|---|---|
| `page` | `#F6F8F6` | Default body and viewport background. Provides soft contrast against white cards. |
| `surface` | `#FFFFFF` | Standard card, modal, dropdown, and table container background. |
| `ink` | `#1F2A24` | Primary high-contrast typography color for headings, table cell values, and body text. |
| `ink-muted` | `#55645B` | Secondary text, field helper captions, metadata timestamps, and placeholder labels. |
| `line` | `#D6DDD8` | Standard border color for cards, table dividers, and input outlines. |

### Document Workflow Status Badges

Always represent TDP document states using these consistent badge token combinations:

```html
<!-- Draft -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">Draft</span>

<!-- Submitted / In Review -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-minsu-gold-100 text-minsu-gold-600 border border-minsu-gold-400/30">Submitted</span>

<!-- Approved -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-minsu-green-100 text-minsu-green-700 border border-minsu-green-600/20">Approved</span>

<!-- Returned with Comments / Revisions -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">Returned</span>

<!-- Sent to External Agency (Annex 1) -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-minsu-green-900 text-white border border-minsu-green-800">Sent to Agency</span>

<!-- Archived -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-300">Archived</span>
```

---

## 2. 🎨 Design System & UI/UX Rules

### Typography Hierarchy
- **Headings (`h1`–`h6`)**: Montserrat (`font-heading`, `var(--font-montserrat)`), letter-spacing `-0.02em`, font-weight `600` or `700`.
- **Body & Tabular Data**: Inter (`font-sans`, `var(--font-inter)`), anti-aliased.
- Exactly one `<h1>` per view or page.
- Clear typographic scale:
  - Page Titles: `text-2xl font-bold tracking-tight text-ink`
  - Section Titles: `text-lg font-semibold text-ink`
  - Body Copy: `text-sm text-ink leading-relaxed`
  - Helper & Metadata: `text-xs text-ink-muted`

### Apple Tactile Response & Motion
1. **Interactive Elements**:
   - Use `.apple-press` on clickable cards and buttons to provide immediate physical tactile feedback:
     ```css
     .apple-press:active { transform: scale(0.97); }
     ```
   - Transition curve must use Apple's fluid spring physics:
     ```css
     transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1);
     ```
2. **Elevations & Shadows**:
   - Default cards: `.apple-shadow` (multi-stop shadow for soft realistic depth).
   - Hover cards: `.apple-shadow-hover` (`translateY(-2px)` on hover with deepened green-tinted shadow).
3. **Glassmorphism**:
   - Sticky top navigation must use `.glass-header` with 16px backdrop blur and 40% gold bottom border.
   - Modals and slide-over panels must use `.glass-surface` (`rgba(255, 255, 255, 0.85)` + `backdrop-filter: blur(20px)`).

### Form & Data Entry Standards
- **Explicit Labels**: Never use input placeholders as a substitute for labels. Every field must have a visible `<label>`.
- **Focus Rings**: All inputs must highlight consistently:
  `focus:ring-2 focus:ring-minsu-green-700 focus:border-minsu-green-700 outline-none transition`.
- **Financial Currency Formatting**: For Annexes 6, 7, 8, and 9, format all amounts in Philippine Peso (`₱#,##0.00`) and align right (`text-right font-mono`).
- **Destructive Confirmations**: Actions that return a document, reject an applicant, or delete records must open an explicit confirmation dialog requiring comments or justification.

---

## 3. 🔒 Security & Access Control Rules

### 3.1 Comprehensive Role-Based Access Control (RBAC)
Every server endpoint, action, route handler, and page must verify roles using `src/lib/rbac.ts` and `src/lib/auth.ts`. Client-side conditional rendering is for UI convenience only and must **never** be treated as a security boundary.

| Role | Permitted Functional Areas & Actions | Strictly Prohibited Areas |
|---|---|---|
| `CAMPUS_DIRECTOR` | • **Executive Review Queue** (`/review`): approve or return submitted Annex documents with required comments.<br>• **Executive KPI Analytics** (`/analytics`): access executive performance, disbursement, and timeline analytics.<br>• **Student Masterlist** (`/registrations`): inspect student validation masterlist and export grantee rosters.<br>• **3-Way Verification** (`/verification`): execute verification runs, review discrepancy analytics, and inspect matched records.<br>• **Certificate Designer** (`/certificate-editor`): customize, preview, and reset official award certificate templates and signees.<br>• **Announcements** (`/announcements`): publish, edit, delete, and pin campus-wide announcements.<br>• **Institutional Branding** (`/api/branding`): approve and configure global institutional logos and header styles. | • User account provisioning & role assignment.<br>• Landing page CMS modifications.<br>• Direct modification or deletion of system audit logs. |
| `STAFF_COORDINATOR` | • **Document Management** (`/documents`, `/documents/new`): create, edit, submit, and manage Annexes 1–5 and 10; upload signed scanned copies.<br>• **Transmittals** (`/outgoing`): record, dispatch, and track external agency transmittals (CHED/UniFAST).<br>• **Applicant Calls** (`/calls`, `/calls/new`): publish, edit, and close Annex 2 scholarship calls.<br>• **Student Validation Queue** (`/registrations`): validate student registrations, review profiles, and execute official ACCEPT / REJECT decisions.<br>• **3-Way Verification** (`/verification`): upload CHED/Registrar CSV datasets, execute cross-match runs, and manually resolve candidate discrepancies (CONFIRM / DISMISS).<br>• **Certificate Designer** (`/certificate-editor`): design certificate layout, typography, paper dimensions, and signatories.<br>• **Announcements** (`/announcements`): create, update, delete, and pin announcements across all audience tiers.<br>• **Logo Management** (`/api/branding/logo/upload`): upload partner, institutional, and agency logos for Annex documents. | • Financial Annexes 6–9 preparation.<br>• System user administration.<br>• Landing page CMS configuration.<br>• Executive document approval. |
| `ACCOUNTING_OFFICER` | • **Financial Annexes** (`/documents`, `/documents/new`): prepare, edit, submit, and export financial Annexes (6: Fund Utilization, 7: Advance to Debit, 8: Checks Issued, 9: Beneficiary Payroll).<br>• **Document Uploads**: upload signed scanned copies of approved financial documents.<br>• **Dashboard**: view financial document statuses and disbursement metrics. | • Academic Annexes 1–5 and 10.<br>• Student registration validation or rejection.<br>• 3-Way cross-matching verification runs or resolution.<br>• Certificate Designer access.<br>• User administration, CMS editing, and audit log access.<br>• Announcements creation or modification. |
| `SYSTEM_ADMIN` | • **User & Role Management** (`/users`): provision user accounts, assign roles, and toggle account activation status.<br>• **Audit Logs & Forensics** (`/audit-logs`): inspect tamper-evident audit trails, filter security events, and export CSV forensic reports.<br>• **Landing Page CMS** (`/landing-editor`): customize published and draft landing sections, upload hero/crest media assets, and publish live CMS configurations.<br>• **System Branding** (`/api/branding`): configure institutional logos and header layouts.<br>• **Announcements** (`/announcements`): broadcast emergency IT, maintenance, and administrative announcements.<br>• **Rate Limiting Controls**: enable or disable anti-brute-force rate limiting globally for campus events or testing. | • Academic & financial document creation, submission, or approval (Annexes 1–10).<br>• Certificate design customization.<br>• Student application validation or discrepancy resolution.<br>• Mutating or deleting audit log records (strictly append-only). |
| `STUDENT` | • **Student Portal** (`/portal`): browse active TDP scholarship calls, submit online applications with dynamic forms.<br>• **Application Tracking** (`/portal/applications`): track review status in real-time using unique tracking codes.<br>• **Student Profile** (`/portal/profile`): view and maintain profile information (GWA, contact number, address, parent contacts).<br>• **Announcements** (`/portal/announcements`): view announcements targeted to Students or Public. | • Accessing operational dashboard routes (`/dashboard/*`).<br>• Accessing reviewer or administrative API endpoints.<br>• Viewing or mutating any other student's data (anti-IDOR). |

### 3.2 Edge Route Protection & Middleware Enforcement (`src/middleware.ts`)
Middleware must enforce edge authentication and role isolation before route handlers or React Server Components execute:

1. **Exhaustive Edge Protected Prefixes**:
   ```ts
   const DASHBOARD_PROTECTED_PREFIXES = [
     "/dashboard", "/documents", "/review", "/analytics", "/notifications",
     "/users", "/calls", "/outgoing", "/registrations", "/verification",
     "/certificate-editor", "/landing-editor", "/audit-logs", "/announcements",
   ];
   const PORTAL_PROTECTED_PREFIXES = ["/portal"];
   ```
2. **Boundary Redirection Rules**:
   - **Unauthenticated Users**: Redirect to `/?auth=login&from=<pathname>`.
   - **Student Isolation**: Authenticated `STUDENT` accounts navigating to any `/dashboard/*` or operational path must be immediately redirected to `/portal`.
   - **Staff/Admin Isolation**: Non-student roles attempting to navigate to `/portal/*` must be redirected to `/dashboard`.
   - **Role Guardrails**: Unauthorized access attempts on gated pages (e.g. non-admin visiting `/users`, `/audit-logs`, or `/landing-editor`; non-director visiting `/review` or `/analytics`) must redirect to `/dashboard` with an access-denied state.

### 3.3 Data Privacy & Student PII Protection (RA 10173 Compliance)
1. **Horizontal Authorization (Anti-IDOR)**:
   - When fetching or updating application or registration data (`/api/registrations`, `/api/applications`), the backend must strictly enforce that `STUDENT` users can query and mutate only records where `studentId === sessionUser.id`.
   - Client-provided user IDs or student IDs in query parameters or request bodies must never be trusted without validating session ownership.
2. **Selective Grantee Profile Lock**:
   - Once an applicant is marked `ACCEPTED` as an official scholar, their core institutional identity fields (**Student ID Number** and **Full Legal Name**) are permanently locked from student modification to preserve masterlist integrity.
   - Non-static student attributes—including **GWA**, mobile number, residential address, and parent/guardian contact details—remain editable by the student to support continuous renewal and communication.
3. **Protected Export Streams**:
   - All Excel, Word, and CSV export endpoints (`/api/annex-*/export-excel`, `/api/annex-10/export-doc`, `/api/verification/runs/[id]/export`, `/api/audit-logs?export=true`) must enforce server-side role authentication before streaming tabular PII to the client.

### 3.4 File Upload Security & Media Asset Serving
1. **Logo & Media Uploads (`/api/branding/logo/upload`, `/api/landing/upload`)**:
   - **MIME Whitelist**: Restrict uploads strictly to verified image MIME types (`image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`).
   - **File Size Restrictions**: Maximum 5 MB per file.
   - **Path Traversal Defense**: File names must be cryptographically generated using `crypto.randomBytes(12)` and timestamp prefixes. Never construct file system paths using raw client-supplied filenames. Always sanitize paths with `path.basename`.
   - **Storage Directory Containment**: Validate that target paths resolve strictly within designated storage directories (`storage/uploads/logos/` or `storage/uploads/landing/`).
2. **SVG XSS Mitigation**:
   - SVGs served via `/api/media/logo/[filename]` must include the header `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'` and `X-Content-Type-Options: nosniff` to prevent stored cross-site scripting via embedded scripts.
3. **Verification Dataset Processing (`/api/verification/run`)**:
   - Uploaded CHED and Registrar CSVs must be parsed in-memory using streaming buffers.
   - Strict header schema validation is mandatory before initiating parsing.
   - Temporary file artifacts must never be persisted to publicly accessible directories.

### 3.5 Rate Limiting & Anti-Brute-Force Policies (`src/lib/rate-limit.ts`)
To protect against credential stuffing, automated enumeration, and denial of service:
- `POST /api/auth/login`: Maximum 5 failed attempts per IP per minute.
- `POST /api/auth/register`: Maximum 3 registration requests per IP per 10 minutes.
- `POST /api/registrations`: Maximum 10 public application submissions per IP per hour.
- Exceeded thresholds must immediately respond with HTTP `429 Too Many Requests` including standard `Retry-After` headers.
- **System Admin Bypass/Control**: System Administrators have configuration access to temporarily enable or disable rate limiting globally (e.g. during on-campus mass registration drives where all students share a campus gateway IP).

### 3.6 Immutable Audit Trail Contract (`src/lib/audit.ts`)
Every mutating action across all modules must invoke `logAudit()`:
```ts
await logAudit({
  actorId: user.id,
  action: "STANDARDIZED_ACTION_NAME",
  entity: "ENTITY_NAME",
  entityId: targetEntityId,
  details: { ...relevantDiffOrContext },
});
```
- **Standardized Action Nomenclature**:
  - **Documents**: `DOCUMENT_CREATED`, `DOCUMENT_UPDATED`, `DOCUMENT_SUBMITTED`, `DOCUMENT_APPROVED`, `DOCUMENT_RETURNED`, `DOCUMENT_TRANSMITTED`, `DOCUMENT_ARCHIVED`
  - **Calls**: `CALL_CREATED`, `CALL_UPDATED`, `CALL_CLOSED`
  - **Registrations**: `REGISTRATION_SUBMITTED`, `REGISTRATION_ACCEPTED`, `REGISTRATION_REJECTED`
  - **Verification**: `VERIFICATION_RUN_EXECUTED`, `VERIFICATION_DISCREPANCY_RESOLVED`, `VERIFICATION_REPORT_EXPORTED`
  - **Certificates**: `CERTIFICATE_TEMPLATE_UPDATED`, `CERTIFICATE_TEMPLATE_RESET`
  - **Branding & CMS**: `BRANDING_UPDATED`, `LOGO_UPLOADED`, `LANDING_CMS_PUBLISHED`
  - **Identity & Auth**: `USER_LOGIN`, `USER_LOGOUT`, `USER_REGISTERED`, `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`
- **Tamper Resistance**: Audit logs are strictly append-only. No API endpoint, service method, or UI exists to update or delete records from the `audit_log` table.

### 3.7 Authentication, Session & Password Standards
- **Session Tokens**: Cryptographically secure 32-byte tokens generated via `crypto.randomBytes(32).toString("hex")` stored in the `sessions` table and in the `minsu_session_token` cookie.
- **Cookie Security Flags**:
  ```ts
  {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
  ```
- **Password Standards**: Minimum 8 characters, requiring at least one letter and one number, hashed with `bcryptjs` (minimum 10 salt rounds). Never log or return password hashes in responses.
- **Email Validation**: Strict RFC 5322 regex validation with active filtering rejecting disposable and temporary email domains in `src/lib/validation.ts`.

### 3.8 Security Headers Enforcement
Middleware (`src/middleware.ts`) must enforce:
- `X-Frame-Options: SAMEORIGIN` (Clickjacking prevention)
- `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`

---

## 4. 💻 Code Style & Architectural Standards

### Architecture & Next.js 16 Patterns
1. **Server Components by Default**:
   - Keep components as React Server Components (RSC) unless interactive hooks (`useState`, `useEffect`, event handlers) are necessary.
   - Place `"use client"` directives only at the top of isolated interactive leaves, never on entire page trees.
2. **Directory Separation**:
   - `src/app/`: App router pages, layouts, and route handlers (`route.ts`).
   - `src/components/`: Reusable, domain-focused UI components.
   - `src/lib/`: Database clients, authentication, RBAC, validators, and audit services.
   - `src/types/`: Dedicated TypeScript types and interfaces.
   - `src/hooks/`: Reusable client-side React hooks.

### TypeScript Conventions
- **Strict Mode**: `strict: true` is strictly enforced.
- **No `any`**: Never use `any`. Use strict discriminating unions for Annex types and document statuses:
  ```ts
  export type AnnexType =
    | "ANNEX_1" | "ANNEX_2" | "ANNEX_3" | "ANNEX_4" | "ANNEX_5"
    | "ANNEX_6" | "ANNEX_7" | "ANNEX_8" | "ANNEX_9" | "ANNEX_10";

  export type DocumentStatus =
    | "DRAFT" | "SUBMITTED" | "APPROVED" | "RETURNED" | "SENT_TO_AGENCY" | "ARCHIVED";
  ```

### Database & Prisma Standards
- **Singleton Pattern**: Always import the Prisma client from `src/lib/prisma.ts`.
- **Transactions**: For operations that affect multiple tables (e.g., updating document status + writing audit log + creating notification), always wrap them in `prisma.$transaction()`.
- **Efficient Queries**: Explicitly use `select` or `include` to fetch only necessary fields; prevent unbounded over-fetching.

### The "Ponytail" Principle (Simplicity First)
- **Do not invent abstractions** or wrappers unless requested or reused across 3+ places.
- **Do not introduce new npm dependencies** if native Web APIs or standard TypeScript handles it.
- **Prefer small, clean diffs** that target the root cause of an issue rather than patching callers individually.

### Code Intelligence with GitNexus
- Before altering shared functions, types, or Prisma helpers, execute blast-radius analysis via `impact({ target: "symbolName", direction: "upstream" })`.
- Never use bulk search-and-replace to rename functions or types across the codebase.
