"use client";

import { useState, useEffect, useMemo } from "react";
import { apiUrl } from "@/lib/api";
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronRight,
  FileCode2,
  Clock,
  GitCommit,
  GitPullRequest,
  ExternalLink,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
  X
} from "lucide-react";
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
  high: "text-rose-400 bg-rose-500/10 border-rose-500/25 shadow-sm shadow-rose-950/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/25 shadow-sm shadow-amber-950/20",
  low: "text-sky-400 bg-sky-500/10 border-sky-500/25 shadow-sm shadow-sky-950/20",
  none: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25 shadow-sm shadow-emerald-950/20",
};

const severityIcons = {
  high: <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />,
  medium: <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />,
  low: <Info className="w-3.5 h-3.5 shrink-0 text-sky-400" />,
  none: <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />,
};

export default function HistoryWorkspace() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("inspectra.history.search") || "";
    }
    return "";
  });
  const [severityFilter, setSeverityFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("inspectra.history.severity") || "all";
    }
    return "all";
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("inspectra.history.status") || "all";
    }
    return "all";
  });
  const [repositories, setRepositories] = useState({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("inspectra.history.search", searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("inspectra.history.severity", severityFilter);
    }
  }, [severityFilter]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("inspectra.history.status", statusFilter);
    }
  }, [statusFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");
      let token = null;
      try {
        token = window.localStorage.getItem("auth_token");
      } catch (e) {}

      const [reviewsRes, reposRes] = await Promise.all([
        fetch(apiUrl("/reviews"), { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }),
        fetch(apiUrl("/repositories"), { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
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

      // Exclude reviews belonging to disconnected repositories
      const validReviews = reviewsData.filter(r => !r.repository_id || reposMap[r.repository_id]);

      setReviews(validReviews);
      setRepositories(reposMap);
    } catch (err) {
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();

    function onDataChanged() {
      fetchReviews();
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

  // Compute metric counts for filter pills
  const metrics = useMemo(() => {
    let prCount = 0;
    let cleanCount = 0;
    let flaggedCount = 0;

    reviews.forEach(r => {
      const isPr = Boolean(r.pr_url || r.pr_number || r.review_status === "PR_CREATED");
      if (isPr) prCount++;
      const sev = (r.overall_severity || "").toLowerCase();
      if (sev === "none" || r.review_status === "CLEAN" || r.review_status === "REVALIDATED") {
        cleanCount++;
      } else if (sev === "high" || sev === "medium") {
        flaggedCount++;
      }
    });

    return {
      total: reviews.length,
      prCount,
      cleanCount,
      flaggedCount
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      const isPr = Boolean(review.pr_url || review.pr_number || review.review_status === "PR_CREATED");
      const prText = review.pr_number ? `pr #${review.pr_number} pull request` : (isPr ? "pull request pr" : "");
      
      const matchesSearch = 
        (review.file_path || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (review.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (review.ai_summary || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        prText.includes(searchQuery.toLowerCase());
        
      const matchesSeverity = 
        severityFilter === "all" || 
        (review.overall_severity && review.overall_severity.toLowerCase() === severityFilter);

      let matchesStatus = true;
      if (statusFilter === "pr_only") {
        matchesStatus = isPr;
      } else if (statusFilter === "clean") {
        matchesStatus = review.review_status === "CLEAN" || (review.overall_severity || "").toLowerCase() === "none";
      } else if (statusFilter === "revalidated") {
        matchesStatus = review.review_status === "REVALIDATED" || Boolean(review.parent_review_id);
      } else if (statusFilter === "issues") {
        matchesStatus = !isPr && (review.overall_severity || "").toLowerCase() !== "none";
      }

      return matchesSearch && matchesSeverity && matchesStatus;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [reviews, searchQuery, severityFilter, statusFilter]);

  const getStatusDisplay = (review) => {
    const hasPr = Boolean(review.pr_url || review.pr_number || review.review_status === "PR_CREATED");
    
    if (hasPr) {
      if (review.pr_url) {
        return (
          <a
            href={review.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open Pull Request on GitHub"
            className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-medium text-purple-300 transition-all hover:border-purple-500/50 hover:bg-purple-500/20 hover:text-purple-100 shadow-sm group/pr"
          >
            <GitPullRequest className="h-3 w-3 text-purple-400 group-hover/pr:scale-110 transition-transform" />
            <span>{review.pr_number ? `PR #${review.pr_number}` : "PR Created"}</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-60 group-hover/pr:opacity-100" />
          </a>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-medium text-purple-300">
          <GitPullRequest className="h-3 w-3 text-purple-400" />
          <span>PR Created</span>
        </span>
      );
    }

    switch (review.review_status) {
      case "CLEAN":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>Clean</span>
          </span>
        );
      case "REVALIDATED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/25 bg-teal-500/10 px-2.5 py-1 text-[11px] font-medium text-teal-300">
            <GitCommit className="h-3 w-3" />
            <span>Revalidated</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-400">
            <AlertCircle className="h-3 w-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-400">
            <Clock className="h-3 w-3" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[450px] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full border-2 border-sky-500/20 border-t-sky-500 animate-spin" />
            <Sparkles className="absolute inset-0 m-auto h-4 w-4 text-sky-400 animate-pulse" />
          </div>
          <span className="text-[13px] font-medium text-slate-300 animate-pulse">Loading audit history & PR logs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] p-6">
        <div className="text-center max-w-md bg-[#161b22] border border-rose-500/20 rounded-lg p-6 shadow-xl">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 mb-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-[16px] font-medium text-slate-200">Failed to load history</h3>
          <p className="mt-2 text-[13px] text-slate-400">{error}</p>
          <button
            onClick={fetchReviews}
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-sky-500 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1015] animate-in fade-in duration-300">
      {/* Top Header & Filter Bar */}
      <div className="border-b border-white/8 bg-[#161b22] px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title & Quick Stats */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 mr-2">
              <span className="text-[16px] font-semibold tracking-tight text-white">Review Audit Logs</span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                {filteredReviews.length} {filteredReviews.length === 1 ? "entry" : "entries"}
              </span>
            </div>

            {/* Quick Filter Badges */}
            <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
              <button
                onClick={() => { setStatusFilter("all"); setSeverityFilter("all"); }}
                className={`px-2.5 py-1 rounded-full border transition-all ${
                  statusFilter === "all" && severityFilter === "all"
                    ? "border-sky-500/50 bg-sky-500/15 text-sky-300 font-medium"
                    : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"
                }`}
              >
                All ({metrics.total})
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === "pr_only" ? "all" : "pr_only")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all ${
                  statusFilter === "pr_only"
                    ? "border-purple-500/60 bg-purple-500/20 text-purple-200 font-medium"
                    : "border-purple-500/25 bg-purple-500/10 text-purple-300 hover:bg-purple-500/15"
                }`}
              >
                <GitPullRequest className="h-3 w-3 text-purple-400" />
                <span>PRs Raised ({metrics.prCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === "clean" ? "all" : "clean")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all ${
                  statusFilter === "clean"
                    ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-200 font-medium"
                    : "border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                }`}
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Clean ({metrics.cleanCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === "issues" ? "all" : "issues")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all ${
                  statusFilter === "issues"
                    ? "border-amber-500/60 bg-amber-500/20 text-amber-200 font-medium"
                    : "border-amber-500/25 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15"
                }`}
              >
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                <span>Issues Flagged ({metrics.flaggedCount})</span>
              </button>
            </div>
          </div>

          {/* Search and Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64 min-w-[200px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                className="block w-full rounded-md border border-white/10 bg-[#0d1016] py-1.5 pl-9 pr-8 text-[12px] text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
                placeholder="Search file, summary, or PR #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Severity Filter Dropdown */}
            <div className="relative w-36">
              <select
                className="block w-full appearance-none rounded-md border border-white/10 bg-[#0d1016] py-1.5 pl-3 pr-7 text-[12px] text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer transition-colors"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
                <option value="none">Clean</option>
              </select>
              <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 rotate-90 pointer-events-none" />
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative w-36">
              <select
                className="block w-full appearance-none rounded-md border border-white/10 bg-[#0d1016] py-1.5 pl-3 pr-7 text-[12px] text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer transition-colors"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pr_only">PR Raised Only</option>
                <option value="clean">Clean / Fixed</option>
                <option value="revalidated">Revalidated</option>
                <option value="issues">Issues Flagged</option>
              </select>
              <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 rotate-90 pointer-events-none" />
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchReviews}
              title="Refresh Review History"
              className="p-1.5 rounded-md border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 overflow-auto">
        {filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 mb-4 shadow-inner">
              <Search className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-[16px] font-medium text-slate-200">No review logs found</h3>
            <p className="mt-2 text-[13px] text-slate-400 max-w-sm">
              {reviews.length === 0 
                ? "You haven't run any code reviews yet. Run an AI analysis on your repository files to generate logs." 
                : "No logs matched your current search filters. Try clearing filters or searching for different keywords."}
            </p>
            {(searchQuery || severityFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => { setSearchQuery(""); setSeverityFilter("all"); setStatusFilter("all"); }}
                className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-sky-400 hover:text-sky-300 underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="min-w-[900px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-[#161b22]/75 backdrop-blur-sm sticky top-0 z-10">
                  <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-[36%]">
                    File & Repository
                  </th>
                  <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-[14%]">
                    Severity
                  </th>
                  <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-[18%]">
                    Status / Pull Request
                  </th>
                  <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-[18%]">
                    Reviewed At
                  </th>
                  <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-[14%] text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReviews.map((review) => {
                  const repo = review.repository_id === "local" ? { repository_name: "Local Workspace" } : repositories[review.repository_id];
                  const repoName = repo ? repo.repository_name : (review.repository_id ? `Repo #${review.repository_id}` : "Workspace");
                  const sev = (review.overall_severity || "none").toLowerCase();
                  const sevColor = severityColors[sev] || severityColors.none;
                  const sevIcon = severityIcons[sev] || severityIcons.none;
                  const hasPr = Boolean(review.pr_url || review.pr_number || review.review_status === "PR_CREATED");

                  return (
                    <tr 
                      key={review.id} 
                      className="group hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Column 1: File & Repository */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-slate-800/80 border border-white/5">
                              <FileCode2 className="h-4 w-4 text-sky-400" />
                            </div>
                            <Link
                              href={`/history/${review.id}`}
                              className="text-[13px] font-medium text-slate-200 group-hover:text-sky-300 transition-colors truncate max-w-sm"
                            >
                              {review.file_path || review.title || "Unknown File"}
                            </Link>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="inline-flex items-center gap-1 rounded bg-white/5 border border-white/5 px-2 py-0.5 text-slate-400 font-mono text-[10px]">
                              {repoName}
                            </span>
                            {review.parent_review_id && (
                              <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300">
                                <GitCommit className="h-2.5 w-2.5" /> Revalidated
                              </span>
                            )}
                          </div>

                          {review.ai_summary && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 group-hover:text-slate-400 transition-colors max-w-md font-sans">
                              {review.ai_summary}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Severity */}
                      <td className="py-4 px-6 align-middle">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold uppercase tracking-wider ${sevColor}`}>
                          {sevIcon}
                          <span>{sev}</span>
                        </div>
                      </td>

                      {/* Column 3: Status / Pull Request */}
                      <td className="py-4 px-6 align-middle">
                        <div className="flex flex-col items-start gap-1">
                          {getStatusDisplay(review)}
                          {hasPr && review.pr_url && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              Linked to GitHub PR
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Date & Time */}
                      <td className="py-4 px-6 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[12px] font-medium text-slate-300">
                            {parseUtcDate(review.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3 text-slate-600" /> {timeAgo(review.created_at)}
                          </span>
                        </div>
                      </td>

                      {/* Column 5: Action */}
                      <td className="py-4 px-6 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasPr && review.pr_url && (
                            <a
                              href={review.pr_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View PR on GitHub"
                              className="inline-flex items-center justify-center p-1.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/25 transition-colors"
                            >
                              <GitPullRequest className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <Link 
                            href={`/history/${review.id}`}
                            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#222834] hover:bg-sky-600 px-3 py-1.5 text-[12px] font-medium text-slate-200 hover:text-white transition-all shadow-sm group/btn border border-white/5 hover:border-sky-500"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="h-3 w-3 opacity-60 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
