"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

interface SelectProps<T extends string = string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SelectOption<T>[];
  /** Accessible name for the control. */
  label: string;
  /** Visible helper text. Set it to null to hide. */
  hint?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * A native select element styled to match the design system.
 *
 * This replaces a hand-rolled listbox built from divs, which was broken in ways
 * that mattered:
 *
 * - The trigger rendered `{children || value || placeholder}`, and the caller
 *   passed no children, so the closed control displayed the raw stored value.
 *   A user picking a quiz format saw "mcq" while the open options read
 *   "Multiple Choice".
 * - It had no role, no aria-expanded, and no key handling. Arrow keys, Enter,
 *   Escape and type-ahead did nothing, so the control was unusable without a
 *   mouse — the same class of defect just fixed on the quiz-taking screen.
 * - Options were clickable divs, so they were not reachable by keyboard at all.
 * - The popover was absolutely positioned inside the flow with no clipping
 *   strategy, and focus was never moved into or restored from the list.
 *
 * A native <select> gets all of that from the platform: correct roles, keyboard
 * handling, mobile pickers, and the right announcement on every screen reader.
 * The only thing it needed was the chevron and the palette.
 */
export function Select<T extends string = string>({
  value,
  onValueChange,
  options,
  label,
  hint,
  className,
  disabled,
}: SelectProps<T>) {
  const selected = options.find((option) => option.value === value);
  const id = React.useId();
  const hintId = `${id}-hint`;

  return (
    <div className={cn("w-full", className)}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onValueChange(event.target.value as T)}
          aria-describedby={hint ? hintId : undefined}
          className="h-11 w-full cursor-pointer appearance-none rounded-md border border-input bg-background py-2 pl-3 pr-10 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      {hint && (
        <p id={hintId} className="mt-1.5 text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {selected?.description && !hint && (
        <p className="mt-1.5 text-sm text-muted-foreground">{selected.description}</p>
      )}
    </div>
  );
}