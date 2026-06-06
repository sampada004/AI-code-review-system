import { ActiveReviewCard } from "@/components/dashboard/active-review-card";
import { ActivityTable } from "@/components/dashboard/activity-table";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export const metadata = {
  title: "Dashboard | CodePilot AI",
  description: "AI code review dashboard",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-slate-100">
      <div className="lg:pl-72">
        <DashboardSidebar />

        <main className="min-h-screen">
          <DashboardTopbar />

          <div className="relative px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1120px]">
              <div className="space-y-8">
                <ActiveReviewCard />
                <ActivityTable />
              </div>
            </div>

            <div className="fixed bottom-4 right-4 z-10 hidden items-center gap-3 rounded-[8px] border border-[#4b5563] bg-[#1b212b] px-3 py-2 text-[11px] text-slate-300 shadow-[0_12px_30px_rgba(0,0,0,0.45)] sm:flex">
              <div className="flex -space-x-1">
                <div className="h-6 w-6 rounded-full border border-sky-400/20 bg-[radial-gradient(circle_at_35%_35%,rgba(56,189,248,0.55),rgba(10,16,24,0.95))]" />
                <div className="h-6 w-6 rounded-full border border-sky-400/20 bg-[radial-gradient(circle_at_35%_35%,rgba(59,130,246,0.5),rgba(10,16,24,0.95))]" />
              </div>
              <span>2 AI Co-Pilots active in repo</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
