"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GridIcon,
  HistoryIcon,
  LogoMark,
  ReviewIcon,
} from "./dashboard-icons";
import { FolderPlus, User, LogOut } from "lucide-react";
import { sidebarNav } from "./dashboard-data";
import { apiUrl } from "@/lib/api";

const iconMap = {
  grid: GridIcon,
  review: ReviewIcon,
  history: HistoryIcon,
  add: FolderPlus,
};

export function DashboardSidebar({
  activeItem = "Dashboard",
  collapsed = false,
  workspaceMode = false,
  mobileOpen = false,
  onToggleExplorer,
}) {
  const [reviewsHref, setReviewsHref] = useState("/reviews");
  const [userProfile, setUserProfile] = useState(null);

  const handleLogout = async (e) => {
    e?.preventDefault?.();
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_token");
        window.sessionStorage.clear();
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      await fetch(apiUrl("/auth/logout"), {
        method: "POST",
        credentials: "include",
        signal: controller.signal,
      }).catch(() => {});
      clearTimeout(timeoutId);
    } catch (err) {}
    finally {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem("inspectra.lastRepo") || window.localStorage.getItem("codepilot.lastRepo");
      if (stored) {
        const repo = JSON.parse(stored);
        if (repo.id) {
          setReviewsHref(`/reviews?repoId=${repo.id}&name=${encodeURIComponent(repo.name || "")}&url=${encodeURIComponent(repo.url || "")}&branch=${encodeURIComponent(repo.branch || "main")}`);
        }
      }
    } catch (e) {}

    // Fetch live user session
    const token = window.localStorage.getItem("auth_token");
    fetch(apiUrl("/auth/me"), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include"
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.user) {
          setUserProfile(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const displayName = userProfile?.name || userProfile?.github_username || userProfile?.email?.split("@")[0] || "Developer";
  const displayRole = userProfile?.github_username ? `@${userProfile.github_username}` : "Code Reviewer";
  const avatarUrl = userProfile?.avatar_url;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 border-r border-white/10 bg-[#0b0f17] text-slate-200 transition-all duration-300 ease-out ${
        !collapsed || mobileOpen ? "translate-x-0 w-[240px]" : "translate-x-0 w-[70px]"
      } hidden lg:flex flex-col`}
      style={{ width: collapsed && !mobileOpen ? "70px" : "240px" }}
      data-mobile-open={mobileOpen ? "true" : "false"}
    >
      <div className="flex h-full flex-col">
        {/* Brand Header */}
        <div className="border-b border-white/10 px-4 py-4">
          <Link href="/dashboard" className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <LogoMark />
            {!collapsed ? (
              <div className="min-w-0">
                <div className="text-[16px] font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>Inspectra</span>
                  <span className="rounded bg-sky-500/20 text-sky-400 px-1.5 py-0.2 text-[10px] font-semibold">AI</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">Autonomous Code Review</div>
              </div>
            ) : null}
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarNav.map((item) => {
            const Icon = iconMap[item.icon] || GridIcon;
            const isActive = item.label === activeItem;
            const href = workspaceMode && item.label === "Reviews" ? "#" : (item.label === "Reviews" ? reviewsHref : item.href);
            
            return (
              <Link
                key={item.label}
                href={href}
                onClick={workspaceMode && item.label === "Reviews" && onToggleExplorer ? (e) => { e.preventDefault(); onToggleExplorer(); } : undefined}
                className={`flex items-center rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-sky-500/15 text-sky-300 border border-sky-500/25 shadow-sm"
                    : "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className={`flex items-center ${collapsed ? "w-full justify-center" : "gap-3"}`}>
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                  {!collapsed ? <span>{item.label}</span> : null}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Card */}
        <div className="border-t border-white/10 p-3">
          <div className={`flex items-center rounded-xl bg-white/[0.03] border border-white/5 p-2.5 ${collapsed ? "justify-center" : "gap-3"}`}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-8 w-8 rounded-full border border-sky-400/30 object-cover shrink-0"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-400/30 bg-sky-950 text-sky-300">
                <User className="h-4 w-4" />
              </div>
            )}
            {!collapsed ? (
              <>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-slate-200">{displayName}</div>
                  <div className="truncate text-[11px] text-slate-500 font-mono">{displayRole}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Logout"
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
