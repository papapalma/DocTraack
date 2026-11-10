# Communication Diagram: MinSU DocTrack Whole System

## 1. Description
This communication diagram visualizes the structural links and sequenced messages exchanged between core software subsystems across MinSU DocTrack. It highlights message traffic density, inter-service coordination, verification workflows, and document generation during peak operations.

## 2. ASD-STE100 Technical Specifications
- Number messages sequentially to indicate invocation order.
- Connect interacting subsystems with explicit communication links.
- Emphasize high-volume collaboration between controllers, engines, and persistence adapters.

---

## 3. System Communication Diagram (Mermaid)

```mermaid
graph LR
    ClientUI["1: webClient : BrowserClient"]
    Gateway["2: gateway : AppRouterGateway"]
    AuthSvc["3: auth : AuthService / 2FA Guard"]
    DocEngine["4: docEngine : DocumentWorkflowEngine"]
    VerifyEngine["5: verify : VerificationEngine"]
    ExportEngine["6: export : ExcelAndWordExporter"]
    DB["7: db : PrismaClient"]
    Audit["8: audit : AuditLogger"]
    Notif["9: notif : NotificationHub"]

    ClientUI -- "1: sendUserRequest(payload)<br/>14: renderResponse(data)" --> Gateway
    Gateway -- "2: verifySessionAndRole(token)" --> AuthSvc
    Gateway -- "3: processDocument(docPayload)" --> DocEngine
    Gateway -- "4: runTripartiteMatch(csvDatasets)" --> VerifyEngine
    Gateway -- "5: streamExcelWorkbook(docId)" --> ExportEngine
    
    VerifyEngine -- "6: executeFuzzyMatch(chedRows, sysRows)" --> VerifyEngine
    VerifyEngine -- "7: persistRunResults(results)" --> DB
    VerifyEngine -- "8: emitAudit(VERIFICATION_RUN)" --> Audit

    DocEngine -- "9: executeTransaction(docData)" --> DB
    DocEngine -- "10: emitAuditRecord(userId, action)" --> Audit
    DocEngine -- "11: broadcastUpdate(recipients, msg)" --> Notif

    ExportEngine -- "12: queryFullRoster(docId)" --> DB
    Audit -- "13: writeAuditRow(auditPayload)" --> DB

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Node["Node : Subsystem Component"]:::legNode
        L_Msg["Link: N: methodName(args)"]:::legMsg
        L_Node -->|Call Sequence| L_Msg
    end
    classDef legNode fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legMsg fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
```

---

## 4. Diagram Legend & Symbol Guide

| Element | Format / Syntax | Technical Meaning | MinSU Implementation Context |
|---|---|---|---|
| Subsystem Node | `[N: name : Class]` | Structural software participant | `AppRouterGateway`, `VerificationEngine`, `PrismaClient` |
| Link Connector | `-- "..." -->` | Directed communication channel | HTTP request, RPC method call, or database query |
| Numbered Prefix | `1:`, `2:`, `14:` | Chronological message sequence number | Order of execution from user trigger to database write and UI response |
