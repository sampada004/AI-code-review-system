export function ReviewBottomBar({ onExpandFixes, isFixesExpanded }) {
  return (
    <div className="flex items-center justify-end rounded-[2px] border border-[#3a404b] bg-[#171c24] px-4 py-3 shadow-[0_16px_44px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-3">
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
