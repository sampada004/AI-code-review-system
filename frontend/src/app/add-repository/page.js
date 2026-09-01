import AddRepoClient from "@/components/add-repo/add-repo-client";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { GitBranch, Shield, Sparkles } from "lucide-react";

export const metadata = {
  title: "Add Repository | Inspectra AI",
  description: "Connect a GitHub repository to start AI code reviews",
};

export default function AddRepositoryPage() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 selection:bg-sky-500/30">
      <div className="lg:pl-[70px]">
        <DashboardSidebar activeItem="Add Repository" collapsed={true} />

        <main className="min-h-screen flex flex-col">
          <DashboardTopbar />

          <div className="relative px-4 py-8 sm:px-6 lg:px-8 flex-1">
            <div className="mx-auto max-w-5xl space-y-6">
              
              {/* Header */}
              <header className="rounded-xl border border-white/10 bg-[#0f141f] p-6 sm:p-8 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Connect Repository</h1>
                    <p className="mt-1 text-sm text-slate-400">Add a GitHub repository to your Inspectra AI workspace for autonomous reviews.</p>
                  </div>
                </div>
              </header>

              {/* Form & Tips */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <AddRepoClient />
                </div>

                <aside className="lg:col-span-1 space-y-4">
                  <div className="rounded-xl border border-white/10 bg-[#0f141f] p-5 shadow-lg">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Sparkles className="h-4 w-4 text-sky-400" />
                      <span>Supported Formats</span>
                    </h4>
                    <ul className="mt-3 space-y-2 text-xs text-slate-400">
                      <li className="flex items-start gap-2">
                        <span className="text-sky-400 font-mono">•</span>
                        <span>Short format: <code className="text-sky-300 font-mono">owner/repository</code></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-sky-400 font-mono">•</span>
                        <span>Full HTTPS URL: <code className="text-sky-300 font-mono">https://github.com/org/repo</code></span>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#0f141f] p-5 shadow-lg">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Shield className="h-4 w-4 text-emerald-400" />
                      <span>Security & Permissions</span>
                    </h4>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      Inspectra AI connects securely via GitHub OAuth. Fixes and branch creations are only performed on explicit user request.
                    </p>
                  </div>
                </aside>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
