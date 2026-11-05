# Creative Frontend Patterns & Code Recipes

This reference provides implementation patterns used across Meng To's web design systems, optimized for modern React, Next.js, Tailwind CSS, and vanilla web stacks.

---

## 1. Dark Glass Panel with Masked Gradient Border

Combines frosted backdrop blur with an ultra-crisp gradient border created via CSS masking (`mask-composite: exclude`):

```css
/* Custom CSS */
.glass-card {
  position: relative;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%);
  background-color: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border-radius: 20px;
  box-shadow: 
    0 24px 48px -12px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.glass-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(56, 189, 248, 0.35) 40%,
    rgba(147, 51, 234, 0.2) 75%,
    rgba(255, 255, 255, 0.05) 100%
  );
  pointer-events: none;
}
```

### Tailwind Equivalent

```html
<div class="relative rounded-2xl bg-slate-900/50 p-8 backdrop-blur-xl shadow-2xl shadow-black/40 border border-white/10 before:absolute before:inset-0 before:rounded-2xl before:p-px before:bg-gradient-to-br before:from-white/20 before:via-sky-400/20 before:to-transparent before:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[mask-composite:exclude] before:pointer-events-none">
  <h3 class="text-xl font-semibold text-slate-100">Frosted Glass Surface</h3>
  <p class="mt-2 text-sm text-slate-400 leading-relaxed">Multi-layer lighting with crisp masked gradient rim.</p>
</div>
```

---

## 2. GSAP ScrollTrigger + Lenis Smooth Scroll Lifecycle

When building cinematic scroll storytelling, initialize **only one** smooth scroll engine (Lenis) and bind it cleanly to GSAP ScrollTrigger. Always handle cleanup to prevent memory leaks during page navigation:

```typescript
// hooks/useLenisScrollTrigger.ts
import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function useLenisScrollTrigger() {
  useEffect(() => {
    // Respect reduced-motion preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    // Synchronize Lenis scroll updates with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);
}
```

### Word-by-Word Stagger Reveal

```typescript
// Reusable GSAP staggered heading reveal
export function animateHeadingReveal(element: HTMLElement) {
  const words = element.querySelectorAll(".word");
  gsap.fromTo(
    words,
    { y: "100%", opacity: 0 },
    {
      y: "0%",
      opacity: 1,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.04,
      scrollTrigger: {
        trigger: element,
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    }
  );
}
```

---

## 3. Three.js Canvas: Safe Lifecycle & Performance Caps

Never instantiate Three.js canvases without strict performance and lifecycle boundaries:

```typescript
// components/SafeThreeCanvas.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";

export function SafeThreeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    // Cap pixel ratio to 2 to prevent GPU thermal throttling on 4K/Retina displays
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(1.8, 4);
    const material = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(2, 4, 3);
    scene.add(light);

    let isVisible = true;
    let animationFrameId: number;

    // Pause rendering when scrolled out of view to save CPU/battery
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) render();
    }, { threshold: 0.1 });

    observer.observe(container);

    const render = () => {
      if (!isVisible) return;
      mesh.rotation.x += 0.003;
      mesh.rotation.y += 0.005;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Comprehensive Resource Disposal
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="relative w-full h-[450px]" />;
}
```

---

## 4. Progressive Blur (Scrim Gradient)

Creates a smooth visual fade out using multiple blur layers rather than an abrupt linear gradient:

```css
.progressive-blur {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  pointer-events: none;
  background: linear-gradient(to top, rgba(2, 6, 23, 1) 0%, rgba(2, 6, 23, 0) 100%);
  mask-image: linear-gradient(to top, black 20%, transparent 100%);
  -webkit-mask-image: linear-gradient(to top, black 20%, transparent 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

---

## 5. Subtle Interactive Pointer Trail

A low-overhead canvas particle trail that follows cursor movement:

```typescript
export function initPointerTrail(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let points: { x: number; y: number; age: number; maxAge: number }[] = [];
  let animId: number;

  const handlePointerMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    points.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      age: 0,
      maxAge: 30,
    });
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points = points.filter((p) => p.age < p.maxAge);

    for (const p of points) {
      p.age++;
      const opacity = 1 - p.age / p.maxAge;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (1 - p.age / p.maxAge) * 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${opacity * 0.35})`;
      ctx.fill();
    }
    animId = requestAnimationFrame(draw);
  };

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  draw();

  return () => {
    window.removeEventListener("pointermove", handlePointerMove);
    cancelAnimationFrame(animId);
  };
}
```

