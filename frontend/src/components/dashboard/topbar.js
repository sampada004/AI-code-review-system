"use client";

import { LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiUrl } from "@/lib/api";

export function DashboardTopbar({
  onToggleSidebar,
  onToggleRepositoryExplorer,
  showWorkspaceControls = false,
}) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await fetch(apiUrl("/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } finally {
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("auth_token");
        }
      } catch (e) {
        // ignore storage errors
      }

      router.replace("/login");
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d1117]/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center flex-1 max-w-sm">
          <div className="relative w-full">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              aria-label="Search repositories"
              placeholder="Search..."
              className="h-8.5 w-full rounded-lg border border-white/10 bg-[#161b22] pl-9 pr-3 text-[13px] text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#161b22] px-3 py-1.5 text-[12px] font-medium text-slate-300 transition hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 disabled:opacity-60"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}


