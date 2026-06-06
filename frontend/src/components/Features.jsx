const features = [
  {
    title: "Deep Logic Analysis",
    description:
      "Understands execution paths and edge conditions to catch subtle bugs human reviewers miss.",
    detail: "Flow-Sensitive Reasoning",
  },
  {
    title: "Automated Audits",
    description:
      "Continuously scans for security flaws, performance regressions, and dependency risk across repos.",
    detail: "OWASP + CWE Checks",
  },
  {
    title: "CI Integration",
    description:
      "Runs natively in GitHub Actions and major CI pipelines with policy gates your team can trust.",
    detail: "Pipeline-Ready",
  },
  {
    title: "Collaborative Context",
    description:
      "Learns from code history and review patterns so every recommendation matches your engineering style.",
    detail: "Team-Aware Suggestions",
  },
];

const Features = () => {
  return (
    <section className="px-4 py-18 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-sky-200">Built for modern teams</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Everything needed for high-confidence merges
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-300/45 hover:shadow-[0_20px_50px_rgba(2,6,23,0.55)]"
            >
              <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-sky-400/10 blur-2xl transition group-hover:bg-sky-400/20" />
              <div className="relative">
                <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
                  0{index + 1}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.description}</p>
                <div className="mt-5 h-px bg-gradient-to-r from-sky-300/60 via-white/20 to-transparent" />
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-sky-200">{feature.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
