"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Clock, FileCode2, AlertCircle, AlertTriangle, CheckCircle2, Info, ShieldAlert, Wrench, History, ArrowRight } from "lucide-react";
import Link from "next/link";

function parseUtcDate(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  let str = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(str) && !str.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(str)) {
    str = str.replace(" ", "T") + "Z";
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

function timeAgo(dateString) {
  if (!dateString) return "Recently";
  const date = parseUtcDate(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (isNaN(seconds) || seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const severityColors = {
  high: "text-rose-300 bg-rose-950/40 border-rose-900/30",
  medium: "text-amber-300 bg-amber-950/40 border-amber-900/30",
  low: "text-sky-300 bg-sky-950/40 border-sky-900/30",
  none: "text-emerald-300 bg-emerald-950/40 border-emerald-900/30",
};

const severityIcons = {
  high: <AlertCircle className="w-3.5 h-3.5 text-rose-300" />,
  medium: <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />,
  low: <Info className="w-3.5 h-3.5 text-sky-300" />,
  none: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />,
};

export default function RecentReviews() {
  const [reviews, setReviews] = useState([]);
  const [repositories, setRepositories] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchData = async () => {
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
      const { apiUrl } = await import("@/lib/api");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [reviewsRes, reposRes] = await Promise.all([
        fetch(apiUrl(`/reviews`), { headers }),
        fetch(apiUrl(`/repositories`), { headers })
      ]);

      let reviewsData = [];
      let reposMap = {};

      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        if (data && data.reviews) reviewsData = data.reviews;
      }

      if (reposRes.ok) {
        const data = await reposRes.json();
        if (data && data.repositories) {
          data.repositories.forEach(repo => {
            reposMap[repo.id] = repo;
          });
        }
      }

      setReviews(reviewsData);
      setRepositories(reposMap);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

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
  }, []);

  // Filter ONLY files that need attention (exclude PR_CREATED, CLEAN, and resolved items)
  const latestFilesMap = new Map();
  reviews.forEach((r) => {
    // If review belongs to a repository that is no longer connected, exclude it
    if (r.repository_id && !repositories[r.repository_id]) {
      return;
    }

    const sev = (r.overall_severity || "").toLowerCase();
    const status = (r.review_status || "").toUpperCase();
    
    // Exclude PR_CREATED, CLEAN, and REVALIDATED reviews
    const isDone = status === "PR_CREATED" || status === "CLEAN" || status === "REVALIDATED" || sev === "none";
    const needsAttention = !isDone && (sev === "high" || sev === "medium" || sev === "low" || ["PENDING", "FAILED", "ACTION_REQUIRED"].includes(status));

    if (needsAttention) {
      const key = `${r.repository_id || "local"}-${r.file_path || r.title}`;
      if (!latestFilesMap.has(key)) {
        latestFilesMap.set(key, r);
      } else {
        const existing = latestFilesMap.get(key);
        if (new Date(r.created_at) > new Date(existing.created_at)) {
          latestFilesMap.set(key, r);
        }
      }
    }
  });

  const actionableList = Array.from(latestFilesMap.values()).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const highRiskCount = actionableList.filter(
    (r) => (r.overall_severity || "").toLowerCase() === "high"
  ).length;

  const medRiskCount = actionableList.filter(
    (r) => (r.overall_severity || "").toLowerCase() === "medium"
  ).length;

  const filteredAlerts = actionableList.filter((r) => {
    const sev = (r.overall_severity || "").toLowerCase();
    if (activeFilter === "high") return sev === "high";
    if (activeFilter === "medium") return sev === "medium";
    return true;
  });

  return (
    <div className="rounded-md border border-white/10 bg-[#141821] p-4.5 space-y-4">
      {/* Alert Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-950/40 text-rose-300 border border-rose-900/30 shrink-0">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Code Alerts & Pending Fixes</span>
              {actionableList.length > 0 ? (
                <span className="rounded-md bg-rose-950/50 border border-rose-900/40 px-2 py-0.5 text-[11px] font-medium text-rose-300">
                  {actionableList.length} Action Needed
                </span>
              ) : (
                <span className="rounded-md bg-emerald-950/50 border border-emerald-900/40 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                  All Clear
                </span>
              )}
            </h2>
            <p className="text-[12px] text-slate-400">
              Files with detected bugs, security vulnerabilities, or failing code checks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Filter Pills */}
          <div className="flex rounded-md bg-[#0d1016] p-1 border border-white/5">
            <button
              onClick={() => setActiveFilter("all")}
              className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
                activeFilter === "all"
                  ? "bg-[#21262d] text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({actionableList.length})
            </button>
            <button
              onClick={() => setActiveFilter("high")}
              className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
                activeFilter === "high"
                  ? "bg-[#21262d] text-rose-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              High ({highRiskCount})
            </button>
            <button
              onClick={() => setActiveFilter("medium")}
              className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
                activeFilter === "medium"
                  ? "bg-[#21262d] text-amber-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Medium ({medRiskCount})
            </button>
          </div>

          <Link
            href="/history"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-400 hover:text-sky-400 transition-colors px-3 py-1.5 rounded-md border border-white/5 bg-[#0d1016]"
          >
            <History className="h-3.5 w-3.5" />
            History
          </Link>
        </div>
      </div>

      {/* Main Alert List */}
      {loading ? (
        <div className="py-8 text-center text-[12px] text-slate-400">
          Checking code health status...
        </div>
      ) : filteredAlerts.length > 0 ? (
        <div className="divide-y divide-white/5 border border-white/5 rounded-md overflow-hidden bg-[#0d1016]">
          {filteredAlerts.map((r) => {
            const repo =
              r.repository_id === "local"
                ? { repository_name: "Local Workspace" }
                : repositories[r.repository_id];
            const repoName = repo
              ? repo.repository_name
              : r.repository_id
              ? `Repo #${r.repository_id}`
              : "Workspace";
            const sev = (r.overall_severity || "medium").toLowerCase();
            const sevColor = severityColors[sev] || severityColors.medium;
            const sevIcon = severityIcons[sev] || severityIcons.medium;

            const filePath = r.file_path || r.title || "Unknown File";
            const fileName = filePath.split("/").pop();
            const dirPath = filePath.includes("/")
              ? filePath.substring(0, filePath.lastIndexOf("/"))
              : "";

            return (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-[#141821] transition-colors group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 p-1.5 rounded-md bg-[#141821] border border-white/5 text-sky-400 shrink-0">
                    <FileCode2 className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[14px] text-slate-200 group-hover:text-white transition-colors truncate">
                        {fileName}
                      </span>
                      <span className="bg-[#21262d] text-slate-400 text-[11px] font-medium px-2 py-0.5 rounded border border-white/5">
                        {repoName}
                      </span>
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider ${sevColor}`}
                      >
                        {sevIcon}
                        {sev}
                      </div>
                    </div>

                    {dirPath ? (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{dirPath}</p>
                    ) : null}

                    {r.ai_summary ? (
                      <p className="text-[12px] text-slate-400 line-clamp-1 mt-1 bg-[#141821] px-2.5 py-1 rounded border border-white/5">
                        {r.ai_summary}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Clock className="h-3.5 w-3.5" />
                    {timeAgo(r.updated_at || r.created_at)}
                  </div>

                  <Link
                    href={
                      r.repository_id
                        ? `/reviews?repoId=${r.repository_id}&file=${encodeURIComponent(
                            filePath
                          )}&reviewId=${r.id}&autoAnalyze=true`
                        : "/reviews"
                    }
                    className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/10 hover:bg-sky-500 border border-sky-500/20 hover:border-sky-400 px-3 py-1.5 text-[12px] font-medium text-sky-400 hover:text-white transition-all group/btn"
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    Fix Issue
                    <ArrowRight className="h-3.5 w-3.5 opacity-70 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center bg-[#0d1016] rounded-md border border-white/5 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-900/30 mb-2">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h4 className="text-[14px] font-semibold text-slate-100">All Codebases Operating Cleanly</h4>
          <p className="mt-0.5 text-[12px] text-slate-400 max-w-sm">
            No active security vulnerabilities or critical code bugs detected.
          </p>
        </div>
      )}
    </div>
  );
}




