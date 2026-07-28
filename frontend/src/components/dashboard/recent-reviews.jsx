"use client";

import { useEffect, useState } from "react";

export default function RecentReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchReviews() {
      try {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
        const { apiUrl } = await import("@/lib/api");
        const res = await fetch(apiUrl(`/reviews`), {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) return;

        const contentType = res.headers.get("content-type") || "";
        let data = null;
        if (contentType.includes("application/json")) {
          data = await res.json();
        }

        if (data && data.reviews && mounted) {
          setReviews(data.reviews);
        }
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchReviews();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="rounded-xl border border-white/10 bg-[#161b22] p-6 shadow-sm transition-all duration-300 hover:border-white/20">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-[18px] font-semibold text-[#e7ebf2]">Recent AI Reviews</h3>
        <a href="/reviews" className="text-sm text-sky-400 transition hover:text-sky-300 hover:underline">View all</a>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-[13px] text-slate-500">
            <span className="animate-pulse">Loading reviews...</span>
          </div>
        ) : reviews.length > 0 ? (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="group flex items-start justify-between rounded-lg p-2 transition-all hover:bg-white/5 cursor-pointer">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#e8edf4] transition-colors group-hover:text-sky-300">
                    {r.title || `Review #${r.id}`}
                  </div>
                  <div className="mt-1 text-[13px] text-slate-400 truncate">
                    {r.language} • {r.review_status}
                  </div>
                </div>
                <div className="ml-4 text-right text-[12px] text-slate-500">
                  <div>{new Date(r.created_at).toLocaleDateString()}</div>
                  <div className={`mt-1 text-[13px] font-medium ${r.overall_severity === 'Critical' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {r.overall_severity || 'Analyzed'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white/5 text-slate-400 shadow-inner">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="mt-4 text-[13px] font-medium text-slate-300">No reviews yet</p>
            <p className="mt-1 text-[12px] text-slate-500">Head over to the Review Workspace to analyze some code.</p>
          </div>
        )}
      </div>
    </section>
  );
}
