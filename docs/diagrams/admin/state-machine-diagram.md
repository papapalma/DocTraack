# System Admin — State Machine Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** State Machine Diagram  
> **Entities:** `User` & `LandingPageConfig` Lifecycle  
> **Standard:** UML 2.5 State Machine Specification

---

## 1. Purpose

The State Machine Diagram shows the lifecycle states of institutional user accounts under administrative governance and the staging-to-production lifecycle of the Landing Page CMS. All decision choices evaluate strictly to binary Yes and No paths.

---

## 2. Mermaid State Machine Diagram

```mermaid
stateDiagram-v2
    direction TB

    state "User Account & Security Lifecycle" as USER_LIFECYCLE {
        [*] --> PROVISIONED : Admin creates account

        state check_2fa <<choice>>
        PROVISIONED --> check_2fa : User attempts initial sign-in

        check_2fa --> ACTIVE : [2FA Setup Verified? -- Yes]
        check_2fa --> PROVISIONED : [2FA Setup Verified? -- No]

        state ACTIVE {
            [*] --> StandardOperation
            StandardOperation --> TwoFactorReset : Admin clears lost TOTP secret
            TwoFactorReset --> StandardOperation : New QR code scanned
        }

        ACTIVE --> DEACTIVATED : toggleActivation() [Admin suspends user]
        DEACTIVATED --> ACTIVE : toggleActivation() [Admin restores access]
        DEACTIVATED --> ARCHIVED : archiveAccount() [Retention policy elapsed]
        ARCHIVED --> [*]
    }

    --

    state "Landing Page CMS Lifecycle" as CMS_LIFECYCLE {
        [*] --> STAGED_DRAFT : Admin edits banners or sections

        state check_preview <<choice>>
        STAGED_DRAFT --> check_preview : Admin inspects split-screen preview

        check_preview --> PUBLISHED_LIVE : [Admin Approves Live Publication? -- Yes]
        check_preview --> STAGED_DRAFT : [Admin Approves Live Publication? -- No]

        PUBLISHED_LIVE --> STAGED_DRAFT : Admin makes new modifications
    }

    %% ─── 📌 VISUAL LEGEND ───
    note right of USER_LIFECYCLE
        <b>📌 DIAGRAM LEGEND</b>
        ● [*] : Initial / Terminal Boundary
        [StateName] : Active Lifecycle Status
        <<choice>> : Mutually Exclusive Decision Point
        --> : Trigger Event Transition
        [guard] : Guard Rule (Strictly Yes / No)
        -- : Orthogonal Region Split
    end note
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol / Syntax | UML State Machine Concept | Technical Meaning | MinSU Document & Student Lifecycle |
|---|---|---|---|
| `● [*]` | Initial State Node | Point of entry into a lifecycle region | User account provisioning or CMS draft initiation |
| `◎ [*]` | Terminal State Node | Final conclusion of lifecycle | Account permanently archived |
| `state "Name"` | Composite State | Container holding nested sub-states | `ACTIVE` (holds `StandardOperation` and `TwoFactorReset`) |
| `<<choice>>` | Decision Pseudostate | Dynamic evaluation of runtime guard | Decision gate evaluating strictly to **Yes** or **No** |
| `-->` | Transition Arrow | Movement from one state to another | Provision, verify, activate, publish |
| `[guard]` | Transition Guard | Boolean condition that must evaluate to TRUE | `[2FA Setup Verified? -- Yes]`, `[Admin Approves? -- Yes]` |
| `--` | Concurrent Regions | Orthogonal regions running in parallel | User Account Lifecycle runs concurrently with CMS Lifecycle |

---

## 4. State Details & Behavioral Constraints

- **`PROVISIONED`**: Account created with initial password; 2FA setup is pending.
- **`check_2fa` Choice**: If user scans the QR code and inputs a valid 6-digit TOTP code (**Yes**), account transitions to `ACTIVE`. If invalid (**No**), user remains in `PROVISIONED`.
- **`ACTIVE`**: User has operational access to assigned subsystem routes according to their role.
- **`DEACTIVATED`**: Immediate revocation of active session tokens; user cannot authenticate.
- **`STAGED_DRAFT`**: CMS changes are isolated in `draftSections` and visible only in `/landing-editor`.
- **`check_preview` Choice**: If administrator approves publication (**Yes**), draft sections are copied to `publishedSections` and served to public visitors.
