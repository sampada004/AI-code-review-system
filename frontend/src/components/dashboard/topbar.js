"use client";

import { LogOut, Sparkles, Plus, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import GitHubIcon from "@/components/common/github-icon";
import UserProfileModal from "./user-profile-modal";
import { apiUrl } from "@/lib/api";

export function DashboardTopbar({
  onToggleSidebar,
  onToggleRepositoryExplorer,
  showWorkspaceControls = false,
}) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_token");
        window.localStorage.removeItem("inspectra.lastRepo");
        window.localStorage.removeItem("codepilot.lastRepo");
        window.sessionStorage.clear();
      }

      // Best-effort backend call with 1.8s timeout so user is never blocked
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);

      await fetch(apiUrl("/auth/logout"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        signal: controller.signal,
      }).catch(() => {});

      clearTimeout(timeoutId);
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      } else {
        router.replace("/login");
      }
    }
  };

  const githubAccount = userProfile?.github_account || (userProfile?.github_username ? {
    username: userProfile.github_username,
    avatar_url: userProfile.avatar_url,
  } : null);

  const displayName = userProfile?.full_name || userProfile?.name || githubAccount?.username || userProfile?.email?.split("@")[0] || "User";
  const avatarUrl = githubAccount?.avatar_url || userProfile?.avatar_url;

  return (
    <>
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

          {/* Right: Actions, Profile & Logout */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/add-repository"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5 text-sky-400" />
              <span>Add Repo</span>
            </Link>

            {/* Profile Button / Chip */}
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="group flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] font-medium text-slate-200 transition hover:bg-white/10 hover:border-white/20"
              title="View Profile & Integrated GitHub Account"
            >
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-6 w-6 rounded-full border border-sky-400/30 object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-sky-400/30 bg-sky-950 text-sky-300">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
                {githubAccount && (
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#161b22] border border-white/20 text-white shadow-xs">
                    <GitHubIcon className="h-1.5 w-1.5" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 max-w-[150px] truncate text-left">
                <span className="truncate text-slate-200 group-hover:text-white">{displayName}</span>
                {githubAccount ? (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded bg-sky-500/15 border border-sky-500/25 px-1.5 py-0.2 text-[10px] font-mono text-sky-300">
                    <GitHubIcon className="h-2.5 w-2.5" />
                    @{githubAccount.username}
                  </span>
                ) : null}
              </div>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-slate-300 transition hover:bg-rose-500/15 hover:text-rose-300 hover:border-rose-500/30 disabled:opacity-60"
              title="Sign Out & Remove Account from Inspectra"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{isLoggingOut ? "..." : "Logout"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onProfileUpdate={(updated) => setUserProfile(updated)}
      />
    </>
  );
}



