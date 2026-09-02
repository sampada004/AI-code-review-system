"use client";

import { useState } from "react";
import Link from "next/link";
import GitHubIcon from "@/components/common/github-icon";
import { 
  Sparkles, 
  ArrowRight, 
  ShieldAlert, 
  Code2, 
  GitPullRequest,
  Check,
  CheckCircle2
} from "lucide-react";
import { apiUrl } from "@/lib/api";

const codeDemos = [
  {
    id: "ts",
    filename: "auth-handler.ts",
    language: "TypeScript",
    prTitle: "PR #412 • Fix JWT verification and session bypass",
    issueType: "Critical Security Flaw",
    issueSeverity: "critical",
    flawedCode: [
      `// Vulnerable: Weak secret verification & timing attack risk`,
      `export async function verifySession(token: string) {`,
      `  const decoded = jwt.decode(token); // Untrusted payload inspection`,
      `  if (decoded.role === "admin") {`,
      `    return { authorized: true, user: decoded.sub };`,
      `  }`,
      `  return jwt.verify(token, process.env.SECRET || "default_fallback");`,
      `}`
    ],
    fixedCode: [
      `// AI-Fixed: Strict cryptographic verification with constant-time check`,
      `export async function verifySession(token: string) {`,
      `  const secret = process.env.JWT_SIGNING_KEY;`,
      `  if (!secret) throw new ConfigurationError("Missing JWT secret key");`,
      `  `,
      `  const verified = await jwt.verifyAsync(token, secret, { algorithms: ["HS256"] });`,
      `  return { authorized: verified.role === "admin", user: verified.sub };`,
      `}`
    ],
    suggestions: [
      {
        title: "Insecure JWT Decoding without Signature Verification",
        description: "Bypasses signature validation if role is spoofed in payload.",
        severity: "critical"
      },
      {
        title: "Hardcoded Insecure Fallback Secret",
        description: "Using 'default_fallback' allows trivial token forgery in production.",
        severity: "high"
      }
    ]
  },
  {
    id: "py",
    filename: "payment_engine.py",
    language: "Python",
    prTitle: "PR #189 • Concurrency lock and idempotent payment webhook",
    issueType: "Race Condition & Idempotency",
    issueSeverity: "high",
    flawedCode: [
      `# Vulnerable to double spending race conditions`,
      `async def process_payout(account_id: str, amount: float):`,
      `    balance = await db.get_balance(account_id)`,
      `    if balance >= amount:`,
      `        # Potential race window between check and debit`,
      `        await stripe_client.payout(account_id, amount)`,
      `        await db.set_balance(account_id, balance - amount)`
    ],
    fixedCode: [
      `# AI-Fixed: Atomic distributed transaction with idempotency key`,
      `async def process_payout(account_id: str, amount: float, idempotency_key: str):`,
      `    async with db.transaction():`,
      `        success = await db.atomic_decrement(account_id, amount)`,
      `        if not success: raise InsufficientBalanceError()`,
      `        return await stripe_client.payout(account_id, amount, idempotency_key)`
    ],
    suggestions: [
      {
        title: "Race Condition in Balance Check",
        description: "Concurrent requests could cause double spending without atomic lock.",
        severity: "high"
      },
      {
        title: "Missing Idempotency Key",
        description: "Network retries could charge the provider multiple times.",
        severity: "medium"
      }
    ]
  },
  {
    id: "go",
    filename: "rate_limiter.go",
    language: "Go",
    prTitle: "PR #92 • High-throughput token bucket rate limiter",
    issueType: "Memory Leak & Goroutine Lock",
    issueSeverity: "medium",
    flawedCode: [
      `// Unbounded map growth and unreleased mutex lock`,
      `func (rl *RateLimiter) Allow(clientIP string) bool {`,
      `    rl.mu.Lock() // Missing defer Unlock in early return paths`,
      `    bucket, exists := rl.buckets[clientIP]`,
      `    if !exists {`,
      `        rl.buckets[clientIP] = NewBucket(100)`,
      `    }`,
      `    return bucket.Take()`
    ],
    fixedCode: [
      `// AI-Fixed: Mutex safe with automated LRU cleanup eviction`,
      `func (rl *RateLimiter) Allow(clientIP string) bool {`,
      `    rl.mu.Lock()`,
      `    defer rl.mu.Unlock() // Guaranteed unlock on all execution paths`,
      `    `,
      `    bucket := rl.cache.GetOrCreate(clientIP, time.Minute*10)`,
      `    return bucket.Take()`
    ],
    suggestions: [
      {
        title: "Deadlock Potential: Missing Mutex Unlock",
        description: "If Take() panics or fails, the mutex remains indefinitely locked.",
        severity: "high"
      },
      {
        title: "Unbounded In-Memory Map Growth",
        description: "IP table leaks memory over time without TTL or LRU eviction.",
        severity: "medium"
      }
    ]
  }
];

