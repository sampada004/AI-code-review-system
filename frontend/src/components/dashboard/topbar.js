"use client";

import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
      await fetch(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/login");
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-[#141821]/95 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-3 lg:px-8">
        <div className="flex items-center gap-2">
          {showWorkspaceControls ? (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
              className="grid h-10 w-10 place-items-center rounded-[4px] border border-white/10 bg-[#0d1016] text-slate-200 transition hover:bg-white/5"
            >
              <Menu className="h-4 w-4" />
            </button>
          ) : null}

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

        <div className="flex items-center gap-2">
          {showWorkspaceControls ? (
            <button
              type="button"
              onClick={onToggleRepositoryExplorer}
              className="rounded-[6px] border border-white/10 bg-white/0 px-3 py-2 text-[12px] font-medium text-slate-200 transition hover:bg-white/5"
            >
              Repository Explorer
            </button>
          ) : null}

          <div className="flex items-center justify-between gap-2 sm:justify-start sm:gap-3">
            <div className="flex items-center gap-2 rounded-[6px] border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[12px] text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
              <span>System Live</span>
            </div>
            <button
              type="button"
              aria-label="Notifications"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/0 text-slate-200 transition hover:bg-white/5"
            >
              <BellIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Help"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/0 text-slate-200 transition hover:bg-white/5"
            >
              <HelpIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Profile"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/0 text-slate-200 transition hover:bg-white/5"
            >
              <UserIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-[6px] border border-white/10 bg-white/0 px-3 py-1.5 text-[12px] font-medium text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
