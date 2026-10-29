import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Apple-style base: instant active press response, smooth spring curve, focus ring
    const baseStyles =
      "inline-flex items-center justify-center font-medium select-none cursor-pointer rounded-xl transition-all duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100";

    const variants = {
      primary:
        "bg-[#1B5E20] hover:bg-[#164D1C] text-white shadow-[0_2px_8px_rgba(27,94,32,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_4px_12px_rgba(27,94,32,0.35)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-[#1B5E20]",
      secondary:
        "bg-[#F1F8F1] hover:bg-[#DCEFDD] text-[#123F17] border border-[#D6DDD8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-[#1B5E20]",
      accent:
        "bg-[#F2B705] hover:bg-[#E5AC04] text-[#123F17] font-semibold shadow-[0_2px_8px_rgba(242,183,5,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_4px_14px_rgba(242,183,5,0.45)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-[#F2B705]",
      outline:
        "border border-[#1B5E20] text-[#1B5E20] bg-transparent hover:bg-[#F1F8F1] hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-[#1B5E20]",
      ghost:
        "text-[#1F2A24] bg-transparent hover:bg-black/5 hover:text-[#1B5E20] active:bg-black/10 focus-visible:ring-[#1B5E20]",
      destructive:
        "bg-[#B3261E] hover:bg-[#9C201A] text-white shadow-[0_2px_8px_rgba(179,38,30,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-[#B3261E]",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5 font-semibold",
      icon: "h-10 w-10 p-0 justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
