# Anti-AI-Slop Catalog & Quality Heuristics

This catalog encodes the quality gate developed across Meng To's design systems and the Impeccable UI anti-slop guidelines. It serves as an audit checklist to prevent generic, repetitive, or ungrounded AI-generated design choices.

---

## What is "Design Slop"?

> **Slop is not a color, font, gradient, card, or animation. It is a choice made by reflex rather than for the product.**

An element is likely slop when:
1. It could be pasted into an unrelated product without noticing any difference.
2. It repeats a familiar generated-design trope (e.g. gratuitous purple gradient blobs, floating glowing spheres, random bento boxes with no content variance).
3. It communicates no useful information, state, hierarchy, or brand narrative.
4. It competes with content, slows down the user, or creates unnecessary cognitive load.

---

## 1. Product & Direction Defects

| Problem | Heuristic Check | Meng To / Craft Fix |
| :--- | :--- | :--- |
| **Generic Identity** | Visual style feels like a generic template with swapped copy. | Establish a singular visual thesis rooted in the actual user workflow. |
| **Competing Focal Points** | Several glowing elements or buttons fighting for first attention. | Enforce one dominant focal point per viewport; demote secondary items. |
| **Decorative Disconnect** | Tech/cyberpunk aesthetic used for a calm enterprise finance or healthcare tool. | Align material, tone, and density with the domain reality. |
| **Imported Fragment** | A section looks copied from a different UI library (mismatched fonts, borders, or colors). | Harmonize the section to use the host design tokens and spacing scale. |

---

## 2. Layout, Containers & Shapes

| Problem | Heuristic Check | Meng To / Craft Fix |
| :--- | :--- | :--- |
| **Card Epidemic** | Every paragraph, metric, and icon is wrapped inside its own individual card. | Use proximity, whitespace, and subtle dividers instead of borders/boxes. |
| **Ornamental Bento Grid** | A 3x3 bento grid created just because it looks modern, even though items have uniform importance. | Use standard symmetric grids or lists when content is uniform; reserve bento layouts for true asymmetric data hierarchies. |
| **Nested Card Russian Dolls** | Cards placed inside cards inside larger container cards. | Flatten surfaces. Use single surface containers with clear typography hierarchy. |
| **Extreme Pill Addiction** | Everything has `rounded-full` (capsule shapes) regardless of context. | Restrict pills to status badges, tags, or small filter chips. Use disciplined radii (12px, 16px, 24px) for cards. |
| **Conflicting Edges** | A card has an outer border, inner glow, drop shadow, and gradient line all at once. | Pick one clean edge definition: either a subtle border OR a gentle shadow. |

---

## 3. Typography & Micro-Copy

| Problem | Heuristic Check | Meng To / Craft Fix |
| :--- | :--- | :--- |
| **Eyebrow Overdose** | A tracked uppercase pill/label sits atop every single heading on the page. | Eliminate 80% of eyebrows. Let the heading font weight and size declare hierarchy directly. |
| **Measure Too Wide** | Body text spans 1000px+ across large screens. | Constrain reading line length to `max-w-prose` (approx 55–65 characters). |
| **Display Font Everywhere** | An eccentric display or serif typeface used for body copy and data tables. | Use clear, neutral geometric/sans typefaces (Inter, SF Pro, Geist) for data and functional text. Reserve display fonts for H1/H2 headlines. |
| **Vague Adjective Copy** | "Supercharge your seamless next-gen AI workflow effortlessly." | Replace buzzwords with concrete verbs and specific outcomes: "Deploy PostgreSQL replicas in 3 clicks." |

---

## 4. Color, Glow & Material

| Problem | Heuristic Check | Meng To / Craft Fix |
| :--- | :--- | :--- |
| **Gratuitous Violet/Purple Glow** | Random radial purple/cyan gradients floating in the background. | Ground lighting. If using a glow, it must emanate from an actual light source (e.g. behind the focal hero product). |
| **Pure Black Washout** | Dark mode built by putting `#000000` everywhere with white text. | Use tinted deep tones (e.g. `#020617`, `#0B1220`, deep navy/slate) for softer contrast and realistic ambient depth. |
| **Blur Everywhere** | `backdrop-filter: blur(20px)` applied to 50 elements simultaneously causing frame drops. | Reserve blur for floating sticky navbars and modal overlays. Use static alpha fills for nested cards. |

---

## 5. Proof, Logos & Authenticity

| Problem | Heuristic Check | Meng To / Craft Fix |
| :--- | :--- | :--- |
| **Fake Logo Wall** | "Trusted by" section with fictional logos or generic company names. | If real customer proof does not exist, omit the section completely rather than faking credibility. |
| **Illustrated/Faceless Avatars** | Generic 3D Memoji or faceless grey silhouettes representing real testimonials. | Use real photography or remove the avatar entirely. Never manufacture false personnel. |
| **Arbitrary Metric Counters** | "99.9% Faster", "10M+ Happy Users" with no citation or source. | Cite exact benchmark figures or link to real case studies. |

---

## The Heuristic Removal Test (5-Step Elimination)

When evaluating any suspicious UI component or decorative accent:

```text
1. NAME IT PRECISELY:
   Identify the element: "radial purple glow", "eyebrow badge", "nested card border", "floating decorative 3D cube".

2. IDENTIFY ITS JOB:
   What does this element communicate? (Status? Action? Spatial boundary? Brand meaning?)

3. MENTALLY REMOVE IT:
   If you delete this element, does the user lose clarity, meaning, or actionability?
   - If clarity IMPROVES or is unaffected: DELETE IT PERMANENTLY.

4. CHECK REMAINING TENSION:
   Does removing it leave the layout too flat?
   - If yes: Increase typographic contrast or adjust whitespace rhythm before reaching for another decorative asset.

5. NEVER COMPENSATE WITH SLOP:
   Do not replace a deleted decorative shape with a different decorative shape.
```

