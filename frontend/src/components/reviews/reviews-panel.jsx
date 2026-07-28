"use client";

"use client";

import React from "react";
import RecentReviews from "@/components/dashboard/recent-reviews";
import { useRouter } from "next/navigation";

export default function ReviewsPanel() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-[#38404d] bg-[#161a22] px-6 py-4">
        <div className="flex gap-3">
          <input
            placeholder="owner/repo or https://github.com/owner/repo"
            className="flex-1 rounded-md border border-[#2b313a] bg-[#0f1418] px-3 py-2 text-slate-200 placeholder:text-slate-500"
            disabled
          />
          <button
            type="button"
            onClick={() => router.push("/add-repository")}
            className="inline-flex items-center rounded-md bg-[#0f68d9] px-4 py-2 text-sm font-medium text-white hover:bg-[#1777f0]"
          >
            Add Repository
          </button>
        </div>
      </div>

      <RecentReviews />
    </div>
  );
}
