"use client";

import React, { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Download, Check, Loader2 } from "lucide-react";
import { useDownload } from "@/components/providers/download-provider";
import { cn } from "@/lib/utils";

export interface DownloadButtonProps extends Omit<ButtonProps, "onClick"> {
  url?: string;
  filename?: string;
  fallbackName?: string;
  onDownload?: () => Promise<void> | void;
  icon?: React.ReactNode;
  successDuration?: number;
}

export function DownloadButton({
  url,
  filename,
  fallbackName,
  onDownload,
  icon,
  children,
  className,
  disabled,
  successDuration = 2000,
  ...props
}: DownloadButtonProps) {
  const { downloadFile } = useDownload();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || disabled) return;
    setIsLoading(true);
    setIsSuccess(false);

    try {
      if (onDownload) {
        await onDownload();
        setIsSuccess(true);
      } else if (url) {
        const success = await downloadFile({
          url,
          filename,
          fallbackName,
          triggerElement: e.currentTarget,
        });
        if (success) {
          setIsSuccess(true);
        }
      }

      if (isSuccess || true) {
        setTimeout(() => {
          setIsSuccess(false);
        }, successDuration);
      }
    } catch (err) {
      console.error("DownloadButton error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultIcon = icon || <Download className="w-4 h-4 mr-1.5" />;

  return (
    <Button
      {...props}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={cn(
        "apple-press transition-all duration-200",
        isSuccess && "bg-[#1B5E20] text-white border-[#1B5E20]",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-current" />
      ) : isSuccess ? (
        <Check className="w-4 h-4 mr-1.5 text-current animate-in zoom-in-75 duration-150" />
      ) : (
        defaultIcon
      )}
      {children}
    </Button>
  );
}

