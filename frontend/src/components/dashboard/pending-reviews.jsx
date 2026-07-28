"use client";

import { CheckCircle2 } from "lucide-react";

export default function PendingReviews() {
  return (
    <section className="rounded-xl border border-white/10 bg-[#161b22] p-6 shadow-sm transition-all duration-300 hover:border-white/20">
      <div className="flex items-center justify-between px-2">
        <h4 className="font-semibold text-[#e7ebf2]">Pending Reviews</h4>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center py-6 text-center">
        <div className="relative grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <CheckCircle2 className="h-7 w-7" />
          <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-pulse" />
        </div>
        <p className="mt-4 text-[14px] font-medium text-[#e8edf4]">All caught up!</p>
        <p className="mt-1 px-4 text-[13px] text-slate-400 leading-relaxed">
          No pending pull requests or reviews require your attention right now.
        </p>
      </div>
    </section>
  );
}
