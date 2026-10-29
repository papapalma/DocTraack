---
description: This skill gives you the facts, procedure, and rules for the Class Diagram. It also tells you how to write the answer in Simplified Technical English (STE).
---

## Workflow
 
1. **Find the task type.** The user wants one of these:
   - An explanation of the diagram.
   - A new diagram (as diagram code).
   - A document, guide, or procedure about the diagram.
   - A review of an existing diagram.
2. **Get the inputs.** Use the **Inputs** list in this skill. If the user gave enough data, continue. If data is missing, state your assumptions in one line, or ask one question. Do not ask more than one.
3. **Write the output.** Follow the STE writing rules. Use the output format for the task type.
4. **Check the output.** Do the final check at the end of this file.
5. **Check the fit.** If another diagram fits the need better, say so in one sentence. Related diagrams: Object Diagram (for instances), Package Diagram (to group classes).
## Output formats
 
**Explanation (chat).** Give the Purpose in one or two sentences. Then give the part that the user asked for (inputs, symbols, procedure, or rules). Do not copy the whole section if the user asked a narrow question.
 
**New diagram.** Give the diagram as code in a fenced block. Then add a short STE note: what the diagram shows and which rules you applied. Code format for this diagram: Mermaid `classDiagram`.
 
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
 
# Class Diagram Reference
 
## Purpose
The Class Diagram shows the classes of a system. It shows the data (attributes) and the actions (operations) of each class. It also shows how the classes relate to each other.
 
## Inputs
- A list of the main concepts (nouns) in the requirements.
- The data that each concept holds.
- The actions that each concept can do.
- The relationships between the concepts.
## Symbols
A class is a rectangle with three compartments:
 
1. The top compartment holds the class name.
2. The middle compartment holds the attributes.
3. The bottom compartment holds the operations.
| Visibility mark | Meaning |
|---|---|
| `+` | Public |
| `-` | Private |
| `#` | Protected |
| `~` | Package |
 
| Relationship | Line style |
|---|---|
| Association | Solid line |
| Aggregation | Solid line with a hollow diamond at the "whole" end |
| Composition | Solid line with a filled diamond at the "whole" end |
| Inheritance (generalization) | Solid line with a hollow triangle at the parent end |
| Realization | Dashed line with a hollow triangle at the interface end |
| Dependency | Dashed line with an open arrow |
 
## Procedure
1. Find the nouns in the requirements. These are candidate classes.
2. Remove the nouns that are not part of the system.
3. Draw one rectangle for each class. Write the class name in the top compartment.
4. Add the attributes. Write the name, a colon, and the type (for example, `- price: Decimal`).
5. Add the operations. Write the name, the parameters, and the return type (for example, `+ getTotal(): Decimal`).
6. Draw the relationships between the classes.
7. Write the multiplicity at each end of an association (for example, `1`, `0..1`, `*`, `1..*`).
8. Examine the diagram. Make sure that each class has a clear single responsibility.
## Rules
- Use a singular noun for a class name. Start the name with a capital letter.
- Use italics for the name of an abstract class.
- Write `<<interface>>` above the name of an interface.
- Use composition when the part cannot exist without the whole.
- Use aggregation when the part can exist alone.
- Show multiplicity on each association.
- Do not show all attributes and operations if they make the diagram unclear. Show only the important ones.
> **WARNING:** Do not use inheritance only to reuse code. Use inheritance only when the child "is a" type of the parent.
 
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