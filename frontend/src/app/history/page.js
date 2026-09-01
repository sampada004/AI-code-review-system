import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import HistoryWorkspace from "@/components/history/history-workspace";
import { History as HistoryIcon } from "lucide-react";

export const metadata = {
  title: "Review History | Inspectra AI",
  description: "View past AI code reviews and audits",
};

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 selection:bg-sky-500/30">
      <div className="lg:pl-[70px]">
        <DashboardSidebar activeItem="History" collapsed={true} />

        <main className="min-h-screen flex flex-col">
          <DashboardTopbar />

          <div className="relative px-4 py-8 sm:px-6 lg:px-8 flex-1">
            <div className="mx-auto max-w-6xl space-y-6">
              <header className="rounded-xl border border-white/10 bg-[#0f141f] p-6 sm:p-8 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400">
                    <HistoryIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Review History</h1>
                    <p className="mt-1 text-sm text-slate-400">
                      Browse your previously analyzed code, AI findings, severity rankings, and full reports directly from the database.
                    </p>
                  </div>
                </div>
              </header>

              <div className="rounded-xl border border-white/10 bg-[#0f141f] shadow-xl overflow-hidden">
                <HistoryWorkspace />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
