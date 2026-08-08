"use client";

import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { X, Code2 } from "lucide-react";
import { SparkIcon } from "./review-icons";

export default function DiffModal({
  isOpen,
  onClose,
  originalCode,
  modifiedCode,
  issue,
  recommendation,
  severity,
  onApply,
  language = "javascript",
  title = "AI Suggested Fix",
}) {
  const editorHostRef = useRef(null);
  const diffEditorRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !editorHostRef.current) return;

    // Define a custom, subtle theme for the diff editor so it's less "heavy" with colors
    monaco.editor.defineTheme('subtle-diff-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'diffEditor.insertedTextBackground': '#10b98125', // subtle emerald
        'diffEditor.removedTextBackground': '#f43f5e25', // subtle rose
        'diffEditor.insertedLineBackground': '#10b98110',
        'diffEditor.removedLineBackground': '#f43f5e10',
        'editor.background': '#0d1016',
      }
    });

    // Create the diff editor
    diffEditorRef.current = monaco.editor.createDiffEditor(editorHostRef.current, {
      theme: "subtle-diff-theme",
      readOnly: true,
      renderSideBySide: true,
      minimap: { enabled: false },
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
      padding: { top: 16, bottom: 16 },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      renderLineHighlight: "all",
      lineNumbersMinChars: 3,
      enableSplitViewResizing: false,
      ignoreTrimWhitespace: false,
      inlayHints: { enabled: "off" },
      colorDecorators: false,
      hover: { enabled: false },
    });

    const originalUri = monaco.Uri.parse('inmemory://diff-original');
    const modifiedUri = monaco.Uri.parse('inmemory://diff-modified');
    
    let originalModel = monaco.editor.getModel(originalUri);
    if (!originalModel) {
      originalModel = monaco.editor.createModel(originalCode || "// No original code provided", language, originalUri);
    } else {
      originalModel.setValue(originalCode || "// No original code provided");
      monaco.editor.setModelLanguage(originalModel, language);
    }

    let modifiedModel = monaco.editor.getModel(modifiedUri);
    if (!modifiedModel) {
      modifiedModel = monaco.editor.createModel(modifiedCode || "// No suggested fix provided", language, modifiedUri);
    } else {
      modifiedModel.setValue(modifiedCode || "// No suggested fix provided");
      monaco.editor.setModelLanguage(modifiedModel, language);
    }

    diffEditorRef.current.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    return () => {
      // Do NOT dispose models, just let them be reused next time the modal opens.
      // This permanently solves the web worker "Missing requestHandler" race conditions.
      if (diffEditorRef.current) {
        diffEditorRef.current.dispose();
      }
    };
  }, [isOpen, originalCode, modifiedCode, language]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#000000]/80 backdrop-blur-sm transition-opacity">
      <div className="relative flex flex-col w-full max-w-6xl h-[85vh] bg-[#0d1015] border border-[#3a404b] rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#161b22]">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-md border border-sky-400/20 bg-sky-500/10 text-sky-400">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#e8edf4]">
                {title}
              </h3>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Review side-by-side changes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-[11px] font-medium tracking-wide uppercase text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500/80" />
                Original
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
                Suggested Fix
              </div>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Explanation Panel for Junior Developers */}
        {(issue || recommendation) && (
          <div className="bg-[#11151c] border-b border-white/10 px-5 py-4 shrink-0">
            <h4 className="text-[13px] font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <SparkIcon className="h-4 w-4 text-sky-400" />
              Developer Explanation
            </h4>
            <div className="space-y-2">
              {issue && (
                <p className="text-[13px] leading-relaxed text-slate-300">
                  <span className="text-rose-400 font-medium mr-1">Issue:</span> 
                  {issue}
                </p>
              )}
              {recommendation && (
                <p className="text-[13px] leading-relaxed text-slate-300">
                  <span className="text-emerald-400 font-medium mr-1">Recommendation:</span> 
                  {recommendation}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Diff Editor Container */}
        <div className="flex-1 relative bg-[#0d1016]">
          <div ref={editorHostRef} className="absolute inset-0" />
        </div>
        
        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#161b22] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors"
          >
            Cancel
          </button>
          {onApply && (
            <button
              onClick={onApply}
              className="px-4 py-2 text-[13px] font-medium text-white bg-sky-500 hover:bg-sky-400 border border-sky-400/20 rounded-md transition-colors shadow-sm"
            >
              Apply Fix
            </button>
          )}
        </div>
        
      </div>
    </div>
  );
}
