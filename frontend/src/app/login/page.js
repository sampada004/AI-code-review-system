"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import GitHubIcon from "@/components/common/github-icon";
import { apiUrl, getGitHubLoginUrl } from "@/lib/api";
import { 
  ShieldCheck, 
  Zap, 
  GitPullRequest, 
  ArrowRight, 
  Lock, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant PR Analysis",
    description: "Multi-file diff parsing and actionable suggestions in seconds.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Grade Security",
    description: "OWASP Top 10 detection with automated zero-touch patches.",
  },
  {
    icon: GitPullRequest,
    title: "One-Click Fix Branches",
    description: "Atomic multi-file branch creation with verified fixes.",
  },
];

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const errorParam = searchParams.get("error");
  const errorMessage = errorParam ? decodeURIComponent(errorParam) : "";

  const handleGitHubLogin = () => {
    setIsRedirecting(true);
    window.location.href = getGitHubLoginUrl();
  };

  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950 text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">
      {/* Dynamic ambient lighting & grid */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-25" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-b from-sky-500/15 via-blue-600/10 to-transparent blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-[100px]" />

      <Navbar isAuthPage hideSignIn />

      <section className="relative flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-12">
          
          {/* Left info column */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <div className="badge-glow mb-4">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                  Developer-First Authentication
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl leading-[1.15]">
                Ship flawless code with <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">AI intelligence</span>
              </h1>
              <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-xl">
                Connect your GitHub account to supercharge your pull requests with autonomous code reviews, security scans, and instant fix suggestions.
              </p>
            </div>

            {/* Feature items */}
            <div className="space-y-4 pt-2">
              {features.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div 
                    key={idx} 
                    className="flex items-start gap-4 rounded-2xl border border-white/5 bg-slate-900/40 p-3.5 backdrop-blur-md transition hover:border-white/10 hover:bg-slate-900/70"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trust metrics */}
            <div className="flex items-center gap-6 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Zero Password Hassles</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Standard GitHub OAuth 2.0</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Instant Setup</span>
              </div>
            </div>
          </div>

          {/* Right login card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/95 p-7 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-sky-500/20 blur-2xl" />
              
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-800/80 shadow-inner">
                  <GitHubIcon className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Sign In to Inspectra AI</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Authenticate securely using your GitHub developer credentials.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGitHubLogin}
                  disabled={isRedirecting}
                  className="group relative flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-sky-400/40 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-300 hover:border-sky-300 hover:shadow-sky-500/40 hover:brightness-110 active:translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <GitHubIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span>{isRedirecting ? "Connecting to GitHub..." : "Continue with GitHub"}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <Lock className="h-3.5 w-3.5 text-sky-400" />
                    <span>OAuth Permissions & Security</span>
                  </div>
                  <ul className="mt-2 space-y-1.5 text-[11px] text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-slate-500" />
                      <span>Read profile info & verified email</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-slate-500" />
                      <span>Read access to repositories you select</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-slate-500" />
                      <span>Encrypted token storage with zero password exposure</span>
                    </li>
                  </ul>
                </div>
              </div>

              <p className="mt-6 text-center text-[11px] text-slate-500">
                By continuing, you agree to CodeReview AI&apos;s{" "}
                <a href="#" className="text-slate-400 hover:text-sky-400 transition underline underline-offset-2">Terms</a> and{" "}
                <a href="#" className="text-slate-400 hover:text-sky-400 transition underline underline-offset-2">Privacy Policy</a>.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Subtle bottom bar */}
      <div className="relative border-t border-white/5 py-4 text-center text-xs text-slate-500">
        <p>© 2026 CodeReview AI. Built for GitHub Developers.</p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
            Loading authentication portal...
          </div>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
