---
name: check-ui-states
description: Audit and verify the 10 essential UI/UX resilience states in components, forms, and pages — Empty State, Skeleton Loading, 3-part Error Recovery, Offline/Cached Content, Slow Network handling, Zero Search Results, Permission Denied, Session Expiry with Draft Preservation, Inline Form Validation, and 3-step Success Confirmation.
---

# UI/UX State Auditor (`check-ui-states`)

## Initial Response

When this skill is first invoked without a specific target or question, respond only with:

> I'm ready to audit your UI/UX against the 10 essential resilience states. Point me to a component, page, form, or user flow to evaluate.

Share nothing else until the user specifies a file, component, or screen.

---

## Operating Posture

Most interfaces look acceptable in the "happy path" with mock data on a fast fiber connection. However, real users encounter dropped connections, slow queries, typos, expired cookies, empty dashboards, validation errors, and permission barriers.

This skill is a **resilience and craft auditor**. It systematically inspects a component, page, or flow to verify that none of the **10 Critical UI States** are missing, broken, or half-baked.

### The 10 Critical UI States

| # | State | Golden Rule |
|---|---|---|
| **1** | **Empty State** | Explain what is missing, why it is empty, and provide a clear primary action to get started. |
| **2** | **Loading State** | Use layout-matching skeleton screens (not jarring spinners) to eliminate Cumulative Layout Shift (CLS). |
| **3** | **Error State** | Follow the 3-part formula: what went wrong, whose fault (without blaming), and how to recover. |
| **4** | **No Internet** | Keep cached content on screen, state what still works offline, and offer automatic/1-click retry. |
| **5** | **Slow Network** | Show progressive staged indicators after 3s and offer a lighter path or background execution. |
| **6** | **No Search Results** | Never leave a dead end: detect typos, suggest query corrections ("Did you mean?"), and offer filters/categories. |
| **7** | **Permission Denied** | Explain why the permission/role is required, what is blocked, and provide an explicit way back. |
| **8** | **Session Expired** | Save uncommitted form data to local storage/draft cache *before* redirecting or prompt in-place re-auth. |
| **9** | **Form Validation** | Flag the exact field inline with immediate context and human instructions on how to correct it. |
| **10** | **Success State** | Complete the 3-part arc: Confirm the action, Reassure with receipt/status, and Show what happens next. |

---

## The 10 State Standards & Rubric

### 1. Empty State (Zero Data)
* **Goal**: Transform a blank screen into an onboarding launchpad.
* **Requirements**:
  - Clear, friendly illustration or contextual icon (never a desolate blank box).
  - Clear heading explaining the state (e.g., *"No documents submitted yet"*).
  - Short supporting copy explaining why it is empty or how data arrives.
  - Primary CTA button that initiates data creation (e.g., `+ Create New Annex`, `Upload Document`).
  - Secondary fallback link if creation is restricted (e.g., `Learn more about TDP requirements`).
* **Anti-patterns**: Blank white rectangle; cryptic message like `[]` or `No records found`; absence of any action button.

### 2. Loading State (Skeleton Loading)
* **Goal**: Maintain spatial predictability and perceived performance.
* **Requirements**:
  - Structural skeleton matching the exact shape, height, and layout of the incoming content.
  - Subtle pulse animation (`animate-pulse` or CSS shimmer) matching surface colors.
  - Progressive skeleton: header, filters, table rows/cards should mimic final visual weight.
  - Avoid layout shift (CLS): skeleton containers must reserve exact dimension bounds.
  - Dedicated fallback in Next.js (`loading.tsx` or `Suspense` boundary with skeleton fallback).
* **Anti-patterns**: Full-screen blocking spinners that hide layout context; generic bouncing dots; content popping in and shoving the page down.

### 3. Error State (3-Part Error Anatomy)
* **Goal**: Provide dignity, clarity, and an immediate recovery path when failures occur.
* **The 3 Mandatory Parts**:
  1. **What went wrong**: Plain English explanation devoid of cryptic stack traces (e.g., *"We couldn't generate your Annex 7 payroll report"*).
  2. **Whose fault / Context**: Honest, non-punitive tone clarifying whether it is a server issue, expired link, or network glitch (e.g., *"Our document generation service timed out"*).
  3. **How to fix it**: Actionable recovery control (e.g., `[Try Again]` button, `[Go back to Dashboard]`, or `[Download Draft Copy]`).
