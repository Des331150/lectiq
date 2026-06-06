"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "left" | "right";
  className?: string;
  ariaLabel?: string;
  tone?: "light" | "dark";
}

export function Sheet({
  open,
  onClose,
  children,
  side = "left",
  className,
  ariaLabel = "Navigation menu",
  tone = "light",
}: SheetProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const isLeft = side === "left";
  const isDark = tone === "dark";

  return (
    <div
      className="fixed inset-0 z-50 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 transition-opacity"
      />
      <div
        className={cn(
          "absolute top-0 bottom-0 w-72 max-w-[85vw] shadow-xl flex flex-col",
          isDark
            ? "bg-[#1B2A3B] text-[#F5F2EB]"
            : "bg-background text-foreground",
          isLeft ? "left-0" : "right-0",
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className={cn(
            "absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors",
            isDark
              ? "text-white/70 hover:bg-white/10 hover:text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
