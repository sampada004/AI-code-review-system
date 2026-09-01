"use client";

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Editor from "@monaco-editor/react";

function snippetLinesCount(str) {
  if (!str) return 1;
  return str.split(/\r\n|\r|\n/).length;
}

export const EditorPlaceholder = forwardRef(function EditorPlaceholder({
  analysisState = "idle",
  onAnalyze,
  layoutTrigger,
  statusMessage,
  fileName: propFileName = "gateway.js",
  fileContent: propFileContent = null,
  repoName = "",
  repoBranch = "",
  onRefreshFiles,
  findings = [],
  selectedFindingIndex = null,
  onSelectFinding,
  appliedFixes = new Set(),
}, ref) {
  const editorInstanceRef = useRef(null);
  const monacoInstanceRef = useRef(null);
  const decorationsCollectionRef = useRef(null);
  const findingsRef = useRef(findings);
  const mouseDownListenerRef = useRef(null);
  const [fileName, setFileName] = useState("gateway.js");
  
  // Keep a ref of findings for the editor click handler to access latest state
  useEffect(() => {
    findingsRef.current = findings;
  }, [findings]);

  useEffect(() => {
    if (propFileName) setFileName(propFileName);
  }, [propFileName]);

  useImperativeHandle(ref, () => ({
    getValue: () => {
      const editor = editorInstanceRef.current;
      return editor ? editor.getValue() : "";
    },
    applyFix: (idx) => {
      const editor = editorInstanceRef.current;
      if (!editor || !decorationsCollectionRef.current) return;
      const ranges = decorationsCollectionRef.current.getRanges();
      const currentRange = ranges[idx];
      const finding = findingsRef.current[idx];
      
      if (finding && finding.fixedCode) {
        const model = editor.getModel();
        if (!model) return;

        let targetRange = currentRange;

        // Intelligent Range Resolution
        if (finding.originalCodeSnippet) {
          const rawSnippet = finding.originalCodeSnippet.trim();
          const matches = model.findMatches(rawSnippet, false, false, false, null, false);
          if (matches && matches.length > 0) {
            targetRange = matches[0].range;
          } else {
            // Line-ending normalized search
            const normalizedSnippet = rawSnippet.replace(/\r\n/g, '\n');
            const fullText = model.getValue();
            const normalizedFullText = fullText.replace(/\r\n/g, '\n');
            const foundIdx = normalizedFullText.indexOf(normalizedSnippet);
            
            if (foundIdx !== -1) {
              const textBefore = normalizedFullText.substring(0, foundIdx);
              const startLine = textBefore.split('\n').length;
              const snippetLineCount = normalizedSnippet.split('\n').length;
              const endLine = startLine + snippetLineCount - 1;
              const endCol = model.getLineMaxColumn(endLine);
              targetRange = new monacoInstanceRef.current.Range(startLine, 1, endLine, endCol);
            } else if (finding.lineNumber) {
              // Fallback to line number range
              const line = finding.lineNumber;
              const lineCount = snippetLinesCount(finding.originalCodeSnippet);
              const endLine = Math.min(line + lineCount - 1, model.getLineCount());
              targetRange = new monacoInstanceRef.current.Range(line, 1, endLine, model.getLineMaxColumn(endLine));
            }
          }
        }

        const cleanText = finding.fixedCode.replace(/[\r\n]+$/, '');
        editor.executeEdits("ai-fix", [{
          range: targetRange,
          text: cleanText
        }]);
      }
    },
    undoFix: (idx) => {
      const editor = editorInstanceRef.current;
      if (!editor || !decorationsCollectionRef.current) return;
      const ranges = decorationsCollectionRef.current.getRanges();
      const currentRange = ranges[idx];
      const finding = findingsRef.current[idx];
      
      if (finding && finding.originalCodeSnippet !== undefined) {
        let targetRange = currentRange;
        const model = editor.getModel();
        
        if (model && finding.fixedCode) {
          const searchStr = finding.fixedCode.trim();
          const matches = model.findMatches(searchStr, false, false, false, null, false);
          if (matches && matches.length > 0) {
            targetRange = matches[0].range;
          }
        }

        const cleanText = (finding.originalCodeSnippet || "").replace(/[\r\n]+$/, '');
        editor.executeEdits("ai-undo", [{
          range: targetRange,
          text: cleanText
        }]);
      }
    },
    applySnippetFix: ({ originalCodeSnippet, fixedCode }) => {
      const editor = editorInstanceRef.current;
      if (!editor || !originalCodeSnippet || !fixedCode) return;
      
      const model = editor.getModel();
      if (!model) return;
      
      const searchStr = originalCodeSnippet.trim();
      const matches = model.findMatches(searchStr, false, false, false, null, false);
      
      if (matches && matches.length > 0) {
        const targetRange = matches[0].range;
        const cleanText = fixedCode.replace(/[\r\n]+$/, '');
        editor.executeEdits("ai-auto-fix", [{
          range: targetRange,
          text: cleanText
        }]);
      }
    }
  }));

  const handleEditorDidMount = (editor, monaco) => {
    editorInstanceRef.current = editor;
    monacoInstanceRef.current = monaco;

    // Attach click listener for bidirectional sync
    mouseDownListenerRef.current = editor.onMouseDown((e) => {
      if (e.target.position) {
        const clickedLine = e.target.position.lineNumber;
        const currentFindings = findingsRef.current;
        const findingIndex = currentFindings.findIndex(f => f.lineNumber === clickedLine);
        if (findingIndex !== -1 && onSelectFinding) {
          onSelectFinding(findingIndex);
        }
      }
    });
  };

  // Sync findings to editor decorations
  useEffect(() => {
    const editor = editorInstanceRef.current;
    const monaco = monacoInstanceRef.current;
    if (!editor || !monaco) return;

    if (!findings || findings.length === 0) {
      if (decorationsCollectionRef.current) {
        decorationsCollectionRef.current.clear();
      }
      return;
    }

    const existingRanges = decorationsCollectionRef.current ? decorationsCollectionRef.current.getRanges() : [];

    const newDecorations = findings.map((finding, idx) => {
      if (finding.ignored) {
        return { range: new monaco.Range(1, 1, 1, 1), options: {} };
      }

      let range;
      if (existingRanges[idx] && existingRanges[idx].startLineNumber > 0) {
        // Preserve dynamically tracked line positions
        range = existingRanges[idx];
      } else {
        const line = finding.lineNumber || finding.line_number || 1;
        const snippet = finding.originalCodeSnippet || finding.original_code_snippet || "";
        const snippetLines = snippet ? snippet.split(/\r\n|\r|\n/).length : 1;
        const rawEndLine = Math.max(line, line + snippetLines - 1);
        const model = editor.getModel();
        
        // Clamp to prevent React unhandled exception crash from Monaco out-of-bounds error
        const lineCount = model ? model.getLineCount() : 1;
        const safeLine = Math.min(Math.max(line, 1), lineCount);
        const safeEndLine = Math.min(Math.max(rawEndLine, safeLine), lineCount);
        const endColumn = model ? model.getLineMaxColumn(safeEndLine) : 1;
        
        range = new monaco.Range(safeLine, 1, safeEndLine, endColumn);
      }
      
      const severity = (finding.severity || "low").toLowerCase();
      
      let highlightClass = "monaco-highlight-low";
      let gutterClass = "monaco-gutter-low";
      let overviewRulerColor = "rgba(234, 179, 8, 0.8)"; // yellow

      if (appliedFixes.has(idx)) {
        highlightClass = "monaco-highlight-applied";
        gutterClass = "monaco-gutter-applied";
        overviewRulerColor = "rgba(16, 185, 129, 0.8)"; // green
      } else if (severity === "high") {
        highlightClass = "monaco-highlight-high";
        gutterClass = "monaco-gutter-high";
        overviewRulerColor = "rgba(239, 68, 68, 0.8)"; // red
      } else if (severity === "medium") {
        highlightClass = "monaco-highlight-medium";
        gutterClass = "monaco-gutter-medium";
        overviewRulerColor = "rgba(249, 115, 22, 0.8)"; // orange
      }

      return {
        range,
        options: {
          isWholeLine: true,
          stickiness: monaco.editor.TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges,
          className: highlightClass,
          hoverMessage: [
            { value: `**Severity:** ${finding.severity}` },
            { value: `**Issue:** ${finding.issue}` },
            { value: `**Recommendation:** ${finding.recommendation}` },
          ],
          overviewRuler: {
            color: overviewRulerColor,
            position: monaco.editor.OverviewRulerLane.Right,
          },
        },
      };
    });

    if (decorationsCollectionRef.current) {
      decorationsCollectionRef.current.set(newDecorations);
    } else {
      decorationsCollectionRef.current = editor.createDecorationsCollection(newDecorations);
    }
  }, [findings, appliedFixes]);

  // Sync selectedFindingIndex to editor scroll position
  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (!editor || selectedFindingIndex === null) return;

    const finding = findings[selectedFindingIndex];
    if (finding) {
      const line = finding.lineNumber || finding.line_number;
      if (line) {
        editor.revealLineInCenter(line);
        editor.setPosition({ lineNumber: line, column: 1 });
        editor.focus();
      }
    }
  }, [selectedFindingIndex, findings]);

  // Clean up listener on unmount
  useEffect(() => {
    return () => {
      if (mouseDownListenerRef.current) {
        mouseDownListenerRef.current.dispose();
      }
    };
  }, []);

  function getLanguageFromFilename(name) {
    const ext = name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
      case "jsx":
        return "javascript";
      case "ts":
      case "tsx":
        return "typescript";
      case "java":
        return "java";
      case "py":
        return "python";
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

  const handleAnalyzeClick = () => {
    let source = "";
    if (editorInstanceRef.current) {
      source = editorInstanceRef.current.getValue();
    }
    if (!source && fileContent) {
      source = fileContent;
    }
    const language = getLanguageFromFilename(fileName);
    if (onAnalyze) onAnalyze({ sourceCode: source, language });
  };

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-[#141821] shadow-xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#181d28] px-4 py-2.5 text-[12px] text-slate-300">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200 truncate">
            <span className="text-sky-400">{repoName || "Repository"}</span>
            {repoBranch ? (
              <span className="rounded bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 text-[10px] font-mono text-sky-400">
                {repoBranch}
              </span>
            ) : null}
            <span className="text-slate-500">/</span>
            <span className="text-white font-mono text-[13px]">{fileName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {analysisState === "error" && statusMessage && (
            <span className="text-[12px] font-medium text-rose-400">
              {statusMessage}
            </span>
          )}
          <button
            type="button"
            onClick={handleAnalyzeClick}
            disabled={analysisState === "analyzing"}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-500 hover:bg-sky-400 px-3 py-1.5 text-[12px] font-semibold text-slate-950 transition-all shadow-md shadow-sky-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {analysisState === "analyzing" ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-slate-950" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                </svg>
                <span>Analyzing...</span>
              </span>
            ) : analysisState === "completed" ? (
              <span>Analyze Again</span>
            ) : (
              <span>Analyze Code</span>
            )}
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 min-h-0 bg-[#0d1015]">
        <Editor
          height="100%"
          language={getLanguageFromFilename(fileName)}
          theme="vs-dark"
          value={propFileContent !== null ? propFileContent : editorValue}
          onMount={handleEditorDidMount}
          loading={<div className="flex items-center justify-center h-full text-[12px] text-slate-500">Loading editor...</div>}
          options={{
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            fontSize: 13,
            lineHeight: 20,
            wordWrap: "on",
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: "none",
            glyphMargin: false,
            folding: false,
            inlayHints: { enabled: "off" },
            colorDecorators: false,
            hover: { enabled: true },
            lineNumbersMinChars: 3,
            renderIndentGuides: true,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </section>
  );
});
