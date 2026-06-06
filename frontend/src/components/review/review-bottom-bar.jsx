export function ReviewBottomBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/8 bg-[#141821]/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Pending Review Summary
          </div>
          <div className="mt-1 text-[13px] text-slate-300">
            14 findings across 3 files ready for final pass.
          </div>
        </div>

        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center rounded-[4px] bg-[#0f68d9] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(15,104,217,0.24)] transition hover:bg-[#1777f0]"
        >
          Finalize Review
        </button>
      </div>
    </div>
  );
}

