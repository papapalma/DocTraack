# Profile Diagram

> **System:** MinSU DocTrack  
> **Diagram Type:** UML Profile Diagram  
> **Target Domain:** MinSU Tulong Dunong Program (TDP) Governance

---

## 1. Purpose

The Profile Diagram defines domain-specific UML extensions for the MinSU Tulong Dunong Program. It defines stereotypes, metaclasses, and tagged values for institutional document governance, 3-way verification, two-factor security, and multi-format document generation.

---

## 2. Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef metaStyle fill:#F6F8F6,stroke:#55645B,stroke-width:1.5px,color:#1F2A24;
    classDef stereoStyle fill:#DCEFDD,stroke:#1B5E20,stroke-width:2px,color:#123F17;
    classDef propStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:1px,color:#1F2A24;

    subgraph METACLASSES["Standard UML Metaclasses"]
        MetaClass["<<metaclass>><br/>Class"]:::metaStyle
        MetaComponent["<<metaclass>><br/>Component"]:::metaStyle
    end

    subgraph PROFILE["<<profile>> MinSU_TDP_Profile"]
        TDPAnnex["<<stereotype>><br/>TDPAnnex<br/>+annexNumber: Int<br/>+signatoryRole: Role<br/>+chedFormatId: String"]:::stereoStyle
        
        FinancialAnnex["<<stereotype>><br/>FinancialAnnex<br/>+requiresDisbursementCheck: Boolean<br/>+currencyUnit: String = 'PHP'"]:::stereoStyle

        AuditedEntity["<<stereotype>><br/>AuditedEntity<br/>+immutableLog: Boolean = true<br/>+retentionPeriodYears: Int = 7"]:::stereoStyle

        TripartiteVerified["<<stereotype>><br/>TripartiteVerified<br/>+confidenceScore: Float<br/>+discrepancyStatus: String"]:::stereoStyle

        TwoFactorProtected["<<stereotype>><br/>TwoFactorProtected<br/>+totpRequired: Boolean = true<br/>+allowRecoveryCodes: Boolean"]:::stereoStyle

        Exportable["<<stereotype>><br/>Exportable<br/>+excelJsWorkbook: Boolean = true<br/>+wordDocxLetter: Boolean"]:::stereoStyle
    end

    %% Stereotype Extensions
    TDPAnnex -- "<<extension>>" --> MetaClass
    AuditedEntity -- "<<extension>>" --> MetaClass
    TripartiteVerified -- "<<extension>>" --> MetaClass
    TwoFactorProtected -- "<<extension>>" --> MetaComponent
    Exportable -- "<<extension>>" --> MetaComponent
    FinancialAnnex -- "<<generalization>>" --> TDPAnnex

    %% ─── 📌 VISUAL LEGEND ───
    subgraph LEGEND ["📌 Diagram Legend"]
        direction TB
        L_Meta["<<metaclass>><br/>UML Foundation"]:::metaStyle
        L_Stereo["<<stereotype>><br/>Domain Extension<br/>+taggedValue: Type"]:::stereoStyle
        L_Stereo -- "<<extension>>" --> L_Meta
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Profile Mechanism | MinSU Governance Application |
|---|---|---|---|
| `<<metaclass>>` | `fill:#F6F8F6` | Core UML base meta-element | Standard UML `Class` or `Component` |
| `<<stereotype>>` | `fill:#DCEFDD` | Domain-specific extension | `TDPAnnex`, `FinancialAnnex`, `TripartiteVerified`, `TwoFactorProtected`, `Exportable` |
| `<<extension>>` | Solid Arrow | Metaclass specialization | Extends basic UML elements with custom TDP compliance metadata |
| `<<generalization>>` | Open Arrow | Stereotype inheritance | `FinancialAnnex` inherits general `TDPAnnex` properties |

---

## 4. PlantUML Profile Diagram

```plantuml
@startuml
skinparam classBackgroundColor #FFFFFF
skinparam classBorderColor #1B5E20

class "Class" as MetaClass <<metaclass>>
class "Component" as MetaComponent <<metaclass>>

package "<<profile>> MinSU_TDP_Profile" {
  class "TDPAnnex" as TDPAnnex <<stereotype>> {
    +annexNumber: Int
    +signatoryRole: Role
  }

  class "FinancialAnnex" as FinAnnex <<stereotype>> {
    +requiresDisbursementCheck: Boolean
    +currencyUnit: String = "PHP"
  }

  class "TripartiteVerified" as Verify <<stereotype>> {
    +confidenceScore: Float
    +discrepancyStatus: String
  }

  class "TwoFactorProtected" as 2FA <<stereotype>> {
    +totpRequired: Boolean
  }

  class "Exportable" as Export <<stereotype>> {
    +excelJsWorkbook: Boolean
  }
}

TDPAnnex -up-> MetaClass : <<extension>>
Verify -up-> MetaClass : <<extension>>
2FA -up-> MetaComponent : <<extension>>
Export -up-> MetaComponent : <<extension>>
FinAnnex -up-> TDPAnnex : <<generalization>>
@enduml
```
