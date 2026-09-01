"use client";

import GitHubIcon from "@/components/common/github-icon";
import { GitPullRequest, ShieldCheck, Zap, ArrowRight } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "1-Click GitHub Connect",
    badge: "Instant Setup",
    description: "Authorize via GitHub OAuth. No manual API keys, configuration files, or credit cards needed.",
    icon: GitHubIcon,
    tag: "OAuth 2.0"
  },
  {
    step: "02",
    title: "Open a PR or Scan Commits",
    badge: "Real-time Webhooks",
    description: "Our AI engine analyzes the full AST, control-flow logic, and security implications of your diffs.",
    icon: GitPullRequest,
    tag: "Automated Triggers"
  },
  {
    step: "03",
    title: "Merge with 100% Confidence",
    badge: "1-Click AI Fixes",
    description: "Receive instant line-by-line feedback, vulnerability alerts, and verified patch suggestions.",
    icon: ShieldCheck,
    tag: "Production Safe"
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="badge-glow mb-3">
            <Zap className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-300">
              Frictionless Developer Workflow
            </span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            From commit to reviewed in 3 simple steps
          </h2>
          <p className="mt-4 text-base text-slate-300">
            Engineered to fit natively into your GitHub process without slowing down your release cadence.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-6 md:grid-cols-3 relative">
          {steps.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-3xl border border-white/10 bg-slate-900/60 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-400/40 hover:bg-slate-900/90 shadow-xl"
              >
                {/* Glow accent */}
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-sky-500/10 blur-2xl transition group-hover:bg-sky-500/20" />

                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-500/10 text-sky-400 shadow-inner group-hover:scale-110 transition-transform">
                    <IconComp className="h-6 w-6" />
                  </div>
                  <span className="text-3xl font-black text-slate-700 font-mono group-hover:text-sky-500/40 transition-colors">
                    {item.step}
                  </span>
                </div>

                <div className="inline-block rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300 mb-3">
                  {item.badge}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">{item.tag}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
