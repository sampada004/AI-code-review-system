import AddRepoClient from "@/components/add-repo/add-repo-client";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export const metadata = {
  title: "Add Repository | CodePilot AI",
  description: "Add a GitHub repository to your workspace",
};

export default function AddRepositoryPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-slate-100">
      <div className="lg:pl-72">
        <DashboardSidebar activeItem="Add Repository" />

        <main className="min-h-screen">
          <DashboardTopbar />

          <div className="relative px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1120px]">
              <div className="space-y-6">
                <header className="rounded-md border border-[#38404d] bg-[#161a22] px-6 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                  <h1 className="font-serif text-[22px] font-semibold text-[#e7ebf2]">Add Repository</h1>
                  <p className="mt-2 text-[13px] text-slate-300">Add a GitHub repository to your workspace.</p>
                </header>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <AddRepoClient />
                  </div>

                  <aside className="lg:col-span-1">
                    <div className="rounded-md border border-[#38404d] bg-[#161a22] px-5 py-4">
                      <h4 className="font-medium text-[#e7ebf2]">Tips</h4>
                      <p className="mt-2 text-[13px] text-slate-300">Enter repository URL or owner/repo. We'll store it for future reviews.</p>
                    </div>
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
