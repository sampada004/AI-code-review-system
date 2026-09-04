"use client";

import { useState, useEffect } from "react";
import { GitPullRequest, X, CheckSquare, Square, FileCode, Layers, ShieldCheck, Loader2 } from "lucide-react";

export function MultiFilePRModal({
  isOpen,
  onClose,
  repoName = "",
  repoBranch = "main",
  currentFileName = "",
  currentFileContent = "",
  allModifiedFiles = [], // Array of { path, content, isAnalyzed, findingsCount, hasAppliedFixes }
  onSubmitPR,
  isCreatingPR = false,
  isFileModified = false,
  initialMode = "multi" // "single" | "multi"
}) {
  const [mode, setMode] = useState(initialMode); // "single" | "multi"
  const [selectedFilePaths, setSelectedFilePaths] = useState(new Set());
  const [title, setTitle] = useState("");
  const [customBranch, setCustomBranch] = useState("");
  const [body, setBody] = useState("");

  // Sync available files and selection when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const actualModifiedPaths = allModifiedFiles.map((f) => f.path);
    const hasCurrentModified = isFileModified || actualModifiedPaths.includes(currentFileName);
    
    if (initialMode === "single" && hasCurrentModified && currentFileName) {
      setMode("single");
      setSelectedFilePaths(new Set([currentFileName]));
    } else {
      setMode(actualModifiedPaths.length > 1 ? "multi" : "single");
      setSelectedFilePaths(new Set(actualModifiedPaths.length > 0 ? actualModifiedPaths : hasCurrentModified && currentFileName ? [currentFileName] : []));
    }

    const defaultBranch = `inspectra/ai-fixes-${Date.now().toString().slice(-6)}`;
    setCustomBranch(defaultBranch);
  }, [isOpen, initialMode, currentFileName, allModifiedFiles, isFileModified]);

  // Update title & body when mode or selection changes
  useEffect(() => {
    if (!isOpen) return;

    const count = mode === "single" ? 1 : selectedFilePaths.size;
    const filesArray = Array.from(selectedFilePaths);

    if (mode === "single" || count === 1) {
      const targetFile = mode === "single" ? currentFileName : (filesArray[0] || currentFileName);
      setTitle(`AI Code Review Fixes for ${targetFile || "file"}`);
      setBody(
        `### 🤖 Inspectra AI Review Fixes\n\n` +
        `Automated pull request applying verified code review improvements and bug fixes for \`${targetFile}\`.\n\n` +
        `- **Repository**: \`${repoName}\`\n` +
        `- **Base Branch**: \`${repoBranch}\`\n` +
        `- **Verification**: Re-validated via AI Engine.\n`
      );
    } else {
      setTitle(`AI Code Review: Batch Fixes for ${count} files`);
      const filesListMarkdown = filesArray.map((p) => `- \`${p}\``).join("\n");
      setBody(
        `### 🤖 Inspectra AI Review Fixes (Batch Pull Request)\n\n` +
        `This pull request applies verified AI-suggested improvements and security bug fixes across **${count} files**:\n\n` +
        `${filesListMarkdown}\n\n` +
        `---\n*Created automatically by Inspectra AI Workspace.*`
      );
    }
  }, [mode, selectedFilePaths, currentFileName, repoName, repoBranch, isOpen]);

  const toggleFileSelection = (path) => {
    setSelectedFilePaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        if (next.size > 1) {
          next.delete(path);
        }
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedFilePaths(new Set(allModifiedFiles.map((f) => f.path)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isCreatingPR) return;

    if (mode === "single") {
      // Single file submission
      onSubmitPR({
        isMulti: false,
        filePath: currentFileName,
        newContent: currentFileContent,
        title: title.trim(),
        body: body.trim(),
        branch: repoBranch,
        customBranchName: customBranch.trim() || undefined
      });
    } else {
      // Multi file submission
      const filesToSubmit = allModifiedFiles
        .filter((f) => selectedFilePaths.has(f.path))
        .map((f) => ({
          filePath: f.path,
          newContent: f.content
        }));

      // Fallback if current file was selected but not in list
      if (filesToSubmit.length === 0 && currentFileName) {
        filesToSubmit.push({
          filePath: currentFileName,
          newContent: currentFileContent
        });
      }

      onSubmitPR({
        isMulti: true,
        files: filesToSubmit,
        title: title.trim(),
        body: body.trim(),
        branch: repoBranch,
        customBranchName: customBranch.trim() || undefined
      });
    }
  };

  if (!isOpen) return null;

  const hasMultipleModified = allModifiedFiles.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-xl border border-white/10 bg-[#141821] p-6 shadow-2xl space-y-5 text-slate-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <GitPullRequest className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Create Pull Request</span>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </h3>
              <p className="text-[12px] text-slate-400">
                Commit verified AI fixes directly to <span className="text-sky-300 font-mono">{repoName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isCreatingPR}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Selector Tabs (Single File vs Multi-File Bundle) */}
        {hasMultipleModified && (
          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-black/30 border border-white/5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setMode("single");
                setSelectedFilePaths(new Set([currentFileName]));
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-[12px] font-medium transition-all ${
                mode === "single"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span className="truncate">Single: {currentFileName.split("/").pop()}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("multi");
                selectAll();
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-[12px] font-medium transition-all ${
                mode === "multi"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Multi-File ({allModifiedFiles.length} files)</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 custom-scrollbar">
          
          {/* Multi-File Checklist */}
          {mode === "multi" && (
            <div className="rounded-lg border border-white/10 bg-[#0d1016] p-3 space-y-2.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-emerald-400" />
                  Files Included in Pull Request ({selectedFilePaths.size}/{allModifiedFiles.length})
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    Select All
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {allModifiedFiles.map((file) => {
                  const isSelected = selectedFilePaths.has(file.path);
                  return (
                    <div
                      key={file.path}
                      onClick={() => toggleFileSelection(file.path)}
                      className={`flex items-center justify-between gap-2 p-2 rounded border cursor-pointer text-[12px] transition ${
                        isSelected
                          ? "border-emerald-500/30 bg-emerald-500/10 text-slate-100"
                          : "border-white/5 bg-white/2 text-slate-400 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-500 shrink-0" />
                        )}
                        <FileCode className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px] truncate">{file.path}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                        {file.hasAppliedFixes && (
                          <span className="rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 font-medium">
                            Fixes Applied
                          </span>
                        )}
                        {file.isAnalyzed && (
                          <span className="rounded bg-sky-500/20 text-sky-300 px-1.5 py-0.5 font-medium">
                            Analyzed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PR Title */}
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-slate-300">
              Pull Request Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-[#0d1016] px-3 py-2 text-[12px] text-white focus:border-sky-500 focus:outline-none"
              placeholder="e.g., Fix security and performance issues"
            />
          </div>

          {/* Target and Branch Info */}
          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div className="space-y-1.5">
              <label className="block font-medium text-slate-300">Base Branch</label>
              <div className="rounded-md border border-white/10 bg-[#0d1016] px-3 py-2 text-slate-400 font-mono text-[11px]">
                {repoBranch}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-slate-300">New PR Branch</label>
              <input
                type="text"
                required
                value={customBranch}
                onChange={(e) => setCustomBranch(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-[#0d1016] px-3 py-2 font-mono text-[11px] text-sky-300 focus:border-sky-500 focus:outline-none"
                placeholder="inspectra/fix-branch"
              />
            </div>
          </div>

          {/* PR Description */}
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-slate-300">
              PR Description
            </label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-[#0d1016] p-3 text-[12px] text-slate-200 focus:border-sky-500 focus:outline-none font-mono text-[11px] leading-relaxed custom-scrollbar"
              placeholder="Description of changes..."
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreatingPR}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-medium text-slate-300 hover:bg-white/10 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingPR || (mode === "multi" && selectedFilePaths.size === 0)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-[12px] font-semibold text-slate-950 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingPR ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>Opening Pull Request...</span>
                </>
              ) : (
                <>
                  <GitPullRequest className="h-4 w-4" />
                  <span>
                    {mode === "multi"
                      ? `Create PR (${selectedFilePaths.size} ${selectedFilePaths.size === 1 ? 'file' : 'files'})`
                      : `Create PR for ${currentFileName.split("/").pop()}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
