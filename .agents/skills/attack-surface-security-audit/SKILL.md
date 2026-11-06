---
name: attack-surface-security-audit
description: Run a structured, defensive security assessment of a system, application, network, organization, or codebase against the major attack families (social engineering/phishing, malware/ransomware, credential and identity attacks, network and infrastructure attacks, web/code injection, supply chain, insider, IoT, and AI-powered threats). Produces a scored gap analysis, attack-chain risks, and a prioritized remediation roadmap. Use this skill whenever the user asks to check, audit, review, assess, harden, or "pen-test-style review" the security of any system, app, config, architecture, policy, or code, asks "are we vulnerable to X attack", wants a security checklist, security posture score, threat-model-lite, or readiness check for ransomware, phishing, SQL injection, DDoS, MFA fatigue, SIM swapping, supply chain risk, etc. Trigger even if the user only describes their setup and asks "is this secure?" without naming a framework.
---

# Attack-Surface Security Audit

A defensive, evidence-based method for answering: **"Given how this system is built and run, how exposed is it to each known family of attack, and what should be fixed first?"**

Everything needed is in this file: rules of engagement, workflow, scoring, a control checklist for each attack, framework mappings, and a report template.

## Contents
1. Rules of engagement
2. Workflow
3. Modes
4. Scoring and prioritization
5. Control checklists by attack family
6. Attack chains
7. Framework mapping
8. Report template
9. Writing quality bar

---

## 1. Rules of engagement (read first)

A security review is only useful if it is safe, authorized, and honest.

1. **Defensive and read-only by default.** Review configurations, architecture, policies, code, logs, and documents the user provides. Do not run brute-force, credential-guessing, DoS or load tests, phishing simulations, exploit attempts, or scans against systems unless the user states they own or are authorized to test the target *and* the action is low-impact. When unsure, propose the test and let the user run it.
2. **No weaponization.** Describe how an attack works only as far as needed to judge exposure and design a fix. Do not write working malware, exploit code, phishing kits, or step-by-step intrusion instructions. Safe verification snippets (checking a header, refactoring to a parameterized query) are fine.
3. **Third-party targets.** If the target belongs to someone else, limit the work to publicly documented information and general guidance, and say so.
4. **Handle secrets carefully.** If you find credentials, tokens, keys, or personal data, flag the existence and location, redact the value, and recommend rotation.
5. **Unknown is not Pass.** If evidence is missing, mark the control `Unknown` and say what evidence would resolve it. Never infer security from the absence of bad signs.

---

## 2. Workflow

### Step 1: Scope and context
Infer from the conversation first. Ask at most a few questions and proceed with stated assumptions if unanswered.
- **Target:** web app, internal network, cloud account, endpoint fleet, small business, home network, IoT deployment, codebase, or whole-organization posture
- **Crown jewels:** customer data, money movement, availability, IP, safety
- **Likely adversaries:** default to opportunistic criminals plus insider mistakes; add targeted fraud or nation-state only if justified
- **Evidence available:** configs, diagrams, policies, code, scan output, interview answers
- **Size and maturity:** scale advice to what the organization can realistically run (a 5-person shop gets a short, high-leverage list)

If the user gives almost nothing, ask for a 3 to 4 line description of the system and run **Quick mode**.

### Step 2: Choose applicable categories
Mark each attack family `In scope`, `Partially`, or `N/A` with a one-line reason (for example, IoT is N/A for pure SaaS with no devices; SQLi is N/A for a static site). Do not pad with irrelevant categories and do not silently drop any.

### Step 3: Assess each in-scope attack
Using the checklists in section 5, for each attack record:
- **Status:** `Pass` (control present, evidence supports it) / `Partial` (exists with gaps) / `Fail` (absent or ineffective) / `Unknown` (no evidence) / `N/A`
- **Evidence:** file, setting, statement, or the missing evidence
- **Likelihood and impact:** Low / Medium / High
- **Fix:** a concrete setting, tool class, or change, not "improve security"

