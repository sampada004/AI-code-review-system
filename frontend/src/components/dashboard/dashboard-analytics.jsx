"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ShieldCheck, ShieldAlert } from "lucide-react";

export default function DashboardAnalytics() {
  const [reviews, setReviews] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
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

      setReviews(reviewsData);
      setRepositories(reposData);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    function onDataChanged() {
      fetchData();
    }

    if (typeof window !== "undefined") {
      window.addEventListener("repositories:changed", onDataChanged);
      window.addEventListener("reviews:changed", onDataChanged);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("repositories:changed", onDataChanged);
        window.removeEventListener("reviews:changed", onDataChanged);
      }
    };
  }, [fetchData]);

  // Map connected repository IDs for quick membership checking
  const connectedRepoMap = new Map();
  repositories.forEach(repo => {
    connectedRepoMap.set(String(repo.id), repo);
  });

  // Calculate latest active review per unique (repository_id, file_path)
  const latestFileReviews = new Map();
  reviews.forEach(r => {
    // Exclude reviews that do not belong to any currently connected repository
    if (r.repository_id && !connectedRepoMap.has(String(r.repository_id))) {
      return;
    }

    const key = `${r.repository_id || "local"}-${r.file_path || r.title || r.id}`;
    if (!latestFileReviews.has(key)) {
      latestFileReviews.set(key, r);
    } else {
      const existing = latestFileReviews.get(key);
      const curTime = new Date(r.updated_at || r.created_at).getTime();
      const prevTime = new Date(existing.updated_at || existing.created_at).getTime();
      if (curTime >= prevTime) {
        latestFileReviews.set(key, r);
      }
    }
  });

  // Group active faults by repository
  const repoFaultsMap = {};
  repositories.forEach(repo => {
    repoFaultsMap[repo.id] = {
      id: repo.id,
      name: repo.repository_name,
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
      cleanFiles: 0,
      totalScanned: 0,
    };
  });

  let totalHigh = 0;
  let totalMed = 0;
  let totalLow = 0;

  latestFileReviews.forEach(r => {
    const repoId = r.repository_id;
    if (!repoId || !repoFaultsMap[repoId]) return;

    const status = (r.review_status || "").toUpperCase();
    const sev = (r.overall_severity || "none").toLowerCase();
    
    repoFaultsMap[repoId].totalScanned += 1;

    // A file has no active fault if PR was created, marked CLEAN, or severity is none
    const isClean = status === "PR_CREATED" || status === "CLEAN" || sev === "none";

    if (!isClean && ["high", "medium", "low"].includes(sev)) {
      repoFaultsMap[repoId][sev] += 1;
      repoFaultsMap[repoId].total += 1;

      if (sev === "high") totalHigh += 1;
      else if (sev === "medium") totalMed += 1;
      else if (sev === "low") totalLow += 1;
    } else {
      repoFaultsMap[repoId].cleanFiles += 1;
    }
  });

  const totalFaults = totalHigh + totalMed + totalLow;
  const isAllClean = totalFaults === 0;
  const activeRepoList = Object.values(repoFaultsMap);

  return (
    <div className="rounded-md border border-white/10 bg-[#141821] p-4.5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-md border shrink-0 ${
              isAllClean
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-900/30"
                : totalHigh > 0
                ? "bg-rose-950/40 text-rose-300 border-rose-900/30"
                : "bg-amber-950/40 text-amber-300 border-amber-900/30"
            }`}
          >
            {isAllClean ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <ShieldAlert className="h-4 w-4" />
            )}
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Repository Fault Analytics</span>
              {isAllClean ? (
                <span className="rounded-md bg-emerald-950/50 border border-emerald-900/40 px-2 py-0.5 text-[11px] font-medium text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  All Clean (0 Faults)
                </span>
              ) : (
                <span className="rounded-md bg-rose-950/50 border border-rose-900/40 px-2 py-0.5 text-[11px] font-medium text-rose-300">
                  {totalFaults} Faults Detected
                </span>
              )}
            </h3>
            <p className="text-[12px] text-slate-400">
              {isAllClean
                ? "All connected repositories are operating cleanly with zero active code defects."
                : "Security defects, logic bugs, and code quality breakdown across connected repositories."}
            </p>
          </div>
        </div>

        {/* Severity Summary Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              totalHigh > 0
                ? "border-rose-900/40 bg-rose-950/50 text-rose-300"
                : "border-white/5 bg-white/[0.02] text-slate-500"
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{totalHigh} High</span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              totalMed > 0
                ? "border-amber-900/40 bg-amber-950/50 text-amber-300"
                : "border-white/5 bg-white/[0.02] text-slate-500"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{totalMed} Med</span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              totalLow > 0
                ? "border-sky-900/40 bg-sky-950/50 text-sky-300"
                : "border-white/5 bg-white/[0.02] text-slate-500"
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            <span>{totalLow} Low</span>
          </div>
        </div>
      </div>

      {/* Per Repository Fault Distribution Grid */}
      {loading ? (
        <div className="py-6 text-center text-[12px] text-slate-400">
          Analyzing repository defect distribution...
        </div>
      ) : activeRepoList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeRepoList.map((repo) => {
            const hasFaults = repo.total > 0;
            const highPct = hasFaults ? Math.round((repo.high / repo.total) * 100) : 0;
            const medPct = hasFaults ? Math.round((repo.medium / repo.total) * 100) : 0;
            const lowPct = hasFaults ? Math.round((repo.low / repo.total) * 100) : 0;

            return (
              <div
                key={repo.id}
                className="rounded-md border border-white/5 bg-[#0d1016] p-3 space-y-2.5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between text-[12px]">
                  <div className="font-semibold text-slate-200 truncate max-w-[170px]" title={repo.name}>
                    {repo.name}
                  </div>
                  <div>
                    {hasFaults ? (
                      <span className="rounded-md bg-rose-950/40 border border-rose-900/30 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
                        {repo.total} {repo.total === 1 ? "Fault" : "Faults"}
                      </span>
                    ) : (
                      <span className="rounded-md bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 text-emerald-400 flex items-center gap-1 text-[11px] font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Clean
                      </span>
                    )}
                  </div>
                </div>

                {/* Multi-segment Fault Progress Bar */}
                {hasFaults ? (
                  <div className="space-y-1.5">
                    <div className="flex h-2 w-full overflow-hidden rounded-md bg-white/5">
                      {repo.high > 0 ? (
                        <div
                          style={{ width: `${highPct}%` }}
                          className="bg-rose-500"
                          title={`High: ${repo.high}`}
                        />
                      ) : null}
                      {repo.medium > 0 ? (
                        <div
                          style={{ width: `${medPct}%` }}
                          className="bg-amber-500"
                          title={`Medium: ${repo.medium}`}
                        />
                      ) : null}
                      {repo.low > 0 ? (
                        <div
                          style={{ width: `${lowPct}%` }}
                          className="bg-sky-500"
                          title={`Low: ${repo.low}`}
                        />
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className={repo.high > 0 ? "text-rose-300 font-medium" : "text-slate-500"}>
                        {repo.high} High
                      </span>
                      <span className={repo.medium > 0 ? "text-amber-300 font-medium" : "text-slate-500"}>
                        {repo.medium} Med
                      </span>
                      <span className={repo.low > 0 ? "text-sky-300 font-medium" : "text-slate-500"}>
                        {repo.low} Low
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-emerald-500/20 border border-emerald-500/30" />
                    <p className="text-[10px] text-emerald-400/80">
                      {repo.totalScanned > 0
                        ? `${repo.cleanFiles} file${repo.cleanFiles === 1 ? "" : "s"} scanned • 0 issues`
                        : "Ready for scan • No detected defects"}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center bg-[#0d1016] rounded-md border border-dashed border-white/10">
          <p className="text-[13px] font-medium text-slate-300">No repositories connected</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Connect a repository above to view automated code quality analytics.
          </p>
        </div>
      )}
    </div>
  );
}



