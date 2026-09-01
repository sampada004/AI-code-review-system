import DashboardAnalytics from "@/components/dashboard/dashboard-analytics";
import RecentRepos from "@/components/dashboard/recent-repos";
import RecentReviews from "@/components/dashboard/recent-reviews";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export const metadata = {
  title: "Dashboard | CodePilot AI",
  description: "AI code review dashboard",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-sky-500/30">
      <div className="lg:pl-[70px]">
        <DashboardSidebar collapsed={true} />

        <main className="min-h-screen flex flex-col">
          <DashboardTopbar />

          <div className="relative px-4 py-6 sm:px-6 lg:px-8 max-w-[1280px] w-full mx-auto space-y-6">
            {/* 1. Connected Repositories */}
            <RecentRepos />

            {/* 2. Repository Fault Analytics */}
            <DashboardAnalytics />

            {/* 3. Code Alerts & Pending Fixes */}
            <RecentReviews />
          </div>
        </main>
      </div>
    </div>
  );
}







