# Superprompt Template: Video & Interaction Recreation

Use this template to generate builder-ready superprompts from reference videos, web animations, or existing interactive pages. Delete sections that do not apply, but preserve specific numbers (durations, delays, paddings, hex tokens, easing curves) over generic adjectives.

---

```text
Build [exact thing: e.g., an Awwwards-style landing page / dark glass hero / interactive 3D product showcase] based on the supplied reference [video / URL / component]. Treat the reference as [exact recreation / visual and motion inspiration]. The final implementation must feel [e.g., premium, responsive, cinematic, tactile], adhering to the design specifications below.

ASSET MAP
- Reference Source: [file path, video URL, or screenshot folder]
- Hero / Focal Media: [URLs or local assets, transparent PNGs, or 3D models]
- Background Layers: [Textures, subtle noise, or video loops]
- Audio / Sound Effects: [If applicable, e.g., click/hover audio]
- Icons: [Solar Icons via Iconify / Lucide React / SVG paths]
- Avatars & Proof: [Authentic photography avatars, no illustrated placeholder heads]

BRAND AND CONTENT
- Product / Brand Name: [Brand Name]
- Core Value Proposition (H1): "[Exact primary headline]"
- Supporting Subtitle: "[1-2 sentence value statement]"
- Primary CTA: "[Button text, e.g. 'Start Free Trial' or 'Book a Demo']"
- Secondary Action: "[Link or button text, e.g. 'View Interactive Demo']"
- Social Proof / Eyebrow: "[Authentic metric or customer claim, never fake logo walls]"
- Navigation Bar: [Logo, 3-5 clear links, CTA button, glass backdrop blur]
- Footer: [Directory links, copyright, theme switcher, status indicator]

GLOBAL DESIGN SYSTEM
- Visual Direction: [Dark Glass / Clean Paper Editorial / Technical Wireframe / Brutalist Tech]
- Typography Hierarchy:
  * Primary Headings (H1-H2): [Font family, weight e.g. 700, letter-spacing -0.02em, tight line-height]
  * Body Copy: [Font family, weight 400, leading 1.6, readable line length max 65ch]
  * Mono / Micro Labels: [Font family, uppercase, tracking +0.05em, text-xs]
- Color Palette:
  * Canvas / Background: [e.g. #020617 (slate-950) or #0B1220]
  * Surface / Cards: [e.g. rgba(15, 23, 42, 0.5) with backdrop-blur-xl]
  * Borders / Dividers: [e.g. rgba(255, 255, 255, 0.08) or masked gradient]
  * Primary Ink: [e.g. #F8FAFC (high contrast)]
  * Muted Ink: [e.g. #94A3B8]
  * Single Accent Color: [e.g. Electric Blue #38BDF8 / Emerald #10B981 / Gold #F59E0B]
- Shape Language: [e.g. rounded-2xl (16px) or rounded-3xl (24px) for cards, rounded-full for pills]
- Surface Materials: [Frosted glass with backdrop-filter: blur(18px), inset 0 1px 0 rgba(255,255,255,0.12)]
- Explicit Anti-Patterns:
  * NO generic purple AI glow blobs without purpose
  * NO ornamental bento grids holding empty decorative cards
  * NO fake logo walls or fabricated customer quotes
  * NO multiple competing animations playing at once

MOTION SYSTEM
- Motion Philosophy: Purposeful, spatial, velocity-aware, interruptible
- Timing & Curves:
  * Enter Transitions: ease-out (e.g. cubic-bezier(0.16, 1, 0.3, 1)), 200-300ms
  * Interactive Hover / Scale: 150ms ease-out
  * Press Feedback: transform: scale(0.97) on active
- Scroll Mechanics:
  * Smooth Scroll: Single engine (Lenis), connected to GSAP ScrollTrigger
  * Pinned Sections: Pin viewport for scrubbed timeline beats
  * Parallax: Subtle depth layers, max 10-15% translation delta
- Text Reveals: Word-by-word stagger (0.04s delay per word) with accessible aria-hidden splits
- Reduced Motion: Immediate render of final states under (prefers-reduced-motion: reduce)

SECTION 1: HERO VIEWPORT
- Purpose: Deliver the core value proposition and focal interaction within 3 seconds
- Layout: Full viewport height (min-h-screen), centered or 2-column split (copy left, interactive right)
- Visual Details: Frosted navigation floating at top, high-contrast headline, subtle background canvas
- Animation: GSAP timeline: Nav fades in -> Headline staggered reveal -> CTA pop-in -> Interactive scene activates
- Interaction: Pointer hover moves background light or 3D tilt; CTA active scale state
- Fallback: Complete static view if JavaScript or WebGL is unavailable

SECTION 2: PRODUCT PROOF & CAPABILITIES
- Purpose: Show real interface workflows and tangible features
- Layout: 3-column asymmetric or horizontal feature track
- Visual Details: Cards with masked gradient borders and dark alpha fills
- Scroll Behavior: Scrubbed entrance as section enters 20% viewport threshold

SECTION 3: INTERACTIVE DEMO / 3D SCENE
- Purpose: Tangible product demonstration
- Technology: [Three.js / Shader Canvas / GSAP scrubbed canvas / Interactive DOM]
- Canvas Constraints: Cap devicePixelRatio at 2, pause rendering offscreen, dispose geometries on unmount
- Mobile Behavior: Static fallback illustration on touch devices

SECTION 4: FINAL CTA & CONVERSION
- Purpose: Clean, low-friction conversion point
- Layout: Focused card container with strong focal hierarchy
- Visual Details: Subtle accent rim light, prominent single action button

RESPONSIVE & MOBILE RULES
- Desktop: Full multi-column layout, pointer hover states, full WebGL effects
- Tablet: 2-column reorganization, touch-optimized hit targets (min 44x44px)
- Mobile: Single column logical stack, simplified canvas rendering, persistent visible CTA

PERFORMANCE & COMPLIANCE
- Production Build: Zero TypeScript errors, zero lint warnings
- Bundle Optimization: Dynamic import for heavy WebGL/GSAP modules
- Accessibility: Valid keyboard focus rings, semantic HTML5 tags, full color contrast compliance (WCAG AA)
```

