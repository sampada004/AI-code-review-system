import Link from "next/link";

const Footer = () => {
  return (
    <footer className="mt-12 border-t border-white/10 bg-slate-950/60 px-4 pb-8 pt-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-4">
        <div>
          <p className="text-lg font-semibold text-white">CodeReview AI</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">
            AI review platform helping engineering teams ship secure and reliable software at startup speed.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Product</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li><a className="transition-colors hover:text-slate-100" href="#">Technology</a></li>
            <li><a className="transition-colors hover:text-slate-100" href="#">Documentation</a></li>
            <li><a className="transition-colors hover:text-slate-100" href="#">Integrations</a></li>
            <li><a className="transition-colors hover:text-slate-100" href="#">API Reference</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Company</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li><a className="transition-colors hover:text-slate-100" href="#">About</a></li>
            <li><a className="transition-colors hover:text-slate-100" href="#">Blog</a></li>
            <li><a className="transition-colors hover:text-slate-100" href="#">Security</a></li>
            <li><a className="transition-colors hover:text-slate-100" href="#">Careers</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Subscribe to updates</h3>
          <p className="mt-3 text-sm text-slate-400">Get release notes and practical AI review tips monthly.</p>
          <div className="mt-4 flex gap-2">
            <div className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-500 backdrop-blur">
              name@company.com
            </div>
            <Link href="/register" className="btn-primary px-4 py-2">
              Join
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 w-full max-w-6xl border-t border-white/10 pt-6 text-xs tracking-wide text-slate-500">
        Copyright © 2026 CodeReview AI. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
