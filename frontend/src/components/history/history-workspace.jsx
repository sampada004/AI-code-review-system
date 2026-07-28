"use client";

import { useState, useEffect, useMemo } from "react";
import { apiUrl } from "@/lib/api";
import { Search, Filter, AlertTriangle, CheckCircle2, AlertCircle, Info } from "lucide-react";
import Link from "next/link";

const severityColors = {
  high: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  none: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const severityIcons = {
  high: <AlertCircle className="w-4 h-4" />,
  medium: <AlertTriangle className="w-4 h-4" />,
  low: <Info className="w-4 h-4" />,
  none: <CheckCircle2 className="w-4 h-4" />,
};

export default function HistoryWorkspace() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    async function fetchReviews() {
      try {
        let token = null;
        try {
          token = window.localStorage.getItem("auth_token");
        } catch (e) {}

        const res = await fetch(apiUrl("/reviews"), {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load reviews");
        }

        setReviews(data.reviews || []);
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
      // Search by file path or title
      const matchesSearch = 
        (review.file_path || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (review.title || "").toLowerCase().includes(searchQuery.toLowerCase());
        
      // Filter by severity
      const matchesSeverity = 
        severityFilter === "all" || 
        (review.overall_severity && review.overall_severity.toLowerCase() === severityFilter);

      return matchesSearch && matchesSeverity;
    });
  }, [reviews, searchQuery, severityFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-6 w-6 animate-spin text-sky-500" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
          </svg>
          <span className="text-[13px]">Loading history...</span>
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
    <div className="flex flex-col h-full">
      <div className="border-b border-white/10 bg-[#161b22] px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            className="block w-full rounded-[4px] border border-white/10 bg-[#0d1016] py-2 pl-9 pr-3 text-[13px] text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Search by file or repo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            className="block w-full sm:w-auto rounded-[4px] border border-white/10 bg-[#0d1016] py-2 pl-3 pr-8 text-[13px] text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="all">All Severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-400 mb-4">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-[15px] font-medium text-slate-200">No reviews found</h3>
            <p className="mt-2 text-[13px] text-slate-400">
              {reviews.length === 0 ? "You haven't run any code reviews yet." : "No reviews match your current filters."}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-[#161b22]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider">File</th>
                <th scope="col" className="px-6 py-3 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider">Severity</th>
                <th scope="col" className="px-6 py-3 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#0d1015]">
              {filteredReviews.map((review) => {
                const sev = (review.overall_severity || "none").toLowerCase();
                const sevColor = severityColors[sev] || severityColors.none;
                const sevIcon = severityIcons[sev] || severityIcons.none;
                
                return (
                  <tr key={review.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/history/${review.id}`} className="block">
                        <div className="flex items-center">
                          <div className="text-[13px] font-medium text-slate-200 group-hover:text-sky-400 transition-colors">
                            {review.file_path || review.title || "Unknown File"}
                          </div>
                        </div>
                        {review.repository_id && (
                          <div className="text-[11px] text-slate-500 mt-1">Repo ID: {review.repository_id}</div>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium uppercase tracking-wide ${sevColor}`}>
                        {sevIcon}
                        {sev}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {review.review_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[12px] text-slate-400">
                      {new Date(review.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
