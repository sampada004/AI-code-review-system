import { ChevronIcon, FileIcon, FolderIcon, PlusIcon } from "./review-icons";
import { explorerSections, repositorySummary, reviewStats } from "./review-data";

const statusTone = {
  active: "bg-sky-400/20 text-sky-200 border-sky-400/30",
  modified: "bg-amber-400/15 text-amber-200 border-amber-400/25",
  new: "bg-emerald-400/15 text-emerald-200 border-emerald-400/25",
};

const statTone = {
  rose: "text-rose-200 border-rose-400/20 bg-rose-400/10",
  amber: "text-amber-200 border-amber-400/20 bg-amber-400/10",
  emerald: "text-emerald-200 border-emerald-400/20 bg-emerald-400/10",
};

function ExplorerRow({ item }) {
  const isFolder = item.type === "folder";
  const Icon = isFolder ? FolderIcon : FileIcon;

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-[4px] px-2 py-2 text-[12px] transition ${
        item.active ? "bg-[#4b525c] text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
      style={{ marginLeft: `${item.depth * 12}px` }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
        {isFolder ? (
          <ChevronIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        ) : (
          <span className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="truncate">{item.name}</span>
      </div>
      {item.status ? (
        <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] ${statusTone[item.status]}`}>
          {item.status}
        </span>
      ) : null}
    </div>
  );
}

export function ReviewFileExplorer() {
  return (
    <aside className="flex h-full min-h-[calc(100vh-180px)] flex-col overflow-hidden rounded-[2px] border border-[#3a404b] bg-[#141821] shadow-[0_16px_44px_rgba(0,0,0,0.35)]">
      <div className="border-b border-white/8 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[12px] uppercase tracking-[0.18em] text-slate-400">Repository Explorer</div>
            <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-[#e7ebf3]">
              {repositorySummary.name}
            </h2>
            <p className="mt-1 text-[12px] text-slate-400">
              branch: {repositorySummary.branch} • {repositorySummary.commit}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Create file"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {reviewStats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-[6px] border px-3 py-2 text-center ${statTone[stat.tone]}`}
            >
              <div className="text-[18px] font-semibold leading-none">{stat.value}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.14em]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {explorerSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <div className="px-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <ExplorerRow key={`${section.title}-${item.name}`} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/8 px-4 py-3 text-[11px] text-slate-400">
        Expand the tree to inspect files and hunks.
      </div>
    </aside>
  );
}

