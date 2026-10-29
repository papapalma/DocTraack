# Interaction Overview Diagram: Student Applicant Domain

## 1. Description
This interaction overview diagram combines high-level activity decision logic with sequence interaction frames to depict the student journey from discovering scholarship opportunities to tracking qualification results.

## 2. ASD-STE100 Technical Specifications
- Illustrate student navigation choices using decision nodes.
- Reference sequence interactions inside enclosed frame boxes.
- Guide failed submissions through corrective loops before completion.

## 3. Interaction Overview Diagram (Mermaid)

```mermaid
graph TD
    StartNode([Start: Student Visits MinSU Portal]) --> Frame_Browse["sd: BrowseAnnouncements<br/>- View active Annex 2 calls<br/>- Check eligibility & deadlines"]

    Frame_Browse --> Decision_Action{"Student Intent"}

    Decision_Action -->|Check Existing Application| Frame_Track["sd: InquireTrackingCode<br/>- Enter TDP code<br/>- View evaluation status"]
    Frame_Track --> EndTrack([End: Status Checked])

    Decision_Action -->|Apply for Scholarship| Frame_Form["sd: CompleteApplicationForm<br/>- Enter personal & academic data<br/>- Attach scanned documents"]

    Frame_Form --> Decision_Files{"Are Files Valid?<br/>(<= 5MB, PDF/JPG)"}

    Decision_Files -->|No| Frame_Error["sd: DisplayValidationError<br/>- Alert oversized or invalid format"]
    Frame_Error --> Frame_Form

    Decision_Files -->|Yes| Frame_Submit["sd: SaveApplicationRecord<br/>- Issue tracking code<br/>- Generate downloadable receipt"]

    Frame_Submit --> EndApply([End: Application Completed])

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Frame["sd: InteractionFrame<br/>(Sub-sequence scenario)"]:::legFrame
        L_Dec{"{Decision Node}"}:::legDec
        L_Term(["([Terminal / End])"]):::legTerm
        L_Frame --> L_Dec
        L_Dec -->|Approved / Success| L_Term
    end
    classDef legFrame fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legDec fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
    classDef legTerm fill:#123F17,stroke:#1B5E20,color:#fff;
```

---

## 4. Diagram Legend & Symbol Guide

| Symbol / Element | Syntax / Type | Technical Meaning | MinSU Interaction Context |
|---|---|---|---|
| `sd: FrameName` | `["sd: ..."]` | Sequence interaction scenario frame | Encapsulates an entire sequence scenario (e.g., `Authenticate`, `ReviewQueue`) |
| `{Decision}` | `{"Decision"}` | Activity decision branch point | Critical decision gate (e.g., approval vs. return, variance check) |
| `([Pill Node])` | `([Start / End])` | Lifecycle start or terminal archive node | Initiating semester operations or locking final records in archive |
| `-->` Solid Arrow | Control Flow Connector | Sequential hand-off between frames | Passing control from one interaction frame to the next |
| `-->|Label|` | Guarded Branch | Conditional scenario path | "Yes: Approved", "No: Discrepancy", "Return with Remarks" |
| 🟢 Green Box | `#F1F8F1` / `#1B5E20` | Successful Workflow Phase | Forward operational processing and executive approval |
| 🟡 Gold Diamond | `#FFF1C2` / `#B88A00` | Institutional Checkpoint | Evaluation queue and zero-variance fiscal math check |


## 5. Interaction Frame Descriptions
- **BrowseAnnouncements**: Presents open TDP calls, available campus quotas, and strict submission cutoff dates.
- **InquireTrackingCode**: Provides instant evaluation feedback for existing applicants.
- **CompleteApplicationForm**: Collects student biodata, academic program details, and proof documents.
- **DisplayValidationError**: Warns students of invalid attachments or empty required fields.
- **SaveApplicationRecord**: Commits the verified application packet and outputs a printable receipt slip.
