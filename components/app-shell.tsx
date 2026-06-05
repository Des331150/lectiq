"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Sheet } from "@/components/ui/sheet";
import { SidebarNav, UserMenu } from "@/components/sidebar";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-border bg-background/95 backdrop-blur px-4 h-14">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold tracking-tight truncate">
          {title ?? "Lectiq"}
        </span>
        <span className="w-10" aria-hidden="true" />
      </header>

      <Sheet open={open} onClose={() => setOpen(false)} side="left" ariaLabel="Main navigation">
        <div className="px-4 py-5 border-b border-border">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="font-bold text-base tracking-tight"
          >
            Lectiq
          </Link>
        </div>
        <SidebarNav
          variant="light"
          className="flex-1 py-2"
          onNavigate={() => setOpen(false)}
        />
        <div className="px-4 py-4 border-t border-border space-y-3">
          <UserMenu email={email} onLogout={handleLogout} />
        </div>
      </Sheet>

      <div className="flex">
        <aside className="hidden md:flex w-52 shrink-0 bg-[#1B2A3B] text-[#F5F2EB] flex-col min-h-screen sticky top-0 self-start max-h-screen">
          <div className="px-4 py-5 border-b border-white/10">
            <Link href="/dashboard" className="font-bold text-base tracking-tight">
              Lectiq
            </Link>
          </div>
          <SidebarNav variant="dark" className="flex-1 py-2 overflow-y-auto" />
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

        <main className="flex-1 min-w-0 flex justify-center">
          <div className="w-full py-6 px-4 sm:px-6 max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