const Hero = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showFixed, setShowFixed] = useState(false);
  const currentDemo = codeDemos[activeTab];

  const handleGitHubAuth = () => {
    window.location.href = getGitHubLoginUrl();
  };

  return (
    <section className="relative overflow-hidden px-4 pt-12 pb-20 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
      {/* Dynamic ambient backgrounds */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-b from-sky-500/20 via-blue-600/10 to-transparent blur-[140px]" />
      <div className="pointer-events-none absolute right-10 top-40 h-80 w-80 rounded-full bg-indigo-500/15 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        
        {/* Header content */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold text-sky-300 backdrop-blur-md shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            <span>Next-Generation AI Code Review Platform • GitHub Native</span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]">
            Automated AI Code Reviews.{" "}
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Zero merge anxiety.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Catch critical security flaws, race conditions, and performance bottlenecks before production. Built exclusively for GitHub developers.
          </p>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGitHubAuth}
              className="w-full sm:w-auto btn-github text-base px-7 py-3.5 flex items-center justify-center gap-3 group"
            >
              <GitHubIcon className="h-5 w-5 text-white transition-transform group-hover:scale-110" />
              <span>Continue with GitHub</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <a
              href="#demo"
              className="w-full sm:w-auto btn-secondary text-base px-6 py-3.5 flex items-center justify-center gap-2"
            >
              <Code2 className="h-4 w-4 text-sky-400" />
              <span>Explore Interactive Demo</span>
            </a>
          </div>

          {/* Trust stats pill */}
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Free for Personal & OSS Repos
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Zero Configuration Setup
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Powered by Advanced AST Analysis
            </span>
          </div>
        </div>

        {/* Interactive Code Review Demo Showcase */}
        <div id="demo" className="mt-14 scroll-mt-24">
          <div className="relative rounded-3xl border border-white/15 bg-slate-900/80 p-3 sm:p-5 shadow-[0_25px_70px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
            
            {/* Window titlebar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 px-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                  CodeReview AI Live Inspector
                </span>
              </div>

              {/* Language snippet selector tabs */}
              <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950/60 p-1">
                {codeDemos.map((demo, idx) => (
                  <button
                    key={demo.id}
                    onClick={() => {
                      setActiveTab(idx);
                      setShowFixed(false);
                    }}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                      activeTab === idx
                        ? "bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {demo.filename}
                  </button>
                ))}
              </div>

              {/* Toggle Fix button */}
              <button
                onClick={() => setShowFixed(!showFixed)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  showFixed
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25 hover:brightness-110"
                }`}
              >
                {showFixed ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Applied AI Patch (View Original)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Apply 1-Click AI Fix</span>
                  </>
                )}
              </button>
            </div>

            {/* PR Header Bar */}
            <div className="my-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-950/50 px-4 py-2.5 text-xs border border-white/5">
              <div className="flex items-center gap-2 text-slate-300">
                <GitPullRequest className="h-4 w-4 text-sky-400" />
                <span className="font-semibold text-white">{currentDemo.prTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                  currentDemo.issueSeverity === "critical"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}>
                  <ShieldAlert className="h-3 w-3" />
                  {currentDemo.issueType}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">Reviewed in 1.1s</span>
              </div>
            </div>

            {/* Code & Suggestions Split Grid */}
            <div className="grid gap-4 lg:grid-cols-12 mt-2">
              
              {/* Code viewer column */}
              <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 text-slate-400 text-[11px]">
                  <span>{currentDemo.filename} ({currentDemo.language})</span>
                  <span className={showFixed ? "text-emerald-400 font-sans font-semibold" : "text-amber-400 font-sans font-semibold"}>
                    {showFixed ? "● Verified Safe Patch" : "● Vulnerable Line Detected"}
                  </span>
                </div>

                <div className="pt-3 space-y-1.5 overflow-x-auto text-slate-300 leading-relaxed">
                  {(showFixed ? currentDemo.fixedCode : currentDemo.flawedCode).map((line, lIdx) => {
                    const isVulnerable = !showFixed && (lIdx === 2 || lIdx === 3 || lIdx === 6 || lIdx === 4);
                    const isFixed = showFixed && (lIdx === 2 || lIdx === 3 || lIdx === 5);
                    return (
                      <div 
                        key={lIdx}
                        className={`flex items-start gap-4 px-2 py-0.5 rounded transition-colors ${
                          isVulnerable 
                            ? "bg-rose-500/15 border-l-2 border-rose-500 text-rose-200" 
                            : isFixed 
                            ? "bg-emerald-500/15 border-l-2 border-emerald-500 text-emerald-100" 
                            : ""
                        }`}
                      >
                        <span className="w-5 shrink-0 text-slate-600 select-none text-right text-[11px] font-mono">
                          {lIdx + 1}
                        </span>
                        <pre className="font-mono text-xs whitespace-pre-wrap">{line}</pre>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Review Insights Column */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-950/30 via-slate-900/60 to-slate-950/80 p-4.5">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-sky-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
                        AI Review Findings
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {currentDemo.suggestions.length} Findings Detected
                    </span>
                  </div>

                  <div className="space-y-3 mt-3.5">
                    {currentDemo.suggestions.map((sug, sIdx) => (
                      <div
                        key={sIdx}
                        className="rounded-xl border border-white/10 bg-slate-900/80 p-3.5 transition hover:border-white/20"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-white leading-tight">{sug.title}</h4>
                          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            sug.severity === "critical"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}>
                            {sug.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                          {sug.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom CTA trigger */}
                <div className="pt-4 mt-4 border-t border-white/10">
                  <button
                    onClick={handleGitHubAuth}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500/15 border border-sky-400/40 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/25 hover:border-sky-300"
                  >
                    <GitHubIcon className="h-3.5 w-3.5" />
                    <span>Run AI Analysis on Your GitHub Repos</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Real-world metric summary bar */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-center backdrop-blur-md">
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{"<"} 1.2s</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Average Review Speed</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-center backdrop-blur-md">
            <p className="text-2xl sm:text-3xl font-extrabold text-sky-400">99.4%</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Vulnerability Accuracy</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-center backdrop-blur-md">
            <p className="text-2xl sm:text-3xl font-extrabold text-white">30+</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Supported Languages</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-center backdrop-blur-md">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">100%</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">GitHub Native & Safe</p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
