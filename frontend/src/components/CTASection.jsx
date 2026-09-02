"use client";

import GitHubIcon from "@/components/common/github-icon";
import { Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { apiUrl, getGitHubLoginUrl } from "@/lib/api";

const CTASection = () => {
  const handleGitHubAuth = () => {
    window.location.href = getGitHubLoginUrl();
  };

  return (
    <section className="relative px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl border border-sky-400/30 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 p-8 sm:p-12 lg:p-16 text-center shadow-[0_25px_80px_rgba(2,6,23,0.8)] backdrop-blur-2xl">
          
          {/* Ambient lighting glows */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-[600px] rounded-full bg-gradient-to-r from-sky-500/25 via-blue-500/20 to-indigo-500/25 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-20 right-10 h-48 w-48 rounded-full bg-sky-400/15 blur-[80px]" />

          <div className="relative mx-auto max-w-3xl">
            <div className="badge-glow mb-6">
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                Start in 30 Seconds
              </span>
            </div>

            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
              Ready to ship cleaner, safer code with AI?
            </h2>

            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Join thousands of developers using CodeReview AI to catch vulnerabilities, eliminate review delays, and merge with confidence.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleGitHubAuth}
                className="w-full sm:w-auto btn-github text-base px-8 py-4 flex items-center justify-center gap-3 group text-white shadow-2xl"
              >
                <GitHubIcon className="h-5 w-5 text-white transition-transform group-hover:scale-110" />
                <span>Start Reviewing with GitHub</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <a
                href="#demo"
                className="w-full sm:w-auto btn-secondary text-base px-6 py-4 flex items-center justify-center gap-2"
              >
                <span>View Live Demo</span>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> 100% Free for Open Source & Personal Repos
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-emerald-400" /> No Credit Card Required
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CTASection;
