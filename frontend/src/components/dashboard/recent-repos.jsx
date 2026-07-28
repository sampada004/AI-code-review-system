"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { recentRepos as sampleRepos } from "./dashboard-data";

export default function RecentRepos() {
  const [repos, setRepos] = useState(sampleRepos);

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
          // Non-JSON response (HTML error) -- abort
          return;
        }

        if (data && data.repositories && mounted) {
          setRepos(
            data.repositories.map((r) => ({
              id: r.id,
              name: r.repository_name,
              description: r.repository_url,
              lastScanned: new Date(r.created_at).toLocaleString(),
            }))
          );
        }
      } catch (err) {
        // ignore and fall back to sample data
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
    <section className="rounded-xl border border-white/10 bg-[#161b22] p-6 shadow-sm transition-all duration-300 hover:border-white/20">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-[18px] font-semibold text-[#e7ebf2]">Recent Repositories</h3>
        <div>
          <a href="#" className="text-sm text-slate-300 hover:text-white mr-3">Filter</a>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {repos.map((repo) => (
          <li key={repo.id}>
            <Link
              href={`/reviews?repoId=${repo.id}&name=${encodeURIComponent(repo.name)}&url=${encodeURIComponent(repo.description)}&branch=main`}
              className="flex items-start justify-between rounded-lg p-2 transition-colors hover:bg-white/5"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[#e8edf4]">{repo.name}</div>
                <div className="mt-1 text-[13px] text-slate-300">{repo.description}</div>
              </div>
              <div className="ml-4 text-right text-[12px] text-slate-400">
                <div>Last added</div>
                <div className="mt-1">{repo.lastScanned}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
