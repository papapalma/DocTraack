"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  src?: string;
  alt?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-sm",
  md: "w-9 h-9 sm:w-10 sm:h-10 text-base sm:text-lg",
  lg: "w-11 h-11 sm:w-12 sm:h-12 text-lg sm:text-xl",
  xl: "w-14 h-14 text-2xl",
};

const dimensionMap = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
};

export function Logo({
  className,
  size = "md",
  src = "/logo.png",
  alt = "MinSU Logo",
}: LogoProps) {
  const [hasError, setHasError] = useState(false);

  if (!hasError && src) {
    return (
      <div
        className={cn(
          "relative rounded-full overflow-hidden shrink-0 border-2 border-white/90 shadow-sm bg-white flex items-center justify-center",
          sizeClasses[size],
          className
        )}
      >
        <Image
          src={src}
          alt={alt}
          width={dimensionMap[size]}
          height={dimensionMap[size]}
          className="object-contain w-full h-full p-0.5"
          onError={() => setHasError(true)}
          priority
        />
      </div>
    );
  }

  // Graceful fallback to MinSU green-and-gold crest badge
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-[#F9C733] to-[#F2B705] flex items-center justify-center text-[#123F17] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.15)] border-2 border-white/90 shrink-0 select-none",
        sizeClasses[size],
        className
      )}
    >
      <span>M</span>
    </div>
  );
}
