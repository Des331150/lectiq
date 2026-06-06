"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function Sidebar() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="w-52 shrink-0 bg-[#1B2A3B] text-[#F5F2EB] hidden md:flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-white/10">
        <Link href="/dashboard" className="font-bold text-base tracking-tight">
          Lectiq
        </Link>
      </div>

      <SidebarNav variant="dark" className="flex-1 py-4" />

      <div className="px-4 py-4 border-t border-white/10 space-y-3">
        <p className="text-xs text-white/50 truncate">{email || "Loading..."}</p>
        <button
          onClick={handleLogout}
          className="text-xs text-white/50 hover:text-white/80 transition-colors min-h-[44px] inline-flex items-center"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}

interface SidebarNavProps {
  variant?: "dark" | "light";
  className?: string;
  onNavigate?: () => void;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/history", label: "History" },
  { href: "/billing", label: "Billing" },
] as const;

export function SidebarNav({ variant = "light", className, onNavigate }: SidebarNavProps) {
  const base =
    variant === "dark"
      ? "block px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
      : "block px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-muted transition-colors";

  return (
    <nav className={className}>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={base}
        >
          {item.label}
        </Link>
      ))}
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
