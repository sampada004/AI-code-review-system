import { useState, useRef, useEffect } from "react";
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

function FixCard({ fix, isSelected, onClick, isApplied, onUndo, onIgnore }) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isSelected]);

  return (
    <article 
      ref={cardRef}
      onClick={onClick}
      className={`rounded-[2px] border bg-[#171b24] p-4 shadow-[0_10px_28px_rgba(0,0,0,0.22)] cursor-pointer transition-all duration-200 ${
        isSelected ? "border-sky-500/50 ring-1 ring-sky-500/50" : "border-[#3a404b] hover:border-[#4a5260]"
      }`}
    >
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
        {fix.suggestedFix && (
          <p className="mt-2 text-[12px] leading-relaxed text-slate-400 border-t border-white/5 pt-2">
            <span className="text-emerald-400 font-medium">Suggested Fix:</span>{" "}
            {fix.suggestedFix}
          </p>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {fix.fixedCode && (
          isApplied ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onUndo) onUndo();
              }}
              className="inline-flex flex-1 items-center justify-center rounded-[4px] border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-[12px] font-medium text-amber-400 transition hover:bg-amber-500/15"
            >
              Undo Fix
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (fix.onViewFix) fix.onViewFix();
              }}
              className="inline-flex flex-1 items-center justify-center rounded-[4px] border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-[12px] font-medium text-emerald-400 transition hover:bg-emerald-500/15"
            >
              View Fix
            </button>
          )
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onIgnore) onIgnore();
          }}
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
  selectedFindingIndex = null,
  onSelectFinding,
  appliedFixes = new Set(),
  onApplyFix,
  onUndoFix,
  onIgnoreFix,
  onRevalidate,
  isRevalidating = false,
  validationReport = null,
  originalReview = null,
  onCreatePullRequest,
  isCreatingPR = false,
}) {
  const [selectedDiffData, setSelectedDiffData] = useState(null);
  const hasRun = !!summary || isHistoryMode || findings.length > 0;
  const activeFindings = findings.filter(f => !f.ignored);
  const hasFindings = activeFindings.length > 0;
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

          {validationReport && (
            <div className="px-4 py-4 border-b border-white/5 bg-white/[0.02]">
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-3 flex items-center justify-between">
                <span>Validation Report</span>
                {validationReport.status === "all_resolved" && (
                  <span className="flex items-center gap-1 text-emerald-400 normal-case tracking-normal"><CheckCircle2 className="w-3 h-3"/> All Fixed</span>
                )}
                {validationReport.status === "partial" && (
                  <span className="flex items-center gap-1 text-amber-400 normal-case tracking-normal"><AlertTriangle className="w-3 h-3"/> Partial</span>
                )}
                {validationReport.status === "new_issues" && (
                  <span className="flex items-center gap-1 text-rose-400 normal-case tracking-normal"><AlertTriangle className="w-3 h-3"/> New Issues</span>
                )}
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-[12px] mb-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-2 text-emerald-300">
                  <div className="font-bold text-[14px]">{validationReport.resolved.length}</div>
                  <div className="opacity-80">Resolved</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded p-2 text-amber-300">
                  <div className="font-bold text-[14px]">{validationReport.remaining.length}</div>
                  <div className="opacity-80">Remaining</div>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded p-2 text-rose-300">
                  <div className="font-bold text-[14px]">{validationReport.newIssues.length}</div>
                  <div className="opacity-80">New</div>
                </div>
              </div>
              <div className="text-[12px] text-slate-400 flex items-center justify-between">
                <span>Severity Shift:</span>
                <span className="font-medium">
                  {validationReport.severityBefore} <span className="opacity-50 mx-1">→</span> {validationReport.severityAfter}
                </span>
              </div>
            </div>
          )}

          <div className={`px-3 py-4 ${!hasFindings ? "flex-1 flex flex-col justify-center min-h-[300px]" : "space-y-3"}`}>
            {findings.length > 0 ? (
              findings.map((finding, idx) => {
                if (finding.ignored) return null;
                return (
                  <FixCard
                    key={idx}
                    isSelected={selectedFindingIndex === idx}
                    onClick={() => onSelectFinding && onSelectFinding(idx)}
                    fix={{
                      title: finding.lineNumber
                        ? `Line ${finding.lineNumber}`
                        : "General Issue",
                      severity: finding.severity || "low",
                      issue: finding.issue,
                      recommendation: finding.recommendation,
                      originalCodeSnippet: finding.original_code_snippet || finding.originalCodeSnippet,
                      suggestedFix: finding.suggested_fix || finding.suggestedFix,
                      fixedCode: finding.fixed_code || finding.fixedCode,
                      onViewFix: () => {
                        if (onSelectFinding) onSelectFinding(idx);
                        setSelectedDiffData({
                          idx,
                          originalCode: finding.original_code_snippet || finding.originalCodeSnippet,
                          modifiedCode: finding.fixed_code || finding.fixedCode,
                          issue: finding.issue,
                          recommendation: finding.recommendation,
                          severity: finding.severity,
                        });
                      }
                    }}
                    isApplied={appliedFixes.has(idx)}
                    onUndo={() => onUndoFix && onUndoFix(idx)}
                    onIgnore={() => onIgnoreFix && onIgnoreFix(idx)}
                  />
                );
              })
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

      {!collapsed && (findings.length > 0 || validationReport) ? (
        <div className="border-t border-white/8 px-4 py-3 flex flex-col gap-2">
          {appliedFixes.size > 0 && (
            <button
              type="button"
              onClick={onRevalidate}
              disabled={isRevalidating}
              className="w-full flex items-center justify-center gap-2 rounded-[4px] bg-sky-600 px-3 py-2 text-[13px] font-medium text-white transition hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRevalidating ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                  </svg>
                  Re-validating...
                </>
              ) : (
                <>Revalidate Fixes</>
              )}
            </button>
          )}
          {validationReport && (
            <div className="relative group mt-1">
              <button
                type="button"
                onClick={onCreatePullRequest}
                disabled={validationReport.status !== "all_resolved" || isCreatingPR}
                className="w-full flex items-center justify-center gap-2 rounded-[4px] bg-emerald-600 px-3 py-2 text-[13px] font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingPR ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                    </svg>
                    Creating PR...
                  </>
                ) : (
                  <>Create Pull Request</>
                )}
              </button>
              {validationReport.status !== "all_resolved" && (
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100 z-50">
                  <div className="rounded border border-[#3a404b] bg-[#141821] px-3 py-2 text-center text-[11px] text-slate-300 shadow-xl">
                    Resolve all issues before opening a Pull Request.
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="text-[11px] text-slate-400 text-center">
            {validationReport ? "Merge validated fixes directly to GitHub." : appliedFixes.size > 0 ? "Revalidate fixes to ensure they didn't introduce new issues." : "Apply fixes individually or finalize after review."}
          </div>
        </div>
      ) : null}

      <DiffModal 
        isOpen={!!selectedDiffData}
        onClose={() => setSelectedDiffData(null)}
        originalCode={selectedDiffData?.originalCode}
        modifiedCode={selectedDiffData?.modifiedCode}
        issue={selectedDiffData?.issue}
        recommendation={selectedDiffData?.recommendation}
        severity={selectedDiffData?.severity}
        onApply={() => {
          if (onApplyFix && selectedDiffData?.idx !== undefined) {
            onApplyFix(selectedDiffData.idx);
          }
          setSelectedDiffData(null);
        }}
      />
    </aside>
  );
}