### Step 4: Trace attack chains
Single findings understate risk. Use section 6 to find plausible chains and name the weakest link to fix first.

### Step 5: Prioritize and report
Rank by risk, then surface quick wins by effort. Write the report using section 8, leading with the answer: overall posture, top 3 risks, what to do this week.

---

## 3. Modes

| Mode | When | Output |
|---|---|---|
| **Quick** | Little evidence, user wants a fast read | Half page: top risks by category, 5 to 8 fixes, questions that would sharpen it |
| **Standard** | A described system or some configs | Full report, all in-scope categories |
| **Deep** | Code, configs, architecture, or policies provided | Standard plus file/line-level evidence, attack chains, verification plan |
| **Checklist-only** | User wants a self-assessment form | Tailored checklist from section 5 for them to fill in |

Pick the lightest mode that serves the request and say which one you used.

---

## 4. Scoring and prioritization

**Risk = Likelihood x Impact**

| | Impact Low | Impact Medium | Impact High |
|---|---|---|---|
| **Likelihood High** | Medium | High | Critical |
| **Likelihood Medium** | Low | Medium | High |
| **Likelihood Low** | Low | Low | Medium |

Raise likelihood when the weakness is internet-exposed, trivially automatable (credential stuffing, scanning for known CVEs), or commonly exploited. Raise impact when it touches money movement, regulated data, admin access, or the only copy of critical data.

**Category score (0 to 100):** average of Pass=100, Partial=50, Unknown=25, Fail=0; exclude N/A. Unknown at 25 pulls the score down without calling a gap a failure. A low score with many Unknowns means "we cannot tell yet," not "we are insecure."

**Overall posture bands:** 85+ Strong, 70 to 84 Good, 50 to 69 Fair, 30 to 49 Poor, under 30 Critical. Override upward to Critical if any Critical finding is unremediated on an internet-facing system.

**Roadmap horizons:**
- **Now (days):** Critical findings and cheap high-value fixes (enable MFA, patch internet-facing systems, test backups, close exposed services)
- **Next (weeks):** structural fixes (segmentation, logging and alerting, secrets management, vendor review)
- **Later (quarters):** maturity work (tabletop exercises, red team, zero trust, formal program)

---

## 5. Control checklists by attack family

For each attack: **Ask** (exposure questions), **Verify** (controls), **Red flags**, **Top fixes**. Use only the parts that apply.

### 5.1 Social engineering and phishing
These attacks bypass technology by targeting people, so ask "what happens when a person is fooled?" and assess both prevention and blast radius.

**Phishing**
- Ask: Is email the main outside channel? Do staff handle credentials, invoices, sensitive data? Is there training and a reporting path?
- Verify: SPF, DKIM, DMARC published with DMARC at `quarantine` or `reject`; email gateway with attachment sandboxing and link rewriting; phishing-resistant MFA (FIDO2/passkeys); one-click "report phish" with triage; training with ethical simulations; browser/DNS blocking of malicious domains.
- Red flags: DMARC `p=none` for months; shared mailboxes without MFA; no reporting path.
- Fix: enforce DMARC, phishing-resistant MFA for admins and finance, reporting button, block legacy auth.

**Spear phishing**
- Ask: How much staff detail is public? Who holds privileged access or approves payments?
- Verify: VIP display-name impersonation protection; external-sender banners; lookalike-domain monitoring; role-based training for high-value targets.
- Red flags: public org charts with direct emails; no alerting on newly registered lookalike domains.

**Whaling**
- Ask: Do executives have standing admin rights, personal devices, or control exemptions?
- Verify: no-exception policy for executives; hardware keys; assistants included in training; separate admin and daily accounts; payment approvals that never depend on one person.
- Red flags: "the CEO is exempt from MFA"; executive mail auto-forwarded to personal accounts.

