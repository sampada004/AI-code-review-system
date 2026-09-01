"use client";

import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Info, Bug, CheckCircle2 } from "lucide-react";

export default function DashboardAnalytics() {
  const [reviews, setReviews] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
        const { apiUrl } = await import("@/lib/api");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [reviewsRes, reposRes] = await Promise.all([
          fetch(apiUrl(`/reviews`), { headers }),
          fetch(apiUrl(`/repositories`), { headers })
        ]);

        let reviewsData = [];
        let reposData = [];

        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          if (data && data.reviews) reviewsData = data.reviews;
        }

        if (reposRes.ok) {
          const data = await reposRes.json();
          if (data && data.repositories) reposData = data.repositories;
        }

        if (mounted) {
          setReviews(reviewsData);
          setRepositories(reposData);
        }
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  // Compute Repository Faults Breakdown
  const highFaults = reviews.filter(r => (r.overall_severity || '').toLowerCase() === 'high').length;
  const medFaults = reviews.filter(r => (r.overall_severity || '').toLowerCase() === 'medium').length;
  const lowFaults = reviews.filter(r => (r.overall_severity || '').toLowerCase() === 'low').length;
  const totalFaults = highFaults + medFaults + lowFaults;

  // Compute faults grouped per repository
  const repoFaultsMap = {};
  repositories.forEach(repo => {
    repoFaultsMap[repo.id] = {
      name: repo.repository_name,
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
    };
  });

  // Include local workspace if present
  repoFaultsMap["local"] = {
    name: "Local Workspace",
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
  };

  reviews.forEach(r => {
    const repoId = r.repository_id || "local";
    const sev = (r.overall_severity || "none").toLowerCase();
    if (["high", "medium", "low"].includes(sev)) {
      if (!repoFaultsMap[repoId]) {
        repoFaultsMap[repoId] = {
          name: `Repo #${repoId}`,
          high: 0,
          medium: 0,
          low: 0,
          total: 0,
        };
      }
      repoFaultsMap[repoId][sev] += 1;
      repoFaultsMap[repoId].total += 1;
    }
  });

  const activeRepoFaults = Object.values(repoFaultsMap).filter(
    r => r.total > 0 || repositories.some(repo => repo.repository_name === r.name)
  );

  return (
    <div className="rounded-md border border-white/10 bg-[#141821] p-4.5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-950/40 text-rose-300 border border-rose-900/30 shrink-0">
            <Bug className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Repository Fault Analytics</span>
              <span className="rounded-md bg-rose-950/50 border border-rose-900/40 px-2 py-0.5 text-[11px] font-medium text-rose-300">
                {totalFaults} Faults
              </span>
            </h3>
            <p className="text-[12px] text-slate-400">
              Security defects, logic bugs, and code quality breakdown across connected repositories.
            </p>
          </div>
        </div>

        {/* Severity Summary Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 rounded-md border border-rose-900/30 bg-rose-950/40 px-2.5 py-1 text-[11px] font-medium text-rose-300">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{highFaults} High</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-md border border-amber-900/30 bg-amber-950/40 px-2.5 py-1 text-[11px] font-medium text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{medFaults} Med</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-md border border-sky-900/30 bg-sky-950/40 px-2.5 py-1 text-[11px] font-medium text-sky-300">
            <Info className="h-3.5 w-3.5" />
            <span>{lowFaults} Low</span>
          </div>
        </div>
      </div>

      {/* Per Repository Fault Distribution Grid */}
      {loading ? (
        <div className="py-6 text-center text-[12px] text-slate-400">
          Analyzing repository defect distribution...
        </div>
      ) : activeRepoFaults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeRepoFaults.map((repo, idx) => {
            const highPct = repo.total > 0 ? Math.round((repo.high / repo.total) * 100) : 0;
            const medPct = repo.total > 0 ? Math.round((repo.medium / repo.total) * 100) : 0;
            const lowPct = repo.total > 0 ? Math.round((repo.low / repo.total) * 100) : 0;

            return (
              <div
                key={idx}
                className="rounded-md border border-white/5 bg-[#0d1016] p-3 space-y-2 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between text-[12px]">
                  <div className="font-semibold text-slate-200 truncate max-w-[160px]" title={repo.name}>
                    {repo.name}
                  </div>
                  <div>
                    {repo.total > 0 ? (
                      <span className="text-rose-300 font-semibold text-[11px]">{repo.total} Faults</span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Clean
                      </span>
                    )}
                  </div>
                </div>

                {/* Multi-segment Fault Progress Bar */}
                {repo.total > 0 ? (
                  <div className="space-y-1">
                    <div className="flex h-2 w-full overflow-hidden rounded-md bg-white/5">
                      {repo.high > 0 ? (
                        <div
                          style={{ width: `${highPct}%` }}
                          className="bg-rose-700/90"
                          title={`High: ${repo.high}`}
                        />
                      ) : null}
                      {repo.medium > 0 ? (
                        <div
                          style={{ width: `${medPct}%` }}
                          className="bg-amber-600/90"
                          title={`Medium: ${repo.medium}`}
                        />
                      ) : null}
                      {repo.low > 0 ? (
                        <div
                          style={{ width: `${lowPct}%` }}
                          className="bg-sky-600/90"
                          title={`Low: ${repo.low}`}
                        />
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="text-rose-300">{repo.high} High</span>
                      <span className="text-amber-300">{repo.medium} Med</span>
                      <span className="text-sky-300">{repo.low} Low</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-2 w-full rounded-md bg-emerald-950/30 border border-emerald-900/30" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-4 text-center text-[12px] text-slate-400">
          No faults detected across connected repositories.
        </div>
      )}
    </div>
  );
}



