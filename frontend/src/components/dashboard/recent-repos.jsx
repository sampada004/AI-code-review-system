"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitBranch, FolderGit2, Play, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import AddRepoModal from "@/components/add-repo/add-repo-modal";

export default function RecentRepos() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repoToDisconnect, setRepoToDisconnect] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchRepos() {
      try {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
        const { apiUrl } = await import("@/lib/api");
        const res = await fetch(apiUrl(`/repositories`), {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) return;

        const contentType = res.headers.get("content-type") || "";
        let data = null;
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          return;
        }

        if (data && data.repositories && mounted) {
          setRepos(
            data.repositories.map((r) => ({
              id: r.id,
              name: r.repository_name,
              url: r.repository_url,
              createdDate: new Date(r.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              }),
            }))
          );
        }
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRepos();

    function onReposChanged() {
      fetchRepos();
    }

    if (typeof window !== "undefined") {
      window.addEventListener("repositories:changed", onReposChanged);
    }

    return () => {
      mounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("repositories:changed", onReposChanged);
      }
    };
  }, []);

  async function handleConfirmDisconnect() {
    if (!repoToDisconnect) return;
    setDisconnecting(true);
    setDisconnectError(null);

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
      const { apiUrl } = await import("@/lib/api");
      const res = await fetch(apiUrl(`/repositories/${repoToDisconnect.id}`), {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to disconnect repository");
      }

      // Successfully removed
      setRepos((prev) => prev.filter((r) => r.id !== repoToDisconnect.id));
      setRepoToDisconnect(null);

      // Notify other components (e.g. analytics, charts)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("repositories:changed", { detail: { disconnectedId: repoToDisconnect.id } }));
      }
    } catch (err) {
      setDisconnectError(err.message || "Something went wrong while disconnecting.");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="rounded-md border border-white/10 bg-[#141821] p-4.5 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-950/40 text-sky-300 border border-sky-900/30 shrink-0">
            <FolderGit2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Connected Repositories</span>
              <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                {repos.length} Connected
              </span>
            </h3>
          </div>
        </div>

        <div className="shrink-0">
          <AddRepoModal />
        </div>
      </div>

      {/* Repositories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-md border border-white/5 bg-[#0d1016] animate-pulse" />
          ))}
        </div>
      ) : repos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="group relative flex items-center justify-between rounded-md border border-white/5 bg-[#0d1016] p-3 shadow-sm hover:border-sky-500/40 transition-all duration-200"
            >
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <GitBranch className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span className="text-[13px] font-semibold text-slate-100 group-hover:text-sky-400 transition-colors truncate" title={repo.name}>
                    {repo.name}
                  </span>
                </div>
                {repo.url ? (
                  <p className="text-[11px] text-slate-500 truncate" title={repo.url}>
                    {repo.url}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href={`/reviews?repoId=${repo.id}&name=${encodeURIComponent(repo.name)}&url=${encodeURIComponent(repo.url || "")}&branch=main`}
                  className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 hover:bg-sky-500 border border-sky-500/20 hover:border-sky-400 px-2.5 py-1 text-[11px] font-medium text-sky-400 hover:text-white transition-all"
                >
                  <Play className="h-3 w-3 fill-current" />
                  Scan
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setDisconnectError(null);
                    setRepoToDisconnect(repo);
                  }}
                  title="Disconnect repository"
                  className="inline-flex items-center justify-center h-6 w-6 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                  aria-label={`Disconnect ${repo.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-white/10 bg-[#0d1016] p-6 text-center">
          <p className="text-[13px] font-medium text-slate-300">No repositories connected</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Connect a Git project to start automated AI code reviews.
          </p>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {repoToDisconnect ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fade-in"
            onClick={() => !disconnecting && setRepoToDisconnect(null)}
          />

          <div className="relative z-10 w-full max-w-md animate-scale-in">
            <div className="rounded-2xl border border-white/15 bg-[#0f141f] p-6 shadow-2xl space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Disconnect Repository?</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Are you sure you want to disconnect <span className="text-slate-200 font-semibold">{repoToDisconnect.name}</span>? This will remove it from your workspace. Existing review history will remain safe.
                  </p>
                </div>
              </div>

              {disconnectError ? (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                  {disconnectError}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/5">
                <button
                  type="button"
                  disabled={disconnecting}
                  onClick={() => setRepoToDisconnect(null)}
                  className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={disconnecting}
                  onClick={handleConfirmDisconnect}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white px-3.5 py-1.5 text-xs font-semibold shadow-md shadow-rose-500/10 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      Disconnect
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}




