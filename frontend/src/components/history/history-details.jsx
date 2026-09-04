"use client";

import { useEffect, useState, useRef } from "react";
import { apiUrl } from "@/lib/api";
import { ReviewFixesPanel } from "@/components/review/review-fixes-panel";
import {
  AlertTriangle,
  ArrowLeft,
  GitPullRequest,
  ExternalLink,
  FileCode2,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  GitCommit,
  Sparkles,
  Layers
} from "lucide-react";
import Link from "next/link";
import * as monaco from "monaco-editor";

function getLanguageFromFilename(fileName) {
  if (!fileName) return "plaintext";
  const ext = fileName.split(".").pop().toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "json":
      return "json";
    case "html":
      return "html";
    case "css":
      return "css";
    case "md":
      return "markdown";
    case "py":
      return "python";
    case "java":
      return "java";
    case "cpp":
    case "cc":
    case "cxx":
      return "cpp";
    case "c":
      return "c";
    case "cs":
      return "csharp";
    case "php":
      return "php";
    default:
      return "plaintext";
  }
}

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const tokenize = (s) => s.toLowerCase().match(/\w+/g) || [];
  const tokens1 = new Set(tokenize(str1));
  const tokens2 = new Set(tokenize(str2));
  let intersection = 0;
  tokens1.forEach(t => { if (tokens2.has(t)) intersection++; });
  const union = tokens1.size + tokens2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const severityColors = {
  high: "text-rose-400 bg-rose-500/10 border-rose-500/25",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  low: "text-sky-400 bg-sky-500/10 border-sky-500/25",
  none: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
};

