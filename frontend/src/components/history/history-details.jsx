"use client";

import { useEffect, useState, useRef } from "react";
import { apiUrl } from "@/lib/api";
import { ReviewFixesPanel } from "@/components/review/review-fixes-panel";
import { AlertTriangle, ArrowLeft } from "lucide-react";
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

export default function HistoryDetails({ reviewId }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const editorHostRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const [isFixesCollapsed, setIsFixesCollapsed] = useState(false);

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

        setReview(data.review);
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

    const language = getLanguageFromFilename(review.file_path || review.title);

    const uri = monaco.Uri.parse('inmemory://history-editor');
    
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

    return () => {
      // Do NOT dispose model, just let it be reused next time.
      // This permanently solves the web worker "Missing requestHandler" race conditions.
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose();
      }
    };
  }, [review]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-6 w-6 animate-spin text-sky-500" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
          </svg>
          <span className="text-[13px]">Loading review details...</span>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-[15px] font-medium text-slate-200">Failed to load review</h3>
        <p className="mt-2 text-[13px] text-slate-400">{error || "Review not found"}</p>
        <Link href="/history" className="mt-6 text-sky-400 hover:text-sky-300 text-[13px]">
          ← Back to History
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1015] border border-white/10 rounded-[4px] overflow-hidden">
      <div className="border-b border-white/10 bg-[#161b22] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/history" className="text-slate-400 hover:text-white transition-colors p-1">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div>
            <div className="text-[13px] font-medium text-[#e8edf4]">
              {review.file_path || review.title || "Unknown File"}
            </div>
            {review.repository_id && (
              <div className="text-[11px] text-slate-500 mt-0.5">Repo ID: {review.repository_id}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[12px] text-slate-400">
            {new Date(review.created_at).toLocaleString()}
          </div>
          <div className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[11px] font-medium text-slate-300">
            Read-Only
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 relative border-r border-[#3a404b]">
          <div ref={editorHostRef} className="absolute inset-0" />
        </div>
        
        <div className="relative shrink-0 flex flex-col h-full overflow-hidden transition-[width] duration-300" style={{ width: isFixesCollapsed ? '56px' : '360px' }}>
          <ReviewFixesPanel 
            collapsed={isFixesCollapsed} 
            onToggleCollapse={() => setIsFixesCollapsed(!isFixesCollapsed)} 
            findings={review.findings || []}
            summary={review.ai_summary || ""}
            overallSeverity={review.overall_severity || "none"}
            isHistoryMode={true}
          />
        </div>
      </div>
    </div>
  );
}