* **Requirements**:
  - Clear visual affordance (warning/error icon, subtle red/amber tint).
  - Safe error boundaries catching rendering crashes (`error.tsx` in Next.js).
  - Never expose raw database errors or stack traces to end users.
* **Anti-patterns**: *"An error occurred"*; raw JSON `{ error: 500 }`; dead-end screen with no buttons.

### 4. No Internet (Offline Resilience)
* **Goal**: Prevent data loss and keep user oriented when connectivity drops.
* **Requirements**:
  - **Preserve cached content**: Stale or locally cached data remains visible on screen with a subtle "Offline / Showing cached version" indicator.
  - **Say what still works**: Clearly communicate what actions can still be taken (e.g., *"You can continue filling out this draft offline. It will sync once reconnected."*).
  - **Non-destructive banner**: Floating status pill or sticky non-blocking banner instead of a destructive modal or error page.
  - **Automatic retry**: Listen for `window.addEventListener('online')` and auto-revalidate queries.
* **Anti-patterns**: Wiping the screen to show a full-page dinosaur or network error; disabling all interaction when read-only navigation was possible.

### 5. Slow Network (Progressive Loading & Lighter Path)
* **Goal**: Prevent abandonment and user doubt when connection latency is high (>3s).
* **Requirements**:
  - **Staged feedback threshold**: If loading exceeds 3 seconds, update copy to reassure the user: *"Still working... Generating 500 beneficiary records"* or *"Taking longer than usual"*.
  - **Show measurable or stepped progress**: Multi-step progress bar or checklist for long tasks (e.g., `Step 2 of 4: Validating student records...`).
  - **Offer a lighter path / escape**: Allow cancelling, downloading a lighter version, or continuing in background (e.g., *"Email me when ready"* or `[Cancel Request]`).
* **Anti-patterns**: Indefinite static spinner with zero indication whether the browser is hung; lack of a timeout threshold or cancel button.

### 6. No Search Results (Intelligent Zero State)
* **Goal**: Keep the user discovering content even when their exact query fails.
* **Requirements**:
  - **Typo tolerance / Suggestion**: Auto-detect typos and display *"Did you mean [Suggestion]?"* or fuzzy matching fallback.
  - **Clear Filters button**: One-click action to reset active search terms and filter chips.
  - **Next search ideas**: Display popular categories, recent searches, or trending tags.
  - Echo back the exact query searched: *"No students found matching 'Calapn'"*.
* **Anti-patterns**: Blank empty table with no text; *"0 results"* without a button to clear the input or filters.

### 7. Permission Denied (Context & Way Back)
* **Goal**: Respect security boundaries without stranding or patronizing the user.
* **Requirements**:
  - **Explain why it is needed**: Clearly explain what permission or role is required (e.g., *"Only Campus Directors can approve Annex 1 transmittals"*).
  - **Explain what feature is restricted**: Name the specific document or action blocked.
  - **Provide a way back**: Prominent navigation button returning to safe territory (`[Back to Dashboard]`, `[Switch Role]`, or `[Request Access]`).
  - Prevent unauthorized flash: Server-side redirect or instant RBAC guard before rendering protected UI.
* **Anti-patterns**: Silent 403 redirect to root with no explanation; raw browser alerts; dead-end error page with no navigation.

### 8. Session Expired (Preserve Work First)
* **Goal**: Protect user work from being wiped out by token expiration.
* **Requirements**:
  - **Auto-save uncommitted work**: Cache active form state in `localStorage` or draft state before showing login prompt.
  - **In-place re-authentication**: Modal overlay or slide-over login that refreshes token without reloading the page and destroying React state.
  - **Post-login recovery**: If a redirect is mandatory, save dirty form fields and restore them seamlessly upon re-authentication.
  - Clear message: *"Your session expired for your security. Your draft has been safely saved."*
* **Anti-patterns**: Hard redirect to `/login` that blows away a 20-field application form; silent failure on form submit after token expiry.

