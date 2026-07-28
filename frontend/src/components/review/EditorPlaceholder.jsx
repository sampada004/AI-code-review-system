"use client";

import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";

const editorValue = `// Paste your source code here to begin analysis...
`;

export function EditorPlaceholder({
  analysisState = "idle",
  onAnalyze,
  layoutTrigger,
  statusMessage,
  fileName: propFileName = "gateway.js",
  fileContent: propFileContent = null,
  repoName = "",
  repoBranch = "",
  onRefreshFiles,
} = {}) {
  const editorHostRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const monacoRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [fileName, setFileName] = useState("gateway.js");
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function initializeEditor() {
      if (!editorHostRef.current) {
        return;
      }

      if (!isMounted || !editorHostRef.current) {
        return;
      }

      const lang = getLanguageFromFilename(propFileName);
      const uri = monaco.Uri.parse('inmemory://workspace-editor');
      
      let model = monaco.editor.getModel(uri);
      if (!model) {
        model = monaco.editor.createModel(propFileContent || editorValue, lang, uri);
      } else {
        model.setValue(propFileContent || editorValue);
        monaco.editor.setModelLanguage(model, lang);
      }

      editorInstanceRef.current = monaco.editor.create(editorHostRef.current, {
        model: model,
        language: "javascript",
        theme: "vs-dark",
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        fontSize: 13,
        lineHeight: 20,
        wordWrap: "on",
        padding: { top: 16, bottom: 16 },
        renderLineHighlight: "none",
        overviewRulerLanes: 0,
        glyphMargin: false,
        folding: false,
        inlayHints: { enabled: "off" },
        colorDecorators: false,
        hover: { enabled: false },
        lineNumbersMinChars: 3,
        renderIndentGuides: true,
        scrollBar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
      });

      setIsEditorReady(true);
    }

    initializeEditor();

    return () => {
      isMounted = false;
      // Dispose the editor instance to clean up DOM elements, but do NOT dispose the model
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose();
        editorInstanceRef.current = null;
      }
    };
  }, []);

  // update editor when parent selects a file
  useEffect(() => {
    if (!editorInstanceRef.current) return;
    if (propFileContent != null) {
      try {
        editorInstanceRef.current.setValue(propFileContent);
        setFileName(propFileName || "file.js");

        const lang = getLanguageFromFilename(propFileName || "");
        const model = editorInstanceRef.current.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, lang);
        }
      } catch (err) {
        // ignore
      }
    }
  }, [propFileContent, propFileName]);

  function getLanguageFromFilename(name) {
    const ext = name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
      case "jsx":
        return ext === "jsx" ? "javascript" : "javascript";
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

  const handleFileChoose = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      if (editorInstanceRef.current) {
        editorInstanceRef.current.setValue(text);

        // set language based on filename and ensure contribution is loaded
        try {
          const lang = getLanguageFromFilename(file.name);
          const model = editorInstanceRef.current.getModel();
          if (model) {
            monaco.editor.setModelLanguage(model, lang);
          }
        } catch (err) {
          // ignore language switch errors
        }
      }
    };
    reader.readAsText(file);
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  useEffect(() => {
    if (typeof layoutTrigger === "undefined") return;
    // request Monaco to relayout when parent layout changes (sidebar toggle)
    if (editorInstanceRef.current && typeof editorInstanceRef.current.layout === "function") {
      try {
        editorInstanceRef.current.layout();
      } catch (err) {
        // ignore
      }
    }
  }, [layoutTrigger]);

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
        <div className="flex items-center gap-3">          <button
            type="button"
            onClick={() => {
              if (!editorInstanceRef.current) return;
              let source = "";
              try {
                source = editorInstanceRef.current.getValue();
              } catch (e) {
                source = "";
              }

              let language = getLanguageFromFilename(fileName);
              try {
                const model = editorInstanceRef.current.getModel();
                if (model && monacoRef.current) {
                  // Monaco model may expose a language id
                  const id = model.getLanguageId ? model.getLanguageId() : null;
                  if (id) language = id;
                }
              } catch (e) {
                // fallback to filename-based language
              }

              if (onAnalyze) onAnalyze({ sourceCode: source, language });
            }}
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
        <div ref={editorHostRef} className="absolute inset-0 h-full w-full" aria-label="Code editor" />

        {!isEditorReady ? (
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] opacity-35" />
        ) : null}

        {!isEditorReady ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] text-slate-500">
            Loading editor...
          </div>
        ) : null}
      </div>
    </section>
  );
}
