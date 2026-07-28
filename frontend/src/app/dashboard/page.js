import QuickFeatureCard from "@/components/dashboard/quick-feature-card";
import RecentRepos from "@/components/dashboard/recent-repos";
import RecentReviews from "@/components/dashboard/recent-reviews";
import PendingReviews from "@/components/dashboard/pending-reviews";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import AddRepoModal from "@/components/add-repo/add-repo-modal";

export const metadata = {
  title: "Dashboard | CodePilot AI",
  description: "AI code review dashboard",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-slate-100">
      <div className="lg:pl-[70px]">
        <DashboardSidebar collapsed={true} />

        <main className="min-h-screen">
          <DashboardTopbar />

          <div className="relative px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1120px]">
              <div className="space-y-6">
                <header className="relative overflow-hidden rounded-xl border border-white/10 bg-[#161b22] p-8 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent opacity-50" />
                  <div className="relative z-10">
                    <h1 className="text-[28px] font-semibold tracking-tight text-[#e7ebf2]">
                      Welcome to CodePilot AI
                    </h1>
                    <p className="mt-2 text-[14px] text-slate-400 max-w-2xl leading-relaxed">
                      Seamlessly analyze your source code, identify vulnerabilities, and receive intelligent recommendations to elevate your code quality.
                    </p>
                  </div>
                  <div className="relative z-10 shrink-0">
                    <AddRepoModal />
                  </div>
                </header>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <main className="lg:col-span-8 space-y-6">
                    <RecentRepos />
                    <RecentReviews />
                  </main>

                  <aside className="lg:col-span-4 space-y-4">
                    <PendingReviews />
                  </aside>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