**Smishing and vishing**
- Ask: Does the help desk reset passwords or MFA by phone? Could customers receive imitation SMS?
- Verify: help-desk identity script (call-back to number on file, manager approval, no verbal-only resets); caller ID never treated as proof; guidance on SMS links; registered sender IDs so customers can tell real from fake.
- Red flags: help desk resets MFA "if the caller sounds right" (a very common intrusion route).

**Business Email Compromise (BEC)**
- Ask: Can one person change bank details or release payments? Are invoices accepted by email?
- Verify: dual approval and out-of-band call-back (known number) for payment or bank-detail changes; alerts on new inbox/forwarding rules and impossible-travel logins; MFA on all mailboxes; legacy protocols (IMAP/POP basic auth) disabled.
- Red flags: wire transfers approved by email alone; no alerts on external auto-forward rules.

**Quishing (QR phishing)**
- Ask: Are QR codes used in print or email? Do filters scan images?
- Verify: gateway that extracts URLs from QR images; mobile protection that checks destinations; training that treats QR codes like links; no QR-based login prompts in official communications.
- Red flags: policy says "don't click links" but never mentions QR codes.

### 5.2 Malware
Assess **prevent, detect, contain, recover**. Resilience (backups, segmentation) matters more than any one detection tool.

**Ransomware (including double extortion)**
- Ask: Are backups offline or immutable? Has a full restore ever been tested? Is RDP or VPN exposed? Is the network flat? Who has domain admin?
- Verify: 3-2-1 backups with at least one immutable/offline copy, tested restores, backup credentials separate from the domain; EDR on servers and endpoints with central alerting; fast patching of internet-facing systems (VPNs, firewalls, mail, remote tools); no direct RDP, MFA on all remote access; segmentation, egress filtering, privileged access management, tiered admin; allow-listing or macro/script restrictions; written incident response plan with ransom-decision policy and legal/insurance contacts; knowledge of where sensitive data lives plus monitoring for bulk exfiltration.
- Red flags: backups reachable with domain admin credentials; never restored; internet-facing RDP; one flat network; domain admins used for daily work.
- Fix: immutable backups plus a tested restore; remove exposed RDP; MFA on remote access; EDR.

**Spyware and keyloggers**
- Verify: EDR with behavioral detection; app-install restrictions; MDM and OS updates; browser extension allow-list; password manager; phishing-resistant MFA (limits what captured passwords can do).
- Red flags: users are local admins; unmanaged personal devices reach sensitive systems.

**Trojans**
- Verify: software only from approved sources; code signing and hash verification; allow-listing; web filtering; no local admin by default; executable attachments blocked.
- Red flags: staff download tools from random sites; cracked software on work devices.

**Worms**
- Ask: Can one infected machine reach many others over SMB, RDP, or admin protocols? How fast are critical patches applied?
- Verify: host firewalls and segmentation blocking lateral protocols (SMB/445, RDP/3389, WinRM) between workstations; SMBv1 disabled; patch SLAs (critical within days); vulnerability scanning; detection of scanning behavior.
- Red flags: workstations talk freely to each other; unpatched legacy systems on the main network.

**Wipers**
- Verify: resilience core as for ransomware, plus offline copies of firmware, configs, and golden images; tested rebuild runbooks; protected backup and management consoles; threat-aware monitoring if the org is a plausible geopolitical target.
- Red flags: no documented rebuild process; a single compromised admin can delete all backups.

### 5.3 Identity and credential attacks
Identity is the new perimeter. Look at password policy, MFA strength, sessions, and account recovery.

**Brute force**
- Verify: lockout or progressive delay; rate limits per account and per IP; bot challenge after failures; long-passphrase policy checked against breached lists (not complexity rules); MFA; alerting on failed-login spikes; no default or shared credentials.
- Red flags: unlimited attempts; short maximum password length; public admin interfaces; unchanged defaults.

