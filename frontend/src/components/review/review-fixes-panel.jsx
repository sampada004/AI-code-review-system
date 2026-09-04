import { useState, useRef, useEffect } from "react";
import { SparkIcon } from "./review-icons";
import dynamic from "next/dynamic";

const DiffModal = dynamic(() => import("./diff-modal"), { ssr: false });
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
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
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${severityTone[fix.severity] || severityTone.low}`}
            >
              {fix.severity} severity
            </div>
            {fix.isResolved === true && (
              <div className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Resolved
              </div>
            )}
            {fix.isResolved === false && (
              <div className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-rose-400">
                <AlertTriangle className="h-3 w-3" /> Unresolved
              </div>
            )}
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
        {fix.fixedCode && fix.onViewFix && (
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
        {onIgnore && (
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
        )}
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
  backgroundValidationReport = null,
  isBackgroundValidating = false,
  originalReview = null,
  onCreatePullRequest,
  isCreatingPR = false,
  createdPrData = null,
  modifiedFilesCount = 0,
  onOpenMultiFilePR = null,
  onReanalyze = null,
  isAnalyzing = false,
}) {
  const [selectedDiffData, setSelectedDiffData] = useState(null);
  const hasRun = !!summary || isHistoryMode || findings.length > 0;
  const activeFindings = findings.filter(f => !f.ignored);
  const hasFindings = activeFindings.length > 0;
  return (
    <aside
      onClick={collapsed ? onToggleCollapse : undefined}
      className={`flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-[#141821] shadow-xl transition-[width] duration-300 ease-out select-none ${
        collapsed ? "w-[56px] shrink-0 cursor-pointer hover:border-sky-500/40 hover:bg-[#181d28]" : "w-full"
      }`}
      title={collapsed ? "Click to expand AI Findings" : undefined}
    >
      <div className={`flex items-center border-b border-white/8 ${collapsed ? "justify-center p-3" : "justify-between gap-3 px-4 py-4"}`}>
        {!collapsed ? (
          <div>
            <div className="flex items-center gap-2">
              <div className="text-[12px] uppercase tracking-[0.18em] text-slate-400">
                AI Analysis
              </div>
              {overallSeverity !== "none" && (
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
        ) : null}

        <div className="flex items-center gap-1.5 shrink-0">
          {onReanalyze && !collapsed && (
            <button
              type="button"
              onClick={onReanalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1.5 text-[11px] font-medium text-sky-300 transition disabled:opacity-50"
              title="Re-run AI analysis on this file"
            >
              <RotateCw className={`h-3 w-3 ${isAnalyzing ? "animate-spin text-sky-400" : ""}`} />
              <span>{isAnalyzing ? "Analyzing..." : "Re-analyze"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            aria-label={
              collapsed
                ? "Expand AI Suggested Fixes"
                : "Collapse AI Suggested Fixes"
            }
            title={collapsed ? "Expand panel" : "Collapse panel"}
            className="grid h-8 w-8 place-items-center rounded-[4px] border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            {collapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {collapsed ? (
        <div className="flex flex-1 flex-col items-center justify-between py-6 text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <SparkIcon className="h-4 w-4" />
            </div>
            {findings.length > 0 ? (
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1.5 text-[10px] font-bold ${
                overallSeverity === "high" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                overallSeverity === "medium" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                "bg-sky-500/20 text-sky-300 border border-sky-500/30"
              }`}>
                {findings.length}
              </span>
            ) : (
              <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </div>

          <div className="rotate-90 whitespace-nowrap text-[11px] font-semibold uppercase tracking-widest text-slate-400 select-none">
            {findings.length > 0 ? `${findings.length} Issues` : "AI Review"}
          </div>

          <ChevronLeft className="h-4 w-4 text-slate-500" />
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

          {isBackgroundValidating && !validationReport && (
            <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              <span className="text-[12px] text-sky-400 font-medium">Validating syntax in background...</span>
            </div>
          )}

          {backgroundValidationReport?.status === "auto_resolved" && !validationReport && (
            <div className="px-4 py-3 border-b border-emerald-500/10 bg-emerald-500/[0.02]">
              <div className="rounded border border-emerald-500/30 bg-emerald-500/10 p-3 text-[13px] text-emerald-200">
                <div className="font-semibold text-emerald-400 flex items-center gap-2 mb-1">
                  <span className="text-lg">✨</span> Auto-Resolved!
                </div>
                A regression was detected after your fix, but the AI automatically resolved it for you.
                
                <div className="mt-3 space-y-2">
                  {backgroundValidationReport.newIssues.map((issue, idx) => (
                    <div key={idx} className="rounded bg-emerald-500/10 p-2 text-[12px] border border-emerald-500/20">
                      <span className="font-semibold">{issue.issue}</span>
                      <p className="mt-1 opacity-80">Automatically fixed: {issue.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {backgroundValidationReport?.status === "new_issues" && !validationReport && (
            <div className="px-4 py-3 border-b border-rose-500/10 bg-rose-500/[0.02]">
              <div className="rounded border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-200">
                <div className="font-semibold text-rose-400 flex items-center gap-2 mb-1">
                  <span className="text-lg">🚨</span> Regression Detected!
                </div>
                Your applied fix has introduced new syntax errors or bugs.
                
                <div className="mt-3 space-y-2">
                  {backgroundValidationReport.newIssues.map((issue, idx) => (
                    <div key={idx} className="rounded bg-rose-500/10 p-2 text-[12px] border border-rose-500/20">
                      <span className="font-semibold">{issue.issue}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onRevalidate}
                  disabled={isRevalidating}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded bg-rose-500/20 px-3 py-2 text-[12px] font-medium text-rose-300 transition hover:bg-rose-500/30 disabled:opacity-50"
                >
                  {isRevalidating ? "Analyzing..." : "Generate Fixes for Regression"}
                </button>
              </div>
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
              {validationReport.status === "new_issues" && (
                <div className="mb-3 rounded border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-200">
                  <div className="font-semibold text-rose-400 flex items-center gap-2 mb-1">
                    <span className="text-lg">🚨</span> Regression Detected!
                  </div>
                  Your applied fix has introduced new syntax errors or bugs. Please review the new findings below.
                </div>
              )}
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
                      isResolved: finding.isResolved,
                      onViewFix: isHistoryMode ? null : () => {
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
                    onUndo={isHistoryMode ? null : () => onUndoFix && onUndoFix(idx)}
                    onIgnore={isHistoryMode ? null : () => onIgnoreFix && onIgnoreFix(idx)}
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

      {!collapsed && (findings.length > 0 || validationReport || createdPrData) ? (
        <div className="border-t border-white/8 px-4 py-3 flex flex-col gap-2">
          {appliedFixes.size > 0 && !createdPrData && (
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

          {/* Show PR Created badge if PR was opened for this review; otherwise show Create PR button */}
          {createdPrData ? (
            <div className="rounded-[4px] border border-emerald-500/30 bg-emerald-500/10 p-3 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Pull Request Created</span>
              </div>
              <a
                href={createdPrData.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-sky-400 hover:underline"
              >
                <span>View PR on GitHub</span>
                <ChevronRight className="h-3 w-3" />
              </a>
            </div>
          ) : validationReport ? (
            <div className="space-y-2 mt-1">
              <div className="relative group">
                <button
                  type="button"
                  onClick={onCreatePullRequest}
                  disabled={validationReport.status !== "all_resolved" || isCreatingPR}
                  className="w-full flex items-center justify-center gap-2 rounded-[4px] bg-emerald-600 px-3 py-2 text-[13px] font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-900/20"
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
                    <>Create Pull Request (Current File)</>
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

              {modifiedFilesCount > 1 && onOpenMultiFilePR && (
                <button
                  type="button"
                  onClick={onOpenMultiFilePR}
                  className="w-full flex items-center justify-center gap-2 rounded-[4px] border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-[12px] font-medium text-emerald-300 transition"
                >
                  <span>Bundle All {modifiedFilesCount} Modified Files into PR</span>
                </button>
              )}
            </div>
          ) : null}

          <div className="text-[11px] text-slate-400 text-center">
            {createdPrData ? "PR opened on GitHub. Run a new analysis after pushing updates." : validationReport ? "Merge validated fixes directly to GitHub." : appliedFixes.size > 0 ? "Revalidate fixes to ensure they didn't introduce new issues." : "Apply fixes individually or finalize after review."}
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