export default function HistoryDetails({ reviewId }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [latestReview, setLatestReview] = useState(null);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [isFixesCollapsed, setIsFixesCollapsed] = useState(false);
  const [validationReport, setValidationReport] = useState(null);
  const editorHostRef = useRef(null);
  const editorInstanceRef = useRef(null);

  useEffect(() => {
    async function fetchReview() {
      try {
        let token = null;
        try {
          token = window.localStorage.getItem("auth_token");
        } catch (e) {}

        const res = await fetch(apiUrl(`/reviews/${reviewId}`), {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load review details");
        }

        if (data.latestReview && data.latestReview.id !== data.review.id) {
          setLatestReview(data.latestReview);
          setIsDiffMode(true); // Default to diff mode if there's a difference
          const originalFindings = data.review.findings || [];
          const newFindings = data.latestReview.findings || [];
          
          const resolved = [];
          const remaining = [];
          const newIssues = [];
          
          originalFindings.forEach(orig => {
            if (orig.ignored) {
              orig.isResolved = true;
              resolved.push(orig);
              return;
            }
            const match = newFindings.find(nf => {
              const str1 = orig.issue + " " + (orig.recommendation || "");
              const str2 = nf.issue + " " + (nf.recommendation || "");
              return calculateSimilarity(str1, str2) > 0.25;
            });
            if (match) {
              orig.isResolved = false;
              remaining.push(match);
            } else {
              orig.isResolved = true;
              resolved.push(orig);
            }
          });
          
          newFindings.forEach(nf => {
            const match = originalFindings.find(orig => {
              const str1 = orig.issue + " " + (orig.recommendation || "");
              const str2 = nf.issue + " " + (nf.recommendation || "");
              return calculateSimilarity(str1, str2) > 0.25;
            });
            if (!match) {
              newIssues.push(nf);
            }
          });
          
          let status = "all_resolved";
          if (newIssues.length > 0) status = "new_issues";
          else if (remaining.length > 0) status = "partial";
          
          setValidationReport({
            status,
            resolved,
            remaining,
            newIssues,
            severityBefore: data.review.overall_severity,
            severityAfter: data.latestReview.overall_severity || "none"
          });
          
          // Re-set review with augmented findings
          setReview({ ...data.review, findings: originalFindings });
        } else {
          setReview(data.review);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (reviewId) {
      fetchReview();
    }
  }, [reviewId]);

  useEffect(() => {
    if (!editorHostRef.current || !review) return;

    // Clear previous editor instance if any
    if (editorInstanceRef.current) {
      editorInstanceRef.current.dispose();
      editorInstanceRef.current = null;
    }

    const language = getLanguageFromFilename(review.file_path || review.title);

    if (isDiffMode && latestReview) {
      const originalUri = monaco.Uri.parse(`inmemory://history-editor-original-${review.id}`);
      const modifiedUri = monaco.Uri.parse(`inmemory://history-editor-modified-${latestReview.id}`);
      
      let originalModel = monaco.editor.getModel(originalUri);
      if (!originalModel) {
        originalModel = monaco.editor.createModel(review.source_code || "// No source code available", language, originalUri);
      } else {
        originalModel.setValue(review.source_code || "// No source code available");
        monaco.editor.setModelLanguage(originalModel, language);
      }

      let modifiedModel = monaco.editor.getModel(modifiedUri);
      if (!modifiedModel) {
        modifiedModel = monaco.editor.createModel(latestReview.source_code || "// No source code available", language, modifiedUri);
      } else {
        modifiedModel.setValue(latestReview.source_code || "// No source code available");
        monaco.editor.setModelLanguage(modifiedModel, language);
      }

      const diffEditor = monaco.editor.createDiffEditor(editorHostRef.current, {
        theme: "vs-dark",
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
        padding: { top: 16, bottom: 16 },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        renderLineHighlight: "all",
        lineNumbersMinChars: 3,
        ignoreTrimWhitespace: false,
      });

      diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel
      });

      editorInstanceRef.current = diffEditor;
    } else {
      const uri = monaco.Uri.parse(`inmemory://history-editor-${review.id}`);
      
      let model = monaco.editor.getModel(uri);
      if (!model) {
        model = monaco.editor.createModel(review.source_code || "// No source code available", language, uri);
      } else {
        model.setValue(review.source_code || "// No source code available");
        monaco.editor.setModelLanguage(model, language);
      }

      editorInstanceRef.current = monaco.editor.create(editorHostRef.current, {
        model: model,
        theme: "vs-dark",
        readOnly: true,
        minimap: { enabled: true },
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
        padding: { top: 16, bottom: 16 },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        renderLineHighlight: "all",
        lineNumbersMinChars: 3,
        inlayHints: { enabled: "off" },
        colorDecorators: false,
        hover: { enabled: false },
      });
    }

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose();
        editorInstanceRef.current = null;
      }
    };
  }, [review, isDiffMode, latestReview]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[450px] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-sky-500/20 border-t-sky-500 animate-spin" />
          <span className="text-[13px] text-slate-300 animate-pulse">Loading review snapshot...</span>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-[16px] font-medium text-slate-200">Failed to load review snapshot</h3>
        <p className="mt-2 text-[13px] text-slate-400">{error || "Review not found"}</p>
        <Link 
          href="/history" 
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#222834] px-4 py-2 text-sky-400 hover:text-sky-300 text-[13px] font-medium border border-white/5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to History
        </Link>
      </div>
    );
  }

  const sev = (review.overall_severity || "none").toLowerCase();
  const sevColor = severityColors[sev] || severityColors.none;
  const hasPr = Boolean(review.pr_url || review.pr_number || review.review_status === "PR_CREATED");
  const createdPrData = hasPr ? {
    prUrl: review.pr_url || "#",
    prNumber: review.pr_number,
    branchName: "main"
  } : null;

  return (
    <div className="flex flex-col h-full bg-[#0d1015] border border-white/10 rounded-[6px] overflow-hidden shadow-2xl">
      {/* Top Header Bar */}
      <div className="border-b border-white/10 bg-[#161b22] px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link 
            href="/history" 
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Back to History"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded bg-slate-800 border border-white/5 shrink-0">
              <FileCode2 className="h-4 w-4 text-sky-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-white truncate max-w-xs md:max-w-md">
                  {review.file_path || review.title || "Unknown File"}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${sevColor}`}>
                  {sev}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                {review.repository_id && (
                  <span className="font-mono text-slate-400">Repo #{review.repository_id}</span>
                )}
                {review.parent_review_id && (
                  <span className="text-purple-400 flex items-center gap-1">
                    <GitCommit className="h-2.5 w-2.5" /> Revalidation of #{review.parent_review_id}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & PR Link */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pull Request Badge / Button */}
          {hasPr && (
            review.pr_url ? (
              <a
                href={review.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 text-[12px] font-medium transition-all shadow-sm group"
                title="View Pull Request on GitHub"
              >
                <GitPullRequest className="h-3.5 w-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>{review.pr_number ? `Pull Request #${review.pr_number}` : "View PR on GitHub"}</span>
                <ExternalLink className="h-3 w-3 opacity-70 group-hover:opacity-100" />
              </a>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[12px] font-medium">
                <GitPullRequest className="h-3.5 w-3.5 text-purple-400" />
                <span>PR Created</span>
              </div>
            )
          )}

          {/* Timestamp */}
          <div className="text-[12px] text-slate-400 hidden sm:flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/5">
            <Clock className="h-3 w-3 text-slate-500" />
            {(() => {
              const str = String(review.created_at || "").trim();
              const isoStr = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(str) && !str.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(str) ? str.replace(" ", "T") + "Z" : str;
              const d = new Date(isoStr);
              return !isNaN(d.getTime()) ? d.toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : review.created_at;
            })()}
          </div>

          {/* Diff Mode Toggle (if revalidation chain exists) */}
          {latestReview && (
            <button
              onClick={() => setIsDiffMode(!isDiffMode)}
              className={`px-3 py-1.5 rounded-md border text-[12px] font-medium transition-all ${
                isDiffMode 
                  ? "border-sky-500/50 bg-sky-500/15 text-sky-300 shadow-sm" 
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {isDiffMode ? "Viewing Diff (Original vs Latest)" : "Compare with Latest"}
            </button>
          )}

          <div className="px-2.5 py-1 rounded border border-white/10 bg-white/5 text-[11px] font-medium text-slate-400">
            Snapshot Mode
          </div>
        </div>
      </div>

      {/* Editor & AI Findings Sidebar */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 relative border-r border-[#3a404b]">
          <div ref={editorHostRef} className="absolute inset-0" />
        </div>
        
        <div 
          className="relative shrink-0 flex flex-col h-full overflow-hidden transition-[width] duration-300 bg-[#141821]" 
          style={{ width: isFixesCollapsed ? '56px' : '380px' }}
        >
          <ReviewFixesPanel 
            collapsed={isFixesCollapsed} 
            onToggleCollapse={() => setIsFixesCollapsed(!isFixesCollapsed)} 
            findings={review.findings || []}
            summary={review.ai_summary || ""}
            overallSeverity={review.overall_severity || "none"}
            isHistoryMode={true}
            validationReport={validationReport}
            createdPrData={createdPrData}
            originalReview={review}
          />
        </div>
      </div>
    </div>
  );
}