**Credential stuffing**
- Ask: Do users reuse passwords? Is there a public login endpoint? Is breach data checked?
- Verify: breached-password screening at signup and change; rate limiting and bot detection (device and behavioral signals); MFA or passkeys; alerts on failure ratios and new-device logins; user notification of suspicious logins.
- Red flags: large failed-login volume from many IPs with no alert; no MFA offered to customers.

**MFA fatigue (prompt bombing)**
- Verify: number matching or context in prompts; limits on prompts per time window with lockout after repeated denials; alerts on repeated unanswered or denied pushes; FIDO2/passkeys for privileged users; staff told to report, not approve, unexpected prompts; help desk never approves prompts by phone.
- Red flags: simple approve/deny push; no alerting on repeated prompts.

**SIM swapping**
- Ask: Is SMS used for MFA or recovery? Do executives, finance staff, or high-value customers depend on it?
- Verify: high-value accounts moved from SMS to authenticator apps or hardware keys; SMS removed as a recovery fallback for sensitive accounts; carrier PIN or port-out lock on staff lines; SIM-change signals checked for customer-facing services; recovery flows that never downgrade to SMS.
- Red flags: SMS is the only second factor for admins; recovery bypasses MFA via phone or text.

**Alongside:** short idle timeouts and token rotation; separate admin accounts and just-in-time access; no shared accounts; same-day offboarding; inventory and rotation of service accounts and API keys; no secrets in code or chat.

### 5.4 Network and infrastructure attacks

**DoS and DDoS**
- Ask: What does an hour of downtime cost? Is the origin IP exposed? Is there a CDN or scrubbing service? Are there expensive unauthenticated endpoints?
- Verify: CDN/DDoS protection in front of public services; origin hidden and firewalled to the CDN; rate limits and request-cost limits (pagination caps, query limits); autoscaling with budget alarms; no amplifiable open services (open resolvers, memcached, NTP); DDoS runbook with provider contacts; static fallback page.
- Red flags: origin directly reachable; heavy unauthenticated search or report endpoints; no runbook.
- Do not run load tests against production or third-party systems without explicit authorization.

**Man-in-the-Middle (MITM)**
- Verify: TLS 1.2+ (1.3 preferred) with valid certificates; HSTS; no mixed content; WPA3 or WPA2-Enterprise (no shared PSK for corporate access); VPN or zero-trust on untrusted networks; switch protections (dynamic ARP inspection, DHCP snooping); certificate validation on in internal service calls (never `verify=False`).
- Red flags: HTTP login pages; disabled certificate validation in code; open guest Wi-Fi bridged to internal networks.

**DNS spoofing and poisoning**
- Verify: DNSSEC on your zones; registrar lock and MFA on registrar and DNS accounts; validating, patched resolvers; encrypted DNS where appropriate; CAA records; monitoring for unexpected record changes and certificate transparency logs; cleanup of dangling DNS (subdomain takeover).
- Red flags: registrar account without MFA; old CNAMEs pointing at deprovisioned cloud services; shared DNS admin password.

**Session hijacking**
- Verify: cookies `Secure`, `HttpOnly`, `SameSite`; session ID regenerated at login and privilege change; short lifetimes and idle timeout; server-side invalidation on logout and password change; device or token binding for sensitive apps; Content Security Policy to limit XSS theft; anomaly detection on IP/device change; tokens kept out of logs and URLs.
- Red flags: session IDs in URLs; long-lived tokens with no revocation; tokens logged in plaintext.

**Alongside:** firewall and security-group review (no `0.0.0.0/0` to admin ports 22, 3389, or databases); segmentation of user, server, management, and IoT networks; central logging with time sync; patch SLAs.

### 5.5 Web application and code injection

