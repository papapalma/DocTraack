---
trigger: always_on
---

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

### Role-Based Access Control (RBAC)
Every server endpoint, action, and page must verify roles using `src/lib/rbac.ts`. Client-side conditional rendering is for UI convenience only and must **never** be treated as a security boundary.

| Role | Permitted Actions |
|---|---|
| `CAMPUS_DIRECTOR` | Access Executive Review Queue, approve documents, return with revision comments, view executive KPI analytics. |
| `STAFF_COORDINATOR` | Create and edit Annexes 1–5 and 10, dispatch and track agency transmittals, publish Annex 2 TDP applicant calls, review student submissions. |
| `ACCOUNTING_OFFICER` | Prepare and submit financial Annexes (6: Fund Utilization, 7: Advance to Debit, 8: Checks Issued, 9: Beneficiary Payroll). |
| `SYSTEM_ADMIN` | Manage users and assign roles, inspect system audit logs, configure public landing page CMS. |
| `STUDENT` | View active Annex 2 TDP calls, submit online scholarship applications, track status with application code. |

### Authentication & Cookie Security
- **Session Tokens**: Use server-generated cryptographically secure tokens stored in the `minsu_session_token` cookie.
- **Cookie Security Flags**:
  ```ts
  {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7 // 7 days
  }
  ```
- **Credentials**: Passwords must always be hashed using `bcrypt` (minimum 10 salt rounds). Never log or return password hashes in API responses.

### Immutable Audit Trail
- Every mutating action (create, edit, submit, approve, return, delete, dispatch) **must** invoke `logAuditEvent()` from `src/lib/audit.ts`.
- Required audit fields:
  1. `userId`: ID of the authenticated user performing the action.
  2. `action`: Standardized verb (e.g., `DOCUMENT_SUBMITTED`, `DOCUMENT_APPROVED`, `ANNEX_CALL_PUBLISHED`).
  3. `resourceType`: Entity type (`DOCUMENT`, `USER`, `CALL`, `TRANSMITTAL`).
  4. `resourceId`: UUID of target entity.
  5. `metadata`: JSON payload capturing relevant field diffs or status transitions.

### Input Validation & Sanitization
- Validate all incoming request bodies with **Zod** schemas in `src/lib/validation.ts`.
- Never trust client IDs directly without verifying ownership or role permissions.
- Validate external URLs (e.g., Google Drive links for Annex 1) against safe protocol schemes (`https://`).

### Security Headers Enforcement
Middleware (`src/middleware.ts`) must enforce:
- `X-Frame-Options: SAMEORIGIN` (Clickjacking prevention)
- `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`

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
