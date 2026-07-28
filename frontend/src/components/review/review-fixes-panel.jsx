import { useState } from "react";
import { SparkIcon } from "./review-icons";
import dynamic from "next/dynamic";

const DiffModal = dynamic(() => import("./diff-modal"), { ssr: false });
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const severityTone = {
  high: "border-rose-400/30 bg-rose-500/10 text-rose-200",
  medium: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  low: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  none: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
};

function FixCard({ fix }) {
  return (
    <article className="rounded-[2px] border border-[#3a404b] bg-[#171b24] p-4 shadow-[0_10px_28px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${severityTone[fix.severity] || severityTone.low}`}
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

      <p className="mt-3 text-[13px] font-medium leading-relaxed text-slate-200">
        {fix.issue}
      </p>
      <div className="mt-2 rounded bg-white/5 p-3">
        <p className="text-[12px] leading-relaxed text-slate-400">
          <span className="text-sky-400 font-medium">Recommendation:</span>{" "}
          {fix.recommendation}
        </p>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {fix.suggestedFix ? (
          <button
            type="button"
            onClick={() => fix.onViewFix && fix.onViewFix()}
            className="inline-flex flex-1 items-center justify-center rounded-[4px] border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-[12px] font-medium text-emerald-400 transition hover:bg-emerald-500/15"
          >
            View Fix
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center rounded-[4px] border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-[12px] font-medium text-sky-100 transition hover:bg-sky-500/15"
          >
            Apply Fix
          </button>
        )}
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center rounded-[4px] border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-medium text-slate-200 transition hover:bg-white/10"
        >
          Ignore
        </button>
      </div>
    </article>
  );
}

export function ReviewFixesPanel({
  collapsed = false,
  onToggleCollapse,
  findings = [],
  summary = "",
  overallSeverity = "none",
  isHistoryMode = false,
}) {
  const [selectedDiffData, setSelectedDiffData] = useState(null);
  const hasRun = !!summary || isHistoryMode || findings.length > 0;
  const hasFindings = findings.length > 0;
  return (
    <aside
      className={`flex h-full min-h-[calc(100vh-180px)] flex-col overflow-hidden rounded-[2px] border border-[#3a404b] bg-[#141821] shadow-[0_16px_44px_rgba(0,0,0,0.35)] transition-[width] duration-300 ease-out ${
        collapsed ? "w-full xl:w-[56px]" : "w-full xl:w-[360px]"
      }`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/8 px-4 py-4">
        <div className={`${collapsed ? "opacity-0 pointer-events-none" : ""}`}>
          <div className="flex items-center gap-2">
            <div className="text-[12px] uppercase tracking-[0.18em] text-slate-400">
              AI Analysis
            </div>
            {overallSeverity !== "none" && !collapsed && (
              <span
                className={`inline-block w-2 h-2 rounded-full ${overallSeverity === "high" ? "bg-rose-500" : overallSeverity === "medium" ? "bg-amber-500" : "bg-sky-500"}`}
              />
            )}
          </div>
          <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-[#e7ebf3]">
            {hasFindings 
              ? "Review Recommendations" 
              : hasRun 
                ? "Analysis Complete"
                : "AI Code Review"}
          </h2>
          <p className="mt-1 text-[12px] text-slate-400">
            {hasFindings 
              ? "Suggested changes ranked by potential impact."
              : hasRun
                ? "No code issues were detected."
                : "Run an analysis to get AI suggestions."}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={
            collapsed
              ? "Expand AI Suggested Fixes"
              : "Collapse AI Suggested Fixes"
          }
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          {collapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {collapsed ? (
        <div className="flex flex-1 flex-col items-center gap-4 py-4 text-slate-500">
          <SparkIcon className="h-5 w-5" />
          <div className="h-px w-6 bg-white/10" />
          <div
            className={`h-2 w-2 rounded-full ${overallSeverity === "high" ? "bg-rose-500/80" : overallSeverity === "medium" ? "bg-amber-500/80" : overallSeverity === "low" ? "bg-sky-500/80" : "bg-emerald-500/80"}`}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {summary && (
            <div className="px-4 py-4 border-b border-white/5 bg-white/[0.02]">
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Analysis Summary
              </h4>
              <p className="text-[13px] leading-relaxed text-slate-300">
                {summary}
              </p>
            </div>
          )}

          <div className={`px-3 py-4 ${!hasFindings ? "flex-1 flex flex-col justify-center min-h-[300px]" : "space-y-3"}`}>
            {findings.length > 0 ? (
              findings.map((finding, idx) => (
                <FixCard
                  key={idx}
                  fix={{
                    title: finding.lineNumber
                      ? `Line ${finding.lineNumber}`
                      : "General Issue",
                    severity: finding.severity || "low",
                    issue: finding.issue,
                    recommendation: finding.recommendation,
                    originalCodeSnippet: finding.original_code_snippet || finding.originalCodeSnippet,
                    suggestedFix: finding.suggested_fix || finding.suggestedFix,
                    onViewFix: () => setSelectedDiffData({
                      originalCode: finding.original_code_snippet || finding.originalCodeSnippet,
                      modifiedCode: finding.suggested_fix || finding.suggestedFix,
                    })
                  }}
                />
              ))
            ) : summary || isHistoryMode ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-400 mb-4">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-[15px] font-medium text-slate-200">
                  {isHistoryMode ? "No Findings Recorded" : "No Issues Found"}
                </h3>
                <p className="mt-2 text-[13px] text-slate-400">
                  {isHistoryMode 
                    ? "There were no specific code issues logged for this historical review."
                    : "The AI did not find any critical bugs or security vulnerabilities in this file."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-white/5 text-slate-400 mb-4">
                  <SparkIcon className="h-5 w-5" />
                </div>
                <h3 className="text-[15px] font-medium text-slate-200">
                  Run Analysis
                </h3>
                <p className="mt-2 text-[13px] text-slate-400">
                  Click the Analyze Code button to scan this file for issues.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!collapsed && findings.length > 0 ? (
        <div className="border-t border-white/8 px-4 py-3 text-[11px] text-slate-400">
          Apply fixes individually or finalize after review.
        </div>
      ) : null}

      <DiffModal 
        isOpen={!!selectedDiffData}
        onClose={() => setSelectedDiffData(null)}
        originalCode={selectedDiffData?.originalCode}
        modifiedCode={selectedDiffData?.modifiedCode}
      />
    </aside>
  );
}
