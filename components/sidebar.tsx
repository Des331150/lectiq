import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function Sidebar() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const email = user.email || "";
  const initial = email.charAt(0).toUpperCase() || "U";

  return (
    <aside className="w-52 shrink-0 bg-[#1B2A3B] text-[#F5F2EB] flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-white/10">
        <Link href="/dashboard" className="font-bold text-base tracking-tight">
          Lectiq
        </Link>
      </div>

      <nav className="flex-1 py-4 space-y-0.5">
        <SidebarLink href="/dashboard" label="Dashboard" />
        <SidebarLink href="/upload" label="Upload" />
        <SidebarLink href="/history" label="History" />
        <SidebarLink href="/billing" label="Billing" />
      </nav>

      <div className="px-4 py-4 border-t border-white/10 space-y-3">
        <p className="text-xs text-white/50 truncate">{email}</p>
        <form action="/auth/logout" method="post">
          <button type="submit" className="text-xs text-white/50 hover:text-white/80 transition-colors">
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}

interface SidebarLinkProps {
  href: string;
  label: string;
}

function SidebarLink({ href, label }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
    >
      {label}
    </Link>
  );
}
