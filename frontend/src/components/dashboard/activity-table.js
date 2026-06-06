import { DotsIcon } from "./dashboard-icons";
import { activityRows } from "./dashboard-data";

const statusClasses = {
  green: "text-emerald-400",
  rose: "text-rose-300",
  sky: "text-sky-300",
};

const statusDotClasses = {
  green: "bg-emerald-400",
  rose: "bg-rose-300",
  sky: "bg-sky-300",
};

export function ActivityTable() {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-serif text-[22px] font-semibold tracking-[-0.02em] text-[#e7ebf2]">
          Recent Activity
        </h2>
        <a href="#" className="text-[12px] text-slate-300 transition hover:text-white">
          View Audit Log
        </a>
      </div>

      <div className="overflow-hidden rounded-[2px] border border-[#38404d] bg-[#161a22] shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-collapse text-left">
            <thead className="bg-[#272c33] text-[10px] uppercase tracking-[0.08em] text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Project Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Issues</th>
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {activityRows.map((row) => (
                <tr
                  key={row.project}
                  className="border-t border-[#313845] text-[12px] text-slate-200"
                >
                  <td className="px-4 py-4 font-medium text-[#e8edf4]">{row.project}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-2 ${statusClasses[row.statusTone]}`}>
                      <span className={`h-2 w-2 rounded-full ${statusDotClasses[row.statusTone]}`} />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#dbc7a5]">
                      {row.issues.map((issue, index) => (
                        <span key={`${row.project}-${index}`}>{issue}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{row.branch}</td>
                  <td className="px-4 py-4 text-slate-300">{row.timestamp}</td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      aria-label={`More actions for ${row.project}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/5 hover:text-white"
                    >
                      <DotsIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