**SQL injection**
- Ask: Is user input ever concatenated into SQL? What can the app's database account do?
- Verify: parameterized queries or prepared statements everywhere (ORM used correctly, raw queries reviewed); input validation as defense in depth, not the primary fix; least-privilege database user (no DROP, no admin, no unrelated schemas); allow-lists for dynamic `ORDER BY` and table names; generic error messages; WAF as a compensating control; SAST/DAST in CI.
- Code review pattern: look for concatenation or f-strings feeding `execute`, `query`, or `raw`.
- Safe fix example (Python): replace `cursor.execute(f"SELECT * FROM users WHERE id = {uid}")` with `cursor.execute("SELECT * FROM users WHERE id = %s", (uid,))`.
- Red flags: app connects as database admin; verbose SQL errors returned to users.

**Cross-Site Scripting (XSS)**
- Verify: context-aware output encoding by default (framework auto-escaping; audit `innerHTML`, `dangerouslySetInnerHTML`, `v-html`, `|safe`); rich text sanitized with a vetted allow-list library (for example DOMPurify); Content Security Policy without inline scripts; `HttpOnly` cookies; Trusted Types where available.
- Red flags: user-generated HTML rendered raw; no CSP; tokens in `localStorage` where XSS is possible.

**Zero-day exploits**
You cannot patch what is unknown, so assess **exposure reduction and detection**, not only patch status.
- Verify: minimal internet-exposed surface with inventory; defense in depth and segmentation so one bug is not full compromise; least privilege and sandboxing/containers; EDR and behavioral detection; central logging with anomaly alerting; virtual patching via WAF/IPS when no fix exists; subscription to vendor and CISA KEV advisories; emergency patch process (hours for exploited bugs on internet-facing systems); ability to isolate a host or service quickly.
- Red flags: no asset inventory; end-of-life software exposed to the internet; no emergency patch path.

