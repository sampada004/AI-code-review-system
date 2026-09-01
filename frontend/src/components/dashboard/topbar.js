"use client";

import { LogOut, Sparkles, Plus, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";

export function DashboardTopbar({
  onToggleSidebar,
  onToggleRepositoryExplorer,
  showWorkspaceControls = false,
}) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("auth_token");
    fetch(apiUrl("/auth/me"), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include"
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.user) setUserProfile(data.user);
      })
      .catch(() => {});
  }, []);

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
      } catch (e) {}

      router.replace("/login");
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c1017]/90 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-300">
            <Sparkles className="h-3 w-3 text-sky-400 animate-pulse" />
            <span>AI Review Engine</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-semibold">Active</span>
          </div>
        </div>

        {/* Right: Actions & Logout */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/add-repository"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5 text-sky-400" />
            <span>Add Repo</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-slate-300 transition hover:bg-rose-500/15 hover:text-rose-300 hover:border-rose-500/30 disabled:opacity-60"
            title="Log out of Inspectra AI"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{isLoggingOut ? "..." : "Logout"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}


