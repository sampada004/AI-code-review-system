"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import GitHubIcon from "@/components/common/github-icon";
import { apiUrl, getGitHubLoginUrl } from "@/lib/api";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  Code2
} from "lucide-react";

const onboardingSteps = [
  {
    step: "01",
    title: "Connect with GitHub",
    desc: "1-click OAuth authorization. No passwords or credit cards required."
  },
  {
    step: "02",
    title: "Select Repositories",
    desc: "Choose public or private repositories you want AI to review."
  },
  {
    step: "03",
    title: "Automate Code Reviews",
    desc: "Get instant PR suggestions, vulnerability catches, and 1-click fixes."
  }
];

function RegisterPageContent() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGitHubSignup = () => {
    setIsRedirecting(true);
    window.location.href = getGitHubLoginUrl();
  };

  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950 text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">
      {/* Dynamic ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-25" />
      <div className="pointer-events-none absolute -top-40 right-1/4 h-[550px] w-[750px] rounded-full bg-gradient-to-b from-sky-500/15 via-indigo-600/10 to-transparent blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[100px]" />

      <Navbar isAuthPage hideSignIn />

      <section className="relative flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-12">
          
          {/* Left Hero info */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <div className="badge-glow mb-4">
                <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                  Instant Developer Onboarding
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl leading-[1.15]">
                Start reviewing code in <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">less than 2 minutes</span>
              </h1>
              <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-xl">
                Experience AI-driven code reviews tailored to your GitHub workflow. Zero manual configuration, zero friction.
              </p>
            </div>

            {/* How it works 3 steps */}
            <div className="space-y-3.5">
              {onboardingSteps.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-4 rounded-2xl border border-white/5 bg-slate-900/40 p-4 backdrop-blur-md transition hover:border-sky-500/30 hover:bg-slate-900/60"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-500/10 text-xs font-bold text-sky-400">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Language badges */}
            <div className="pt-1">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3">
                Supported Ecosystems
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                {["TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "C++", "React"].map((lang) => (
                  <span 
                    key={lang} 
                    className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1 text-slate-300 backdrop-blur"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right GitHub Registration Box */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/95 p-7 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full bg-blue-500/20 blur-2xl" />

              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-800/80 shadow-inner">
                  <GitHubIcon className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Create Your Workspace</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Authenticate with GitHub to instantly create your free developer account.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGitHubSignup}
                  disabled={isRedirecting}
                  className="group relative flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-sky-400/40 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-300 hover:border-sky-300 hover:shadow-sky-500/40 hover:brightness-110 active:translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <GitHubIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span>{isRedirecting ? "Redirecting to GitHub..." : "Sign Up with GitHub"}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 font-medium text-sky-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Free forever for personal repositories</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-sky-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Instant access to AI review dashboard</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-sky-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>No credit card or setup needed</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-400">
                  <span>Already signed up?</span>
                  <a href="/login" className="font-semibold text-sky-400 hover:text-sky-300 transition">
                    Sign in with GitHub
                  </a>
                </div>
              </div>

              <p className="mt-6 text-center text-[11px] text-slate-500">
                By continuing, you authorize CodeReview AI to access your public GitHub profile and authorized repositories.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Footer bar */}
      <div className="relative border-t border-white/5 py-4 text-center text-xs text-slate-500">
        <p>© 2026 CodeReview AI. Built for GitHub Developers.</p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
            Loading onboarding portal...
          </div>
        </main>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
