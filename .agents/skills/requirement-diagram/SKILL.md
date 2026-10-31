---
name: requirement-diagram
description: "This skill gives you the facts, procedure, and rules for the Requirement Diagram (SysML). It also tells you how to write the answer in Simplified Technical English (STE)."
---

# Requirement Diagram

## Workflow
 
1. **Find the task type.** The user wants one of these:
   - An explanation of the diagram.
   - A new diagram (as diagram code).
   - A document, guide, or procedure about the diagram.
   - A review of an existing diagram.
2. **Get the inputs.** Use the **Inputs** list in this skill. If the user gave enough data, continue. If data is missing, state your assumptions in one line, or ask one question. Do not ask more than one.
3. **Write the output.** Follow the STE writing rules. Use the output format for the task type.
4. **Check the output.** Do the final check at the end of this file.
5. **Check the fit.** If another diagram fits the need better, say so in one sentence. Related diagrams: Use Case Diagram (for early scoping), Component Diagram (for the design elements).
## Output formats
 
**Explanation (chat).** Give the Purpose in one or two sentences. Then give the part that the user asked for (inputs, symbols, procedure, or rules). Do not copy the whole section if the user asked a narrow question.
 
**New diagram.** Give the diagram as code in a fenced block. Then add a short STE note: what the diagram shows and which rules you applied. Code format for this diagram: Mermaid `requirementDiagram`.
 
> **NOTE:** Mermaid and PlantUML do not draw every UML symbol. If a symbol is not available, use the closest symbol and add a NOTE that names the difference.
 
**Document or guide.** Write Markdown. Use the five-part structure: Purpose, Inputs, Symbols, Procedure, Rules. If the user wants a file, make a `.md` file (or the format that they name).
 
**Review.** List each problem with the rule that it breaks. Give the fix for each problem. Put the most serious problems first.
 
## STE writing rules
 
Apply these rules to all text that you write for this skill. They follow the main ideas of ASD-STE100. You cannot check against the official dictionary, so do not claim full compliance. If the user needs official compliance, tell them to use an STE checker.
 
Apply these rules to all text that you write for this skill. They follow the main ideas of ASD-STE100. You cannot check against the official dictionary, so do not claim full compliance. If the user needs official compliance, tell them to use an STE checker.
 
**Sentences**
1. Write procedure sentences with 20 words or fewer. Write descriptive sentences with 25 words or fewer.
2. Give one instruction in each sentence.
3. Start each procedure step with a verb in the imperative (for example, "Draw the lifeline.").
4. Put a condition at the start of the sentence (for example, "If the object has no name, use `:Class`.").
5. Limit each paragraph to six sentences.
6. Use a vertical list for three or more items.
**Words**
7. Use one word for one meaning. Use the same word for the same thing in all places. Do not use synonyms to make the text "more interesting".
8. Use simple verbs: *use* (not *utilize*), *make sure* (not *ensure*), *start* (not *initiate*), *show* (not *illustrate*).
9. Do not use phrasal verbs or idioms (for example, "set up", "carry out", "rule of thumb"). Use a single verb: *install*, *do*, *guideline*.
10. Use the articles *a*, *an*, and *the*. Do not drop them.
11. Do not use contractions (write "do not", not "don't"). Do not use "e.g." or "i.e." Write "for example" and "that is".
12. Keep noun clusters to three words or fewer. Use *of* or *for* to break a long cluster.
13. Spell out an abbreviation the first time that you use it.
 
**Grammar**
14. Use the active voice. Do not use the passive voice, unless the actor is not known.
15. Use the simple present tense for facts and rules. Use the imperative for instructions. Use the simple future ("will") only for a result in a later step.
16. Do not use the *-ing* form as a verb. Use it only in a technical name (for example, "Timing Diagram").
17. Use *can* for ability. Use *must* for a rule that you cannot break. Use *should* only for a good practice.
 
**Safety and notes**
18. Put a WARNING before a step that can cause a serious error or an unsafe design. Put a CAUTION before a step that can cause a small error. Put a NOTE for extra information.
19. Write each WARNING, CAUTION, and NOTE as a short, direct statement.
 
## General rules for all diagrams
 
Apply these rules to each diagram that you make or review.
 
Apply these rules to each diagram that you make or review.
 
1. Decide the audience before you start. Make the diagram for that audience.
2. Show one level of detail in one diagram. Do not mix high-level and low-level items.
3. Give each element a short, clear name. Use the same name for the same item in all diagrams.
4. Use nouns for things. Use verbs for actions.
5. Use only standard symbols. If you use a non-standard symbol, add a legend.
6. Put a title on each diagram. Show the diagram type and the scope.
7. Do not cross lines if you can avoid it.
8. Limit each diagram to about 7 to 15 main elements. If the diagram has more, split it.
9. Make sure that each element has a reason to be there. Remove all other elements.
10. Ask a second person to review the diagram before release.
---
 
# Requirement Diagram (SysML) Reference
 
## Purpose
The Requirement Diagram shows text requirements and links them to the design elements and tests that satisfy or verify them. It proves that the built system meets the client specification.
 
## Inputs
- The list of requirements, each with an ID and a text.
- The design elements (blocks, components) of the system.
- The test cases.
- The relationships between all of these.
## Symbols
| Symbol | Meaning |
|---|---|
| Rectangle with `<<requirement>>` | A requirement (with `id` and `text`) |
| Rectangle with `<<block>>` | A design element |
| Rectangle with `<<testCase>>` | A test that checks a requirement |
| Line with a crossed circle at the parent end, `<<contain>>` | A requirement contains a sub-requirement |
| Dashed arrow with `<<deriveReqt>>` | A requirement is derived from another |
| Dashed arrow with `<<satisfy>>` | A design element satisfies a requirement |
| Dashed arrow with `<<verify>>` | A test case verifies a requirement |
| Dashed arrow with `<<refine>>` | A model element adds detail to a requirement |
| Dashed arrow with `<<trace>>` | A general link between elements |
 
## Procedure
1. Collect all requirements from the client specification.
2. Give each requirement a unique ID (for example, `REQ-012`).
3. Write each requirement as one clear sentence with a measurable value.
4. Draw each requirement as a rectangle with `<<requirement>>`.
5. Draw `<<contain>>` lines to show the requirement hierarchy.
6. Draw `<<deriveReqt>>` arrows from derived requirements to their source.
7. Add the design elements. Draw `<<satisfy>>` arrows from each element to the requirement it satisfies.
8. Add the test cases. Draw `<<verify>>` arrows from each test case to the requirement it checks.
9. Find each requirement that has no `<<satisfy>>` or `<<verify>>` link. Resolve it.
## Rules
- Give each requirement a unique ID.
- Write each requirement so that you can test it.
- Link each requirement to at least one design element and at least one test case.
- Write one requirement in one rectangle. Do not combine requirements.
- Do not link a test case to a requirement it does not check.
> **WARNING:** A requirement with no `<<satisfy>>` link is not implemented. A requirement with no `<<verify>>` link is not proven. Both conditions are a risk to the project.
 
---
 
## Final check
 
Do this check before you give the output to the user.
 
Do this check before you give the output to the user.
 
1. Make sure that the diagram has a title and a diagram type.
2. Make sure that all symbols are standard, or that a legend explains them.
3. Make sure that names are clear and consistent.
4. Make sure that the diagram follows the Rules section of this skill.
5. Make sure that the level of detail is correct for the audience.
6. Make sure that the text follows the STE writing rules.
7. If you gave diagram code, make sure that the syntax is valid for the tool.
