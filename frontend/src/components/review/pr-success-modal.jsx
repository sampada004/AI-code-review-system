"use client";

import { useState } from "react";
import { GitPullRequest, ExternalLink, Check, Copy, X, ShieldCheck } from "lucide-react";

export function PRSuccessModal({ isOpen, onClose, prUrl, branchName, repoName, fileName, files = [] }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !prUrl) return null;

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(prUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filesList = files && files.length > 0 ? files : fileName ? [fileName] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-xl border border-emerald-500/30 bg-[#141821] p-6 shadow-2xl space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <GitPullRequest className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Pull Request Created!</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </h3>
            <p className="text-[12px] text-slate-400">
              Verified fixes have been committed and opened on GitHub.
            </p>
          </div>
        </div>

        {/* Details Card */}
        <div className="rounded-lg border border-white/5 bg-[#0d1016] p-3.5 space-y-2 text-[12px]">
          <div className="flex justify-between items-center text-slate-400">
            <span>Repository:</span>
            <span className="font-semibold text-slate-200">{repoName || "Workspace"}</span>
          </div>

          {filesList.length === 1 ? (
            <div className="flex justify-between items-center text-slate-400">
              <span>Target File:</span>
              <span className="font-mono text-sky-300 font-medium truncate max-w-[200px]" title={filesList[0]}>
                {filesList[0]}
              </span>
            </div>
          ) : (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-slate-400">
                <span>Included Files ({filesList.length}):</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-[11px] text-sky-300">
                {filesList.map((f, i) => (
                  <div key={i} className="truncate bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {branchName ? (
            <div className="flex justify-between items-center text-slate-400">
              <span>PR Branch:</span>
              <span className="rounded bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 font-mono text-[11px] text-sky-400">
                {branchName}
              </span>
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-[13px] font-semibold text-slate-950 transition-all shadow-md shadow-emerald-500/20"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open Pull Request on GitHub</span>
          </a>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-[12px] font-medium text-slate-300 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Link!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy PR Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-[12px] font-medium text-slate-300 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
