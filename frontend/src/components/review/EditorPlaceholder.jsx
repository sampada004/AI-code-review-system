"use client";

import { useEffect, useRef, useState } from "react";

const editorValue = `import { createServer } from "http";

export function routeGateway(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  return next();
}
`;

export function EditorPlaceholder() {
  const editorHostRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initializeEditor() {
      if (!editorHostRef.current) {
        return;
      }

      window.MonacoEnvironment = {
        getWorker() {
          return new Worker(
            new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url),
            { type: "module" }
          );
        },
      };

      const monaco = await import("monaco-editor/esm/vs/editor/editor.api");
      await import("monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution");

      if (!isMounted || !editorHostRef.current) {
        return;
      }

      editorInstanceRef.current = monaco.editor.create(editorHostRef.current, {
        value: editorValue,
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
      editorInstanceRef.current?.dispose();
      editorInstanceRef.current = null;
      delete window.MonacoEnvironment;
    };
  }, []);

  return (
    <section className="flex h-full min-h-[calc(100vh-180px)] flex-col overflow-hidden rounded-[2px] border border-[#3a404b] bg-[#11151c] shadow-[0_16px_44px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between border-b border-[#2f3540] bg-[#171c24] px-4 py-3 text-[12px] text-slate-300">
        <div className="flex items-center gap-3">
          <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-slate-200">
            gateway.js
          </span>
          <span className="text-slate-500">&bull;</span>
          <span>feature/review-hardening</span>
        </div>
        <div className="text-slate-500">120 lines</div>
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
