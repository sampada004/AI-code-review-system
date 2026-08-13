"use client";

import { useEffect, useState } from "react";
import { ChevronRight, ExternalLink, Search, Filter, Clock, FileCode2, AlertCircle } from "lucide-react";
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

export default function RecentReviews() {
  const [reviews, setReviews] = useState([]);
  const [repositories, setRepositories] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

        if (mounted) {
          setReviews(reviewsData);
          setRepositories(reposMap);
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

  const activeIssues = reviews.filter(r => ['PENDING', 'COMPLETED', 'FAILED'].includes(r.review_status)).length;
  const prsCreated = reviews.filter(r => r.review_status === 'PR_CREATED').length;

  const filteredReviews = reviews.filter(r => {
    const searchString = `${r.file_path || ''} ${r.title || ''} ${r.ai_summary || ''}`.toLowerCase();
    const matchesSearch = !searchQuery || searchString.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || r.review_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group by repository
  const grouped = filteredReviews.reduce((acc, review) => {
    const key = review.repository_id || "local";
    if (!acc[key]) acc[key] = [];
    acc[key].push(review);
    return acc;
  }, {});

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/20">High</span>;
      case 'medium':
        return <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">Medium</span>;
      case 'low':
        return <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-500/20">Low</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CLEAN':
        return <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Clean</span>;
      case 'REVALIDATED':
        return <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Revalidated</span>;
      case 'PR_CREATED':
        return <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400">PR Created</span>;
      case 'FAILED':
        return <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400">Failed</span>;
      default:
        return <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">Action Required</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#2b313a] bg-[#161b22] p-5 shadow-sm hover:border-[#3b424d] transition-colors">
          <div className="text-[12px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <FileCode2 className="h-4 w-4" /> Files Analyzed
          </div>
          <div className="mt-2 text-3xl font-light text-white">{reviews.length}</div>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 shadow-sm">
          <div className="text-[12px] font-medium text-amber-500/70 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Needs Attention
          </div>
          <div className="mt-2 text-3xl font-light text-amber-400">{activeIssues}</div>
        </div>
        <div className="rounded-xl border border-[#2b313a] bg-[#161b22] p-5 shadow-sm hover:border-[#3b424d] transition-colors">
          <div className="text-[12px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <ExternalLink className="h-4 w-4" /> PRs Generated
          </div>
          <div className="mt-2 text-3xl font-light text-purple-400">{prsCreated}</div>
        </div>
      </div>

      <section className="rounded-xl border border-[#2b313a] bg-[#161b22] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="font-serif text-[18px] font-semibold text-[#e7ebf2]">Review History</h3>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search reviews or summaries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-[#2b313a] bg-[#0d1117] pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="relative w-full sm:w-40">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-md border border-[#2b313a] bg-[#0d1117] pl-9 pr-8 py-1.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Action Required</option>
                <option value="CLEAN">Clean</option>
                <option value="REVALIDATED">Revalidated</option>
                <option value="PR_CREATED">PR Created</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[13px] text-slate-500">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              <span className="animate-pulse">Loading review history...</span>
            </div>
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(grouped).map(([repoId, repoReviews]) => {
              const repo = repoId === "local" ? { repository_name: "Local Workspace" } : repositories[repoId];
              const repoName = repo ? repo.repository_name : `Repository #${repoId}`;

              return (
                <div key={repoId} className="rounded-lg border border-[#2b313a] bg-[#0d1117] overflow-hidden">
                  <div className="bg-[#161b22] px-4 py-3 border-b border-[#2b313a] flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-200">{repoName}</div>
                    <div className="text-[11px] font-medium text-slate-500 bg-[#2b313a] px-2 py-0.5 rounded-full">{repoReviews.length} session{repoReviews.length !== 1 ? 's' : ''}</div>
                  </div>
                  <ul className="divide-y divide-[#2b313a]">
                    {repoReviews.map((r) => (
                      <li key={r.id} className="flex flex-col p-4 transition-colors hover:bg-white/[0.02]">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[15px] font-medium text-[#e8edf4] truncate">
                                {r.file_path || r.title || 'Unknown File'}
                              </span>
                              {getSeverityBadge(r.overall_severity)}
                              {getStatusBadge(r.review_status)}
                            </div>
                            
                            {r.ai_summary && (
                              <p className="text-[13px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                {r.ai_summary}
                              </p>
                            )}
                            
                            <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {timeAgo(r.updated_at || r.created_at)}
                              </div>
                              {r.pr_url && (
                                <a href={r.pr_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-400 hover:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">
                                  <ExternalLink className="h-3 w-3" />
                                  PR #{r.pr_number}
                                </a>
                              )}
                            </div>
                          </div>
                          
                          <div className="shrink-0 flex items-center">
                            {r.repository_id && r.file_path ? (
                              <Link 
                                href={`/dashboard?repoId=${r.repository_id}&file=${encodeURIComponent(r.file_path)}`} 
                                className="group flex items-center justify-center gap-2 rounded-md bg-[#2b313a] hover:bg-sky-500 px-4 py-2 text-[12px] font-medium text-slate-300 hover:text-white transition-all duration-200 shadow-sm"
                              >
                                Resume Review
                                <ChevronRight className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-[#0d1117] rounded-lg border border-dashed border-[#2b313a]">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#161b22] text-slate-500 shadow-inner mb-4">
              <FileCode2 className="h-8 w-8" />
            </div>
            <p className="text-[15px] font-medium text-slate-300">No matching reviews found</p>
            <p className="mt-1.5 text-[13px] text-slate-500 max-w-sm">
              {searchQuery || statusFilter !== "ALL" 
                ? "Try adjusting your search query or status filters to find what you're looking for."
                : "Head over to the Review Workspace and select a repository to analyze some code."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
