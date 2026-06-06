import Link from "next/link";

const reviewSignals = [
  { label: "Logic Risk", value: "Low" },
  { label: "Security", value: "2 findings" },
  { label: "Coverage", value: "+18%" },
];

const Hero = () => {
  return (
    <section className="relative overflow-hidden px-4 pb-18 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl text-center">
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-sky-100/90 backdrop-blur">
          AI-Powered Pull Request Intelligence
        </span>

        <h1 className="mx-auto mt-7 max-w-5xl text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-7xl">
          Software engineering,
          <br className="hidden sm:block" /> accelerated by AI.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-slate-300">
          CodeReview AI performs deep semantic reviews on every pull request, surfaces risky logic before
          deployment, and recommends practical fixes your team can ship immediately.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="btn-primary w-full sm:w-auto">
            Start Building For Free
          </Link>
          <Link href="/landing#docs" className="btn-secondary w-full sm:w-auto">
            Documentation
          </Link>
        </div>

        <div className="glass-card mt-14 rounded-3xl p-3 shadow-[0_28px_80px_rgba(2,6,23,0.65)] sm:p-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/85 p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
              <span className="text-[11px] tracking-wide text-slate-400">PR #2814 - payment-service/refactor</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-left shadow-inner shadow-slate-950/50">
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">Changed Snippet</p>
                <div className="space-y-2 font-mono text-xs text-slate-300">
                  <p>
                    <span className="text-cyan-300">async function</span> validateInvoice(req, res, next) {"{"}
                  </p>
                  <p className="pl-3">
                    <span className="text-violet-300">const</span> score = await riskEngine.scan(req.body)
                  </p>
                  <p className="pl-3">
                    <span className="text-violet-300">if</span> (score {'>'} 0.8) <span className="text-rose-300">return</span> block()
                  </p>
                  <p>{"}"}</p>
                </div>
              </div>

              <div className="rounded-xl border border-sky-300/30 bg-gradient-to-b from-sky-500/12 to-transparent p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-sky-200">AI Suggestions</p>
                <ul className="space-y-2 text-sm text-slate-200">
                  <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition hover:border-white/20 hover:bg-white/10">
                    Add retry backoff for transient network failures.
                  </li>
                  <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition hover:border-white/20 hover:bg-white/10">
                    Validate invoice currency before risk scoring.
                  </li>
                  <li className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-emerald-100">
                    Performance: reduce duplicate hashing in middleware.
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {reviewSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:border-sky-300/35 hover:bg-white/10"
                >
                  <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400">{signal.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{signal.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
