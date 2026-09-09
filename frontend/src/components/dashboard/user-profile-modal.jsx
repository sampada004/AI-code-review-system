"use client";

import React, { useState } from "react";
import { 
  X, 
  LogOut, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  User, 
  Unlink, 
  CheckCircle2, 
  Loader2,
  Sparkles
} from "lucide-react";
import GitHubIcon from "@/components/common/github-icon";
import { apiUrl, getGitHubLoginUrl } from "@/lib/api";

export default function UserProfileModal({ isOpen, onClose, userProfile, onProfileUpdate }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [actionError, setActionError] = useState("");

  if (!isOpen) return null;

  const githubAccount = userProfile?.github_account || (userProfile?.github_username ? {
    username: userProfile.github_username,
    avatar_url: userProfile.avatar_url,
    github_id: userProfile.github_id
  } : null);

  const displayName = userProfile?.full_name || userProfile?.name || githubAccount?.username || "Developer";
  const displayEmail = userProfile?.email || "No email provided";
  const avatarUrl = githubAccount?.avatar_url || userProfile?.avatar_url;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setActionError("");

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_token");
        window.localStorage.removeItem("inspectra.lastRepo");
        window.localStorage.removeItem("codepilot.lastRepo");
        window.sessionStorage.clear();
      }

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
      console.error("Sign out error:", e);
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  const handleDisconnectGithub = async () => {
    if (isDisconnecting) return;
    setIsDisconnecting(true);
    setActionError("");

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
      const res = await fetch(apiUrl("/auth/github/disconnect"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to disconnect GitHub account");
      }

      if (onProfileUpdate) {
        onProfileUpdate({
          ...userProfile,
          github_account: null,
          github_username: null,
          avatar_url: null,
        });
      }
    } catch (err) {
      setActionError(err.message || "Failed to disconnect GitHub");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d121d] p-6 shadow-2xl backdrop-blur-2xl transition-all animate-in zoom-in-95 duration-200 text-slate-100">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          title="Close profile"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header / Identity */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-5">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-14 w-14 rounded-full border-2 border-sky-400/40 object-cover shadow-lg shadow-sky-500/10"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-sky-400/30 bg-sky-950 text-sky-300 shadow-inner">
                <User className="h-7 w-7" />
              </div>
            )}
            {githubAccount && (
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#161b22] border border-white/20 text-white shadow">
                <GitHubIcon className="h-3 w-3" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold tracking-tight text-white truncate">{displayName}</h2>
            <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-300 border border-sky-500/20">
                <Sparkles className="h-2.5 w-2.5" />
                Inspectra AI User
              </span>
            </div>
          </div>
        </div>

        {/* GitHub Integration Section */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <GitHubIcon className="h-3.5 w-3.5 text-slate-300" />
              <span>GitHub Integration</span>
            </h3>
            {githubAccount ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Integrated
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Not Integrated
              </span>
            )}
          </div>

          {githubAccount ? (
            <div className="rounded-xl border border-white/10 bg-[#080c14] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {githubAccount.avatar_url ? (
                    <img 
                      src={githubAccount.avatar_url} 
                      alt={githubAccount.username} 
                      className="h-9 w-9 rounded-lg border border-white/10 object-cover" 
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-800 text-slate-300">
                      <GitHubIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">@{githubAccount.username}</span>
                      <a
                        href={`https://github.com/${githubAccount.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-sky-400 transition"
                        title="View GitHub profile"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Integrated GitHub Account
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnectGithub}
                  disabled={isDisconnecting}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-rose-500/15 hover:text-rose-300 hover:border-rose-500/30 transition disabled:opacity-50"
                  title="Disconnect only GitHub"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Unlink className="h-3 w-3" />
                  )}
                  <span>Disconnect</span>
                </button>
              </div>

              <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-2.5 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  Connected for automated code reviews, PR creation, and repository syncing. 
                  <strong> Signing out will remove and disconnect this GitHub account from Inspectra.</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-center space-y-3">
              <p className="text-xs text-slate-400">
                No GitHub account is currently integrated with Inspectra.
              </p>
              <button
                type="button"
                onClick={() => {
                  window.location.href = getGitHubLoginUrl();
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-sky-400/40 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-sky-500/20 hover:brightness-110 transition"
              >
                <GitHubIcon className="h-3.5 w-3.5" />
                <span>Connect GitHub Account</span>
              </button>
            </div>
          )}

          {actionError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-200 transition disabled:opacity-50"
            title="Sign out and remove account"
          >
            {isLoggingOut ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            <span>{isLoggingOut ? "Signing Out..." : "Sign Out & Remove Account"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
