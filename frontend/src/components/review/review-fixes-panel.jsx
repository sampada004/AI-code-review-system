import { suggestedFixes } from "./review-data";
import { SparkIcon } from "./review-icons";
import { ChevronLeft, ChevronRight } from "lucide-react";

const severityTone = {
  high: "border-rose-400/30 bg-rose-500/10 text-rose-200",
  medium: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  low: "border-sky-400/30 bg-sky-500/10 text-sky-200",
};

function FixCard({ fix }) {
  return (
    <article className="rounded-[2px] border border-[#3a404b] bg-[#171b24] p-4 shadow-[0_10px_28px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${severityTone[fix.severity]}`}
          >
            {fix.severity} severity
          </div>
          <h3 className="mt-3 text-[15px] font-semibold tracking-[-0.01em] text-[#e9edf5]">
            {fix.title}
          </h3>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300">
          <SparkIcon className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-slate-300">{fix.description}</p>
      <p className="mt-3 text-[11px] text-slate-500">{fix.file}</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center rounded-[4px] border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-[12px] font-medium text-sky-100 transition hover:bg-sky-500/15"
        >
          {fix.actionPrimary}
        </button>
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center rounded-[4px] border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-medium text-slate-200 transition hover:bg-white/10"
        >
          {fix.actionSecondary}
        </button>
      </div>
    </article>
  );
}

export function ReviewFixesPanel({ collapsed = false, onToggleCollapse }) {
  return (
    <aside
      className={`flex h-full min-h-[calc(100vh-180px)] flex-col overflow-hidden rounded-[2px] border border-[#3a404b] bg-[#141821] shadow-[0_16px_44px_rgba(0,0,0,0.35)] transition-[width] duration-300 ease-out ${
        collapsed ? "w-full xl:w-[56px]" : "w-full xl:w-[360px]"
      }`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/8 px-4 py-4">
        <div className={`${collapsed ? "opacity-0 pointer-events-none" : ""}`}>
          <div className="text-[12px] uppercase tracking-[0.18em] text-slate-400">AI Suggested Fixes</div>
          <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-[#e7ebf3]">
            Review Recommendations
          </h2>
          <p className="mt-1 text-[12px] text-slate-400">
            Suggested changes ranked by potential impact and confidence.
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand AI Suggested Fixes" : "Collapse AI Suggested Fixes"}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {collapsed ? (
        <div className="flex flex-1 flex-col items-center gap-4 py-4 text-slate-500">
          <SparkIcon className="h-5 w-5" />
          <div className="h-px w-6 bg-white/10" />
          <div className="h-2 w-2 rounded-full bg-sky-400/80" />
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
          {suggestedFixes.map((fix) => (
            <FixCard key={fix.title} fix={fix} />
          ))}
        </div>
      )}

      {!collapsed ? (
        <div className="border-t border-white/8 px-4 py-3 text-[11px] text-slate-400">
          Apply fixes individually or finalize after review.
        </div>
      ) : null}
    </aside>
  );
}
