"use client";

import { useState, useEffect, useMemo } from "react";
import { apiUrl } from "@/lib/api";
import { Search, Filter, AlertTriangle, CheckCircle2, AlertCircle, Info, ChevronRight, FileCode2, Clock, GitCommit } from "lucide-react";
import Link from "next/link";

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return `Just now`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

const severityColors = {
  high: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  none: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const severityIcons = {
  high: <AlertCircle className="w-3.5 h-3.5" />,
  medium: <AlertTriangle className="w-3.5 h-3.5" />,
  low: <Info className="w-3.5 h-3.5" />,
  none: <CheckCircle2 className="w-3.5 h-3.5" />,
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
    async function fetchReviews() {
      try {
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

        setReviews(reviewsData);
        setRepositories(reposMap);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      const matchesSearch = 
        (review.file_path || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (review.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (review.ai_summary || "").toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesSeverity = 
        severityFilter === "all" || 
        (review.overall_severity && review.overall_severity.toLowerCase() === severityFilter);

      return matchesSearch && matchesSeverity;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [reviews, searchQuery, severityFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CLEAN': return <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Clean</span>;
      case 'REVALIDATED': return <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Revalidated</span>;
      case 'PR_CREATED': return <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400">PR Created</span>;
      case 'FAILED': return <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400">Failed</span>;
      default: return <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-6 w-6 animate-spin text-sky-500" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
          </svg>
          <span className="text-[13px] animate-pulse">Loading audit log...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 mb-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-[15px] font-medium text-slate-200">Failed to load history</h3>
          <p className="mt-2 text-[13px] text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="border-b border-white/5 bg-[#161b22] px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border border-white/10 bg-[#0d1016] py-2 pl-9 pr-3 text-[13px] text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
            placeholder="Search files, paths, or analysis summaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <select
              className="block w-full appearance-none rounded-md border border-white/10 bg-[#0d1016] py-2 pl-9 pr-8 text-[13px] text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer transition-colors"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="none">Clean</option>
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#0d1015]">
        {filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-slate-400 mb-5 shadow-inner">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-[16px] font-medium text-slate-200">No review logs found</h3>
            <p className="mt-2 text-[14px] text-slate-500 max-w-sm">
              {reviews.length === 0 ? "You haven't run any code reviews yet." : "No historical logs match your current search and filters."}
            </p>
          </div>
        ) : (
          <div className="min-w-[800px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#161b22]/50">
                  <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-[40%]">File & Analysis</th>
                  <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-[15%]">Severity</th>
                  <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-[15%]">Status</th>
                  <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-[15%]">Date</th>
                  <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-[15%] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReviews.map((review) => {
                  const repo = review.repository_id === "local" ? { repository_name: "Local Workspace" } : repositories[review.repository_id];
                  const repoName = repo ? repo.repository_name : `Repository #${review.repository_id}`;
                  const sev = (review.overall_severity || "none").toLowerCase();
                  const sevColor = severityColors[sev] || severityColors.none;
                  const sevIcon = severityIcons[sev] || severityIcons.none;
                  
                  return (
                    <tr key={review.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <FileCode2 className="h-4 w-4 text-sky-500/70" />
                            <span className="text-[14px] font-medium text-slate-200 group-hover:text-white transition-colors truncate max-w-md">
                              {review.file_path || review.title || "Unknown File"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="bg-[#2b313a]/50 px-1.5 py-0.5 rounded text-slate-400 uppercase tracking-wide">{repoName}</span>
                            {review.parent_review_id && (
                              <span className="flex items-center gap-1 text-purple-400/80 bg-purple-500/10 px-1.5 py-0.5 rounded">
                                <GitCommit className="h-3 w-3" /> Revalidation
                              </span>
                            )}
                          </div>
                          {review.ai_summary && (
                            <p className="text-[12px] text-slate-500 line-clamp-1 mt-1 group-hover:text-slate-400 transition-colors max-w-md">
                              {review.ai_summary}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 align-middle">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${sevColor}`}>
                          {sevIcon}
                          {sev}
                        </div>
                      </td>
                      <td className="py-4 px-6 align-middle">
                        {getStatusBadge(review.review_status)}
                      </td>
                      <td className="py-4 px-6 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] text-slate-300">{new Date(review.created_at).toLocaleDateString()}</span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {timeAgo(review.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 align-middle text-right">
                        <Link 
                          href={`/history/${review.id}`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#2b313a] hover:bg-sky-500 px-3 py-1.5 text-[12px] font-medium text-slate-300 hover:text-white transition-all shadow-sm hover:shadow-sky-500/20 group/btn"
                        >
                          View Details
                          <ChevronRight className="h-3.5 w-3.5 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" />
                        </Link>
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
