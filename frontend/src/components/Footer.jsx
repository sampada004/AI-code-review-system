"use client";

import Link from "next/link";
import GitHubIcon from "@/components/common/github-icon";
import { Sparkles } from "lucide-react";
import { apiUrl } from "@/lib/api";

const Footer = () => {
  return (
    <footer className="relative border-t border-white/10 bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-white/5">
          
          {/* Brand and info */}
          <div className="space-y-3 text-center md:text-left">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-white"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-md shadow-sky-500/30">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span>Inspectra <span className="text-sky-400">AI</span></span>
            </Link>
            <p className="max-w-md text-xs sm:text-sm text-slate-400 leading-relaxed">
              Autonomous AI code review and vulnerability detection engine built natively for GitHub pull requests.
            </p>
          </div>

          {/* Operational Status Pill */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All Inspectra Review Engines Operational</span>
            </div>

            <button
              onClick={() => {
                window.location.href = apiUrl("/auth/github/login");
              }}
              className="btn-secondary text-xs px-4 py-2 flex items-center gap-2"
            >
              <GitHubIcon className="h-4 w-4" />
              <span>GitHub Login</span>
            </button>
          </div>

        </div>

        {/* Bottom links and legal */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-6">
            <a href="#demo" className="hover:text-slate-300 transition">Interactive Demo</a>
            <a href="#how-it-works" className="hover:text-slate-300 transition">How It Works</a>
            <a href="#features" className="hover:text-slate-300 transition">Capabilities</a>
            <a href="#languages" className="hover:text-slate-300 transition">Languages</a>
          </div>

          <div className="flex items-center gap-1">
            <span>© 2026 Inspectra AI. Built for GitHub developers worldwide.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