### 9. Form Validation (Inline, Exact Field, Solution-Oriented)
* **Goal**: Guide the user to correct errors immediately with zero guesswork.
* **Requirements**:
  - **Inline placement**: Error message placed directly underneath or beside the invalid input, never solely in a distant toast.
  - **Field highlighting**: High-contrast error ring/border (`border-red-500 ring-1 ring-red-500`) and field-level error icon.
  - **Actionable copy**: State exact rule and how to fix it (e.g., *"Must be 10 digits (e.g., 2024-00123)"* instead of *"Invalid input"*).
  - **Accessible markup**: `aria-invalid="true"`, `aria-describedby="field-error-id"`.
  - **Real-time clearing**: Clear error as soon as user types a valid value (re-validate on change or blur).
* **Anti-patterns**: Disabling submit button without explaining which field is invalid; generic toast saying *"Form has errors"*; validation firing before user finishes typing.

### 10. Success State (3-Part Confirmation Arc)
* **Goal**: Deliver clarity, relief, and momentum after completing an action.
* **The 3 Mandatory Parts**:
  1. **Confirm**: Explicit acknowledgment of what completed (e.g., *"Annex 2 Application Submitted"*).
  2. **Reassure**: Provide reference ID, timestamp, or proof of receipt (e.g., *"Tracking Code: #TDP-2026-0891 • A confirmation was sent to your email"*).
  3. **Show What Happens Next**: Immediate next steps and forward navigation (e.g., *"Review typically takes 2-3 business days. [Track Status] or [Return to Dashboard]"*).
* **Requirements**:
  - Subtle, satisfying micro-interaction (check animation or green badge).
  - Accessible announcement (`aria-live="polite"`).
* **Anti-patterns**: Form quietly resets with no confirmation; toast that vanishes in 1 second leaving the user unsure if the submission worked; screen freezes in submitted state.

---

## Audit Workflow

When asked to audit a component, page, or flow:

### Step 1: Surface Mapping
Inspect the target code and identify:
- Is this a list, table, detail page, form, or dashboard widget?
- What asynchronous requests, mutations, or auth requirements exist?

### Step 2: Evaluate All 10 States
Check each state against the standards. Mark each as:
- **PASS**: Implemented thoroughly following the standard.
- **WARN**: Partially implemented or missing key details (e.g., spinner instead of skeleton; error message lacks recovery action).
- **FAIL**: Missing completely or causing dead-ends / data loss.
- **N/A**: Not applicable to this specific component (explain why).

### Step 3: Produce the Audit Table
Always present the findings in this exact markdown table format:

| # | State | Status | Current Finding | Required Fix |
|---|---|:---:|---|---|
| 1 | **Empty State** | `PASS / WARN / FAIL / N/A` | Brief description of current behavior | Concrete fix recommendation |
| 2 | **Loading (Skeleton)** | `PASS / WARN / FAIL / N/A` | ... | ... |
| 3 | **Error State** | `PASS / WARN / FAIL / N/A` | ... | ... |
| 4 | **No Internet** | `PASS / WARN / FAIL / N/A` | ... | ... |
| 5 | **Slow Network** | `PASS / WARN / FAIL / N/A` | ... | ... |
| 6 | **No Search Results** | `PASS / WARN / FAIL / N/A` | ... | ... |
| 7 | **Permission Denied** | `PASS / WARN / FAIL / N/A` | ... | ... |
| 8 | **Session Expired** | `PASS / WARN / FAIL / N/A` | ... | ... |
| 9 | **Form Validation** | `PASS / WARN / FAIL / N/A` | ... | ... |
| 10 | **Success State** | `PASS / WARN / FAIL / N/A` | ... | ... |

### Step 4: Provide Drop-In Implementation Fixes
Provide production-ready React/Tailwind code snippets for every `FAIL` or `WARN` state, tailored to the project's styling and architecture:
- MinSU Green/Gold palette (`minsu-green-700`, `minsu-gold-500`, `surface`, `line`, `ink-muted`).
- Apple-style tactile feedback (`.apple-press`, `.apple-shadow`).
- TypeScript strict types and Lucide icons.

For complete code templates and pattern recipes, consult [CHECKLIST.md](CHECKLIST.md).

