"use client";

import { 
  GitPullRequest, 
  ShieldAlert, 
  Wand2, 
  Cpu, 
  Layers, 
  Workflow, 
  CheckCircle2,
  Lock,
  Sparkles
} from "lucide-react";

const capabilities = [
  {
    icon: GitPullRequest,
    title: "Automated PR Intelligence",
    tag: "Diff Inspection",
    description: "Evaluates pull request diffs, analyzes downstream effects, and flags edge cases before review fatigue sets in.",
    highlight: "Full control-flow reasoning"
  },
  {
    icon: ShieldAlert,
    title: "OWASP & Security Audits",
    tag: "Vulnerability Scanner",
    description: "Detects injection vectors, unsafe token management, timing vulnerabilities, and exposed secrets with zero false alarm bloat.",
    highlight: "CWE & OWASP compliant"
  },
  {
    icon: Wand2,
    title: "1-Click AI Fix Suggestions",
    tag: "Automated Patches",
    description: "Generates tested, syntactically sound diff fixes that your team can inspect and accept with a single click.",
    highlight: "Ready-to-merge patches"
  },
  {
    icon: Cpu,
    title: "Multi-Language AST Engine",
    tag: "Polyglot Support",
    description: "Deep parsing across TypeScript, Python, Go, Rust, Java, and C++ with full understanding of framework semantics.",
    highlight: "30+ Supported Languages"
  },
  {
    icon: Layers,
    title: "Repository-Aware Context",
    tag: "Architecture Memory",
    description: "Understands your internal helper patterns, architecture constraints, and styling conventions for relevant suggestions.",
    highlight: "Zero generic spam"
  },
  {
    icon: Workflow,
    title: "Seamless GitHub Sync",
    tag: "Zero-Config Webhooks",
    description: "Connects directly with your GitHub organizations and repos. No YAML configuration boilerplate needed.",
    highlight: "Instant activation"
  }
];

const Features = () => {
  return (
    <section id="features" className="relative scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="badge-glow mb-3">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-300">
              Core Capabilities
            </span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Everything your team needs for confident releases
          </h2>
          <p className="mt-4 text-base text-slate-300">
            Cut code review bottlenecks in half while maintaining the highest engineering security and quality standards.
          </p>
        </div>

        {/* Features 2x3 Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-3xl border border-white/10 bg-slate-900/60 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-400/40 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-sky-950/40"
              >
                {/* Subtle top indicator */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-mono font-medium text-slate-400">
                    {item.tag}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
                  {item.description}
                </p>

                <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-slate-300">{item.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default Features;
