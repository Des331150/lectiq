"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  variant?: "dark" | "light";
  className?: string;
  onNavigate?: () => void;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/history", label: "History" },
] as const;

export function SidebarNav({ variant = "light", className, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={className} aria-label="Main">
      {NAV_ITEMS.map((item) => {
        // /documents and /quizzes live under the dashboard's study loop, so
        // they read as "you are studying" rather than as a dead end.
        const active =
          pathname === item.href ||
          (item.href === "/dashboard" && (pathname?.startsWith("/documents") || pathname?.startsWith("/quizzes")));

        const base =
          variant === "dark"
            ? "block px-4 py-3 text-sm transition-colors"
            : "block px-4 py-3 text-sm transition-colors";

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              base,
              variant === "dark"
                ? active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
                : active
                  ? "bg-muted text-foreground"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

interface UserMenuProps {
  email: string;
  onLogout: () => void;
  className?: string;
  variant?: "light" | "dark";
}

export function UserMenu({ email, onLogout, className, variant = "light" }: UserMenuProps) {
  const textClass =
    variant === "dark" ? "text-white/50 hover:text-white/80" : "text-muted-foreground hover:text-foreground";
  return (
    <div className={className}>
      <p className="text-xs truncate">{email || "Loading..."}</p>
      <button
        onClick={onLogout}
        className={`text-xs transition-colors min-h-[44px] inline-flex items-center ${textClass}`}
      >
        Log out
      </button>
    </div>
  );
}
