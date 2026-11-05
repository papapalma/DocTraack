"use client";

import React, { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

interface AnimatedNumberProps {
  value: string | number;
  className?: string;
  duration?: number; // milliseconds, default 700ms
}

export function AnimatedNumber({
  value,
  className = "",
  duration = 750,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const prefersReduced = useReducedMotion();

  // Parse raw value into prefix, target number, suffix, and decimal places
  const stringVal = String(value);
  const match = stringVal.match(/^([^0-9.]*)([0-9,.]+)(.*)$/);

  let prefix = "";
  let suffix = "";
  let targetNumber = 0;
  let hasDecimals = false;
  let decimalPlaces = 0;

  if (match) {
    prefix = match[1] || "";
    const numPart = match[2].replace(/,/g, "");
    targetNumber = parseFloat(numPart) || 0;
    suffix = match[3] || "";

    if (numPart.includes(".")) {
      hasDecimals = true;
      decimalPlaces = numPart.split(".")[1]?.length || 2;
    }
  } else {
    // If not a parseable number, fallback to displaying string
    return <span className={className}>{value}</span>;
  }

  const [currentDisplay, setCurrentDisplay] = useState(
    prefersReduced ? stringVal : `${prefix}0${suffix}`
  );

  useEffect(() => {
    if (prefersReduced || !isInView) {
      if (prefersReduced) setCurrentDisplay(stringVal);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Apple fluid easeOutExpo curve for smooth settle
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentNum = targetNumber * easeProgress;

      let formattedNum = "";
      if (hasDecimals) {
        formattedNum = currentNum.toLocaleString("en-US", {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        });
      } else {
        formattedNum = Math.floor(currentNum).toLocaleString("en-US");
      }

      setCurrentDisplay(`${prefix}${formattedNum}${suffix}`);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCurrentDisplay(stringVal);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, prefersReduced, stringVal, targetNumber, prefix, suffix, hasDecimals, decimalPlaces, duration]);

  return (
    <span ref={ref} className={`tabular-nums font-mono ${className}`}>
      {currentDisplay}
    </span>
  );
}