**Alongside (OWASP-style):** server-side authorization on every request (watch for IDOR: changing an ID reveals another user's data); CSRF protection, security headers, safe file uploads, SSRF controls; dependency and secrets scanning in CI; no production data in test.

### 5.6 Advanced and complex vectors

**Supply chain attacks**
- Ask: How many third-party libraries, build tools, SaaS vendors, and managed providers have access? Can a vendor reach your network or data directly?
- Verify (software): lockfiles and pinned versions; dependency scanning and SBOM; signature/hash verification; private registry or proxy with allow-listing; protection against dependency confusion and typosquatting; short adoption delay for brand-new releases; hardened CI/CD (least-privilege runners, protected branches, required review, short-lived credentials, no long-lived pipeline secrets); build provenance where feasible.
- Verify (vendors): inventory and tiering; security attestations for critical vendors; contractual breach notification; least-privilege, time-limited, monitored vendor access; exit plan.
- Red flags: `latest` tags in production; CI secrets exposed to fork pull requests; permanent vendor admin access; no vendor list.

**Insider threats**
- Ask: Who can reach sensitive data or production? Is access reviewed? What happens when someone leaves or is disgruntled?
- Verify: least privilege and role-based access with periodic reviews; separation of duties; audit logging with alerts for bulk export, off-hours access, privilege changes; DLP where proportionate; prompt offboarding; clear acceptable-use policy; confidential reporting channel. Treat accidental insiders (misdelivery, misconfiguration) as seriously as malicious ones.
- Red flags: shared admin passwords; ex-employee accounts still active; no logging of data exports.

**IoT attacks**
- Ask: What connects (cameras, printers, sensors, appliances, building systems)? Can devices reach the internet or internal networks? Any default credentials?
- Verify: device inventory; defaults changed and unused services disabled (telnet, UPnP); isolated VLAN/SSID with default-deny to internal networks; firmware update process and end-of-support tracking; vendors with security update commitments; blocked unnecessary outbound traffic; monitoring for botnet-like behavior; remote access disabled or behind VPN.
- Red flags: cameras port-forwarded to the internet; IoT on the same network as workstations; devices that can never be patched.

**AI-powered attacks**
Attackers use AI to scale and polish social engineering, clone voices and faces, and speed up reconnaissance and malware variation. Defense is mostly **process and verification**, since content can no longer be trusted to look "off."
- Verify: out-of-band verification for any urgent money, credential, or sensitive-data request regardless of how convincing the voice or video is (consider shared code words for executives and finance); dual approval on payments, never by voice or video alone; reduced public voice, video, and personal data; email filtering that uses behavioral and relationship analysis, not grammar or keyword cues; training that says "perfect grammar and a familiar voice prove nothing"; fast patching and behavioral detection for rapidly mutating malware.
- If the organization **uses** AI systems: treat content read by models as untrusted (prompt injection), limit agent permissions and tool access, keep secrets out of prompts and logs, review data-sharing with AI vendors, require human approval for high-impact actions.
- Red flags: payments authorized from a voice call; "bad English" as the main phishing tell; AI agents with broad write access reading untrusted email or web content.

### 5.7 Cross-cutting foundations (check for every target)
A gap here raises the risk of many findings above.

| Foundation | What good looks like |
|---|---|
| Asset and data inventory | You know what you have, where sensitive data lives, and what is internet-facing |
| Patch and vulnerability management | Defined SLAs; critical internet-facing fixes within days; EOL tracked |
| Identity and access | MFA everywhere (phishing-resistant for admins), least privilege, access reviews, fast offboarding |
| Logging and detection | Central logs, alerts on high-signal events, retention long enough to investigate |
| Backup and recovery | Immutable/offline copies, restores tested, documented RTO/RPO |
| Segmentation | Critical systems and IoT isolated; no flat network |
| Secure configuration | Hardened baselines, no defaults, cloud posture checks |
| Incident response | Written plan, named roles and contacts, tabletop in the last year |
| Training and culture | Role-based training, easy reporting, blameless response |
| Governance | Policies, ownership, risk register, vendor management |

---

## 6. Attack chains

After the per-attack pass, include any chain that is plausible given the findings.

| Chain | Typical path | Break it with |
|---|---|---|
| Phish to ransomware | Phishing -> stolen credentials -> weak/no MFA -> lateral movement -> flat network -> ransomware plus data leak | Phishing-resistant MFA, segmentation, EDR, offline backups |
| Credential reuse to takeover | Breach elsewhere -> credential stuffing -> no rate limiting -> session abuse | Breached-password checks, rate limits, passkeys, anomaly detection |
| MFA bypass | Password known -> push spam or SIM swap -> account takeover | Number matching, FIDO2/passkeys, no SMS for high-value accounts |
| Web to data theft | Unpatched or injectable app -> database access -> exfiltration | Parameterized queries, least-privilege DB user, WAF, egress monitoring |
| Supply chain to prod | Compromised dependency or vendor -> build or runtime foothold | Pinned and verified dependencies, SBOM, limited vendor access |
| Insider plus weak logging | Over-privileged user -> bulk export -> no alert | Least privilege, DLP, audit logging with alerting |
| IoT pivot | Default-credential device -> flat network -> internal systems | Device VLAN, credential rotation, firmware updates |
| Deepfake fraud | AI voice/video of executive -> urgent payment request -> no out-of-band check | Call-back verification, dual approval |

---

## 7. Framework mapping (use when the user wants standards alignment)

Approximate guides for orientation, not compliance determinations. Verify identifiers against current framework versions before citing formally.

| Attack | MITRE ATT&CK | OWASP / other |
|---|---|---|
| Phishing, spear phishing, whaling, quishing | T1566 | |
| BEC | T1534, T1114, T1098 | |
| Ransomware | T1486, T1490, T1567/T1041 | |
| Spyware, keyloggers | T1056.001, T1113 | |
| Trojans | T1204, T1036 | |
| Worms | T1210, T1021 | |
| Wipers | T1485, T1561 | |
| Brute force, credential stuffing | T1110 (.001, .003, .004) | OWASP OAT-008; Authentication Cheat Sheet |
| MFA fatigue | T1621 | |
| SIM swapping | T1451 (Mobile) | |
| DoS / DDoS | T1498, T1499 | |
| MITM, DNS spoofing | T1557, T1584.002 | |
| Session hijacking | T1539, T1550 | OWASP Session Management Cheat Sheet |
| SQLi, XSS, zero-day on web apps | T1190 | OWASP Top 10 "Injection"; SQLi and XSS Prevention Cheat Sheets; ASVS |
| Supply chain | T1195, T1199 | OWASP supply chain / vulnerable components categories |
| Insider | T1078, T1530, T1052 | |
| IoT | T1190, T1078; ATT&CK for ICS if industrial | |
| AI-powered | Enhances T1566, T1598, T1656 | OWASP Top 10 for LLM Applications (for AI systems you run) |

**NIST CSF 2.0 functions:** Govern, Identify, Protect, Detect, Respond, Recover. Rough fit: social engineering is Protect (training, identity), Detect, Respond; malware is Protect, Detect, Recover; identity is Protect (access control); network is Protect (resilience), Detect; web injection is Identify, Protect (secure development), Detect; supply chain and insider are Govern, Protect, Detect.

**CIS Controls v8 quick map:** assets (1, 2), data protection (3), secure configuration (4), accounts and access (5, 6), vulnerability management (7), logging (8), email and browser defense (9), malware defense (10), data recovery (11), network (12, 13), training (14), service providers (15), application security (16), incident response (17), penetration testing (18). Recommend Implementation Group 1 safeguards for small organizations.

**Compliance regimes** (PCI DSS, HIPAA, ISO 27001, SOC 2, GDPR, local privacy law): if the user names one, add a short "Compliance relevance" note to affected findings and state that this review does not certify compliance.

---

## 8. Report template

```
# Security Posture Review: [Target]
Date | Mode (Quick/Standard/Deep) | Basis: [evidence reviewed]

## 1. Bottom line
[2-4 sentences: overall posture band, the single biggest risk, what to do this week]
Top 3 risks: 1. [risk, why it matters, one-line fix]  2. ...  3. ...
Do this week: [3-5 cheapest, highest-value actions]

## 2. Scope and assumptions
In scope | Assumed adversary | Assumptions made for missing evidence | Categories N/A and why

## 3. Scorecard
| Attack family | Score | Pass | Partial | Fail | Unknown | Highest risk |
(rows: social engineering, malware, identity, network, web/injection, advanced vectors)
Scoring note: Pass=100, Partial=50, Unknown=25, Fail=0, N/A excluded.

## 4. Attack chains
Chain: [name]  step -> step -> step
Weakest link: [finding] | Break it by: [control]

## 5. Findings (ordered by risk, then effort)
### [ID] [Attack]: [title] (Risk: Critical/High/Medium/Low)
Status | Likelihood / Impact | Evidence | Why it matters (plain language)
Fix | Effort (Low/Med/High) | Verify by: [how to confirm the fix worked]

## 6. Remediation roadmap
| Horizon (Now/Next/Later) | Action | Stops | Effort | Owner |

## 7. What would improve this assessment
[Evidence that would resolve Unknowns: DMARC record, restore test result, firewall export, access review list]

## 8. Limits of this review
Posture review on information provided; not a penetration test, compliance audit, or guarantee. Not assessed: [list]
```

For Quick mode, use only sections 1, 5 (top items), and 7.

---

## 9. Writing quality bar

- **Be specific.** "Enable number matching in the authenticator policy" beats "strengthen MFA."
- **Tie each recommendation to the attack it stops**, so the reader sees why it matters.
- **Calibrate confidence.** Separate what the evidence shows from what you assume.
- **Prefer controls that remove whole attack classes** (passkeys, parameterized queries, immutable backups, segmentation) over controls that chase individual symptoms.
- **Match the audience.** Executives get risk and cost of inaction; engineers get settings and code.
- **Stay proportionate.** Small environments get a short, high-leverage list, not a 60-item program.
- **End with what was not assessed**, so nobody mistakes the report for a full penetration test or compliance audit.

