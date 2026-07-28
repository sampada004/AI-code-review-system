"use client";

import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiUrl } from "@/lib/api";
import {
  BellIcon,
  HelpIcon,
  KbdIcon,
  SearchIcon,
  UserIcon,
} from "./dashboard-icons";

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
    <header className="sticky top-0 z-20 border-b border-white/8 bg-[#141821]/95 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center flex-1 max-w-2xl">
          <div className="relative flex min-w-0 flex-1 items-center">
            <div className="pointer-events-none absolute left-3 text-slate-500">
              <SearchIcon className="h-4 w-4" />
            </div>
            <input
              type="text"
              aria-label="Search repositories or scans"
              placeholder="Search repositories or scans..."
              className="h-10 w-full rounded-[4px] border border-white/12 bg-[#0d1016] pl-10 pr-24 text-[13px] text-slate-200 placeholder:text-slate-500 shadow-[0_1px_0_rgba(255,255,255,0.03)] outline-none transition focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/10"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              <span className="grid h-7 w-7 place-items-center rounded border border-white/10 bg-white/5 text-slate-400">
                <KbdIcon className="h-3.5 w-3.5" />
              </span>
              <span className="grid h-7 min-w-7 place-items-center rounded border border-white/10 bg-white/5 px-2 text-[11px] font-medium text-slate-300">
                K
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-[6px] border border-white/10 bg-[#161b22] px-4 py-1.5 text-[13px] font-medium text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}
