"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { LandingStyleSettings, DEFAULT_STYLE_SETTINGS } from "@/types/landing";

// Context for global motion settings
export const MotionContext = createContext<LandingStyleSettings>(DEFAULT_STYLE_SETTINGS);

export function useLandingStyle() {
  return useContext(MotionContext);
}

interface MotionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

// 1. Apple-Grade Scroll Reveal (Fade & Slide with Spring Settling)
export function ScrollReveal({ children, className = "", delay = 0 }: MotionProps) {
  const { motionLevel } = useLandingStyle();
  const prefersReduced = useReducedMotion();
  const shouldAnimate = motionLevel !== "off" && !prefersReduced;

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  const isSubtle = motionLevel === "subtle";

  return (
    <motion.div
      initial={{ opacity: 0, y: isSubtle ? 10 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        type: "spring",
        stiffness: isSubtle ? 200 : 260,
        damping: isSubtle ? 28 : 22,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 2. Staggered Container for Grids and Lists (40-60ms stagger)
export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.06,
}: MotionProps & { staggerDelay?: number }) {
  const { motionLevel } = useLandingStyle();
  const prefersReduced = useReducedMotion();
  const shouldAnimate = motionLevel !== "off" && !prefersReduced;

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.05,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger Item Child
export function StaggerItem({ children, className = "" }: MotionProps) {
  const { motionLevel } = useLandingStyle();
  const prefersReduced = useReducedMotion();
  const shouldAnimate = motionLevel !== "off" && !prefersReduced;

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18, scale: 0.98 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 280,
            damping: 24,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 3. Apple Tactile Press Button Wrapper (Scale 0.97 on press)
export function ApplePressable({
  children,
  className = "",
  onClick,
}: MotionProps & { onClick?: () => void }) {
  const { motionLevel } = useLandingStyle();
  const prefersReduced = useReducedMotion();
  const shouldAnimate = motionLevel !== "off" && !prefersReduced;

  if (!shouldAnimate) {
    return (
      <div onClick={onClick} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 4. Apple 3D Perspective Tilt Card
export function AppleTiltCard({
  children,
  className = "",
  maxTilt = 7,
}: MotionProps & { maxTilt?: number }) {
  const { motionLevel } = useLandingStyle();
  const prefersReduced = useReducedMotion();
  const shouldAnimate = motionLevel === "fluid" && !prefersReduced;

  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-maxTilt, maxTilt]);

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  );
}

// 5. Animated Metric Counter (Counts up smoothly when scrolled into view)
export function AnimatedCounter({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [displayValue, setDisplayValue] = useState<string>("0");

  useEffect(() => {
    if (!inView) return;

    // Check if value is numeric or has symbols like "< 24h", "10", "100%"
    const match = value.match(/(\d+)/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const targetNum = parseInt(match[0], 10);
    const prefix = value.slice(0, match.index);
    const suffix = value.slice((match.index || 0) + match[0].length);

    let current = 0;
    const duration = 1200; // ms
    const startTime = performance.now();

    const updateCount = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // Apple easeOutQuad curve
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      current = Math.floor(easeProgress * targetNum);

      setDisplayValue(`${prefix}${current}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(updateCount);
  }, [inView, value]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
}

export { AnimatePresence, motion };

