import { ExternalIcon } from "./dashboard-icons";
import { activeReview } from "./dashboard-data";

const toneClasses = {
  rose: "text-[#f3b0a5] border-[#f3b0a522]",
  amber: "text-[#f3c56d] border-[#f3c56d22]",
  sky: "text-[#9ec0ff] border-[#9ec0ff22]",
};

export function ActiveReviewCard() {
  return (
    <section className="rounded-[2px] border border-[#38404d] bg-[#161a22] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-6 border-b border-white/8 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[18px] font-semibold tracking-tight text-[#e7ebf2]">
              {activeReview.title}
            </h2>
            <span className="rounded-sm border border-[#4d7edb]/40 bg-[#3f6ebc] px-2 py-0.5 text-[10px] font-medium tracking-[0.08em] text-[#dce8ff]">
              {activeReview.status}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm border border-slate-400/60" />
              {activeReview.repo}
            </span>
            <span className="text-slate-500">•</span>
            <span>branch: {activeReview.branch}</span>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 self-start rounded-[2px] bg-[#0f68d9] px-4 py-2.5 text-[12px] font-medium text-white shadow-[0_8px_24px_rgba(15,104,217,0.28)] transition hover:bg-[#1777f0]"
        >
          Open Full Review
          <ExternalIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-6 px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between text-[11px] text-slate-300">
            <span>{activeReview.progressLabel}</span>
            <span className="font-medium text-slate-200">{activeReview.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#2a313b] p-[1px]">
            <div
              className="h-full rounded-full bg-[#a9beef] shadow-[0_0_10px_rgba(169,190,239,0.22)]"
              style={{ width: `${activeReview.progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-0 divide-x divide-[#3b4350] lg:w-[285px]">
          {activeReview.counts.map((item) => (
            <div key={item.label} className="px-4 text-center">
              <div className={`text-[18px] font-semibold leading-none ${toneClasses[item.tone]}`}>
                {item.value}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.12em] text-slate-300">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

