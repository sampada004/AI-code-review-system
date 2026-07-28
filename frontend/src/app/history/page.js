import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import HistoryWorkspace from "@/components/history/history-workspace";

export const metadata = {
  title: "Review History | CodePilot AI",
  description: "View past AI code reviews",
};

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-slate-100">
      <div className="lg:pl-[70px]">
        <DashboardSidebar activeItem="History" collapsed={true} />

        <main className="min-h-screen flex flex-col">
          <DashboardTopbar />

          <div className="relative px-4 py-8 sm:px-6 lg:px-8 flex-1">
            <div className="mx-auto max-w-[1120px] h-full">
              <div className="space-y-6 h-full flex flex-col">
                <header className="relative overflow-hidden rounded-[4px] border border-white/10 bg-[#161b22] p-8 shadow-sm">
                  <div className="relative z-10">
                    <h1 className="text-[24px] font-semibold tracking-tight text-[#e7ebf2]">
                      Review History
                    </h1>
                    <p className="mt-2 text-[13px] text-slate-400 max-w-2xl leading-relaxed">
                      Browse your previously analyzed code. View AI findings, severity rankings, and full reports directly from the database.
                    </p>
                  </div>
                </header>

                <div className="flex-1 bg-[#0d1015] border border-[#3a404b] rounded-[4px] shadow-[0_16px_44px_rgba(0,0,0,0.35)] overflow-hidden">
                  <HistoryWorkspace />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
