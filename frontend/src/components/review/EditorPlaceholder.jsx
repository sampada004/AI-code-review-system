"use client";

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Editor from "@monaco-editor/react";

const editorValue = `// Paste your source code here to begin analysis...
`;

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
      
      if (currentRange && finding && finding.fixedCode) {
        let targetRange = currentRange;
        const model = editor.getModel();
        
        // Attempt to find the exact snippet in the code to ensure we replace the right text
        if (model && finding.originalCodeSnippet) {
          // Normalize line endings to try and get a match
          const searchStr = finding.originalCodeSnippet;
          const matches = model.findMatches(searchStr, false, false, false, null, false);
          if (matches && matches.length > 0) {
            targetRange = matches[0].range;
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
      
      if (currentRange && finding && finding.originalCodeSnippet !== undefined) {
        let targetRange = currentRange;
        const model = editor.getModel();
        
        // When undoing, we need to find the fixedCode we just inserted to replace it back
        if (model && finding.fixedCode) {
          const searchStr = finding.fixedCode.replace(/[\r\n]+$/, '');
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
        const endLine = Math.max(line, line + snippetLines - 1);
        const model = editor.getModel();
        const endColumn = model ? model.getLineMaxColumn(endLine) : 1;
        range = new monaco.Range(line, 1, endLine, endColumn);
      }
      
      const severity = (finding.severity || "low").toLowerCase();
      
      let highlightClass = "monaco-highlight-low";
      let gutterClass = "monaco-gutter-low";
      let overviewRulerColor = "rgba(234, 179, 8, 0.8)"; // yellow

      if (severity === "high") {
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
  }, [findings]);

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
    <section className="flex h-full min-h-[calc(100vh-180px)] flex-col overflow-hidden rounded-[2px] border border-[#3a404b] bg-[#11151c] shadow-[0_16px_44px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between border-b border-[#2f3540] bg-[#171c24] px-4 py-3 text-[12px] text-slate-300">
          <div className="flex items-center gap-3">
          <div>
            <div className="text-[13px] font-medium text-[#e8edf4]">{repoName || "Repository"}</div>
            <div className="text-[12px] text-slate-400">{repoBranch ? `branch: ${repoBranch}` : null}</div>
          </div>
          <div className="ml-4 text-[13px] font-medium text-slate-300">{fileName}</div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAnalyzeClick}
            disabled={analysisState === "analyzing"}
            className="ml-2 rounded-[4px] border border-white/10 bg-sky-600 px-2 py-1 text-[12px] font-medium text-white transition disabled:opacity-60 disabled:cursor-not-allowed hover:bg-sky-500"
          >
            {analysisState === "analyzing" ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
