import { GitPullRequest, Layers } from "lucide-react";

export function ReviewBottomBar({
  onExpandFixes,
  isFixesExpanded,
  modifiedFilesCount = 0,
  onOpenMultiFilePR,
  onOpenSingleFilePR
}) {
  return (
    <div className="flex items-center justify-between rounded-[4px] border border-[#3a404b] bg-[#171c24] px-4 py-2.5 shadow-[0_16px_44px_rgba(0,0,0,0.35)] text-[12px]">
      <div className="flex items-center gap-3">
        {modifiedFilesCount > 0 && (
          <div className="flex items-center gap-2 text-slate-300">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">
              {modifiedFilesCount} {modifiedFilesCount === 1 ? 'file' : 'files'} ready for PR
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {modifiedFilesCount > 1 && onOpenMultiFilePR && (
          <button
            type="button"
            onClick={onOpenMultiFilePR}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-medium text-emerald-300 transition hover:bg-emerald-500/20"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Bundle PR ({modifiedFilesCount} files)</span>
          </button>
        )}

        {!isFixesExpanded ? (
          <button
            type="button"
            onClick={onExpandFixes}
            className="rounded-[4px] border border-white/10 bg-[#0d1016] px-3 py-1.5 text-[12px] font-medium text-slate-200 transition hover:bg-white/5 hover:text-white"
          >
            View AI Fixes
          </button>
        ) : null}
      </div>
    </div>
  );
}
