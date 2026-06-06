import Link from "next/link";

const CTASection = () => {
  return (
    <section className="px-4 py-18 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-sky-200/80 bg-gradient-to-r from-sky-300 to-blue-200 px-6 py-11 text-center shadow-[0_28px_70px_rgba(30,58,138,0.3)] sm:px-10">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Ship better code tonight.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-700">
          Join fast-moving engineering teams using CodeReview AI to turn every pull request into a high-confidence
          release.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="rounded-full border border-slate-900/20 bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-900 active:translate-y-0"
          >
            Create Free Account
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-slate-900/30 bg-white/60 px-6 py-3 text-sm font-semibold text-slate-800 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
