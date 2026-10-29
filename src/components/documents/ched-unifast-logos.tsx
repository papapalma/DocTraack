import React from "react";

export function ChedLogo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Blue Ring */}
      <circle cx="50" cy="50" r="48" fill="#0A3A82" stroke="#D4AF37" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="2,2" />

      {/* Ring Text Simulation */}
      <path
        id="ched-arc"
        d="M 18 50 A 32 32 0 1 1 82 50"
        fill="none"
      />
      <text fill="#FFFFFF" fontSize="6.5" fontWeight="bold" letterSpacing="0.8">
        <textPath href="#ched-arc" startOffset="50%" textAnchor="middle">
          COMMISSION ON HIGHER EDUCATION
        </textPath>
      </text>

      {/* Inner Red & Blue Field */}
      <circle cx="50" cy="50" r="28" fill="#0B4B9E" stroke="#FFFFFF" strokeWidth="1.5" />

      {/* Sun Rays */}
      <g transform="translate(50,50)">
        {[...Array(8)].map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="-19"
            x2="0"
            y2="-10"
            stroke="#F5B800"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${i * 45})`}
          />
        ))}
        {/* Sun Core */}
        <circle cx="0" cy="0" r="8" fill="#F5B800" stroke="#FFFFFF" strokeWidth="0.8" />
        
        {/* 3 Stars */}
        <polygon points="0,-13 1.5,-9 -1.5,-9" fill="#FFF" />
        <polygon points="-11,7 -8,6 -10,9" fill="#FFF" />
        <polygon points="11,7 8,6 10,9" fill="#FFF" />
      </g>
    </svg>
  );
}

export function UniFastLogo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Orange Ring */}
      <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#E65100" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="42" fill="#E65100" />
      <circle cx="50" cy="50" r="32" fill="#FFFFFF" stroke="#212121" strokeWidth="1" />

      {/* Cogwheel teeth */}
      <g transform="translate(50,50)" stroke="#E65100" strokeWidth="3">
        {[...Array(12)].map((_, i) => (
          <rect
            key={i}
            x="-3"
            y="-46"
            width="6"
            height="6"
            fill="#E65100"
            transform={`rotate(${i * 30})`}
          />
        ))}
      </g>

      {/* UniFAST Text */}
      <text
        x="50"
        y="53"
        fill="#212121"
        fontSize="11"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="sans-serif"
        letterSpacing="0.5"
      >
        UniFAST
      </text>

      {/* Open Book / Torch Motif */}
      <path
        d="M 38 62 Q 50 58 62 62 L 62 68 Q 50 64 38 68 Z"
        fill="#E65100"
      />
      <circle cx="50" cy="38" r="4" fill="#E65100" />
    </svg>
  );
}
