# Profile Diagram: Accounting Officer Domain

## 1. Description
This UML profile diagram defines domain-specific stereotypes, tagged values, and constraints tailored to the financial management modules of the MinSU DocTrack system.

## 2. ASD-STE100 Technical Specifications
- Extend standard UML meta-classes with domain stereotypes.
- Tag financial classes with currency codes and precision rules.
- Enforce strict balance constraints through tagged validation definitions.

## 3. Profile Diagram (Mermaid)

```mermaid
classDiagram
    direction TB

    class Metaclass_Class {
        <<metaclass>>
        Class
    }

    class Metaclass_Property {
        <<metaclass>>
        Property
    }

    class FinancialAnnex {
        <<stereotype>>
        +annexNumber: Int
        +requiresBankReconciliation: Boolean
        +requiresDirectorApproval: Boolean
    }

    class CurrencyPrecision {
        <<stereotype>>
        +currencyCode: String = "PHP"
        +decimalPlaces: Int = 2
        +allowNegative: Boolean = false
    }

    class ZeroVarianceRule {
        <<stereotype>>
        +tolerance: Float = 0.00
        +enforceOnSubmit: Boolean = true
    }

    Metaclass_Class <|-- FinancialAnnex : extends
    Metaclass_Property <|-- CurrencyPrecision : extends
    Metaclass_Class <|-- ZeroVarianceRule : extends

    %% ─── 📌 VISUAL LEGEND ───
    subgraph LEGEND ["📌 Diagram Legend"]
        direction TB
        L_Meta["<<metaclass>><br/>UML Foundation"]:::metaStyle
        L_Stereo["<<stereotype>><br/>Domain Extension<br/>+taggedValue: Type"]:::stereoStyle
        L_Stereo -- "<<extension>>" --> L_Meta
    end
```

---

## 4. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Profile Mechanism | MinSU Governance Application |
|---|---|---|---|
| `<<metaclass>>` Box | `fill:#F6F8F6, stroke:#55645B` | Core UML base meta-element | Standard UML `Class` or `Component` |
| `<<stereotype>>` Box | `fill:#DCEFDD, stroke:#1B5E20` | Domain-specific extension | `<<TDPAnnex>>`, `<<FinancialAnnex>>`, `<<AuditedEntity>>`, `<<ExecutiveReviewable>>` |
| `+taggedValue: Type` | Tagged Value Attribute | Metadata property attached to stereotype | `annexNumber`, `signatoryRole`, `slaHours = 48`, `requiresDisbursementCheck` |
| `-- "<<extension>>" -->` | Extension Relationship | Extends metaclass semantics | Connects custom TDP stereotype to standard UML metaclass |
| `-- "<<generalization>>" -->` | Specialization Hierarchy | Stereotype inheritance | `FinancialAnnex` inherits all properties of `TDPAnnex` |


## 5. Stereotype Definitions
- **`<<FinancialAnnex>>`**: Applied to document models representing Annexes 6, 7, 8, and 9. Dictates review policies and banking rules.
- **`<<CurrencyPrecision>>`**: Applied to monetary fields. Fixes precision to two decimal digits in Philippine Peso (`PHP`).
- **`<<ZeroVarianceRule>>`**: Applied to financial entities. Prevents submission if the calculated variance does not equal 0.00.
