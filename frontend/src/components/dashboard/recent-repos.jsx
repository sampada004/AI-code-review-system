"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitBranch, FolderGit2, Play } from "lucide-react";
import AddRepoModal from "@/components/add-repo/add-repo-modal";

export default function RecentRepos() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);

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

              <Link
                href={`/reviews?repoId=${repo.id}&name=${encodeURIComponent(repo.name)}&url=${encodeURIComponent(repo.url || "")}&branch=main`}
                className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 hover:bg-sky-500 border border-sky-500/20 hover:border-sky-400 px-2.5 py-1 text-[11px] font-medium text-sky-400 hover:text-white transition-all shrink-0"
              >
                <Play className="h-3 w-3 fill-current" />
                Scan
              </Link>
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
    </div>
  );
}




