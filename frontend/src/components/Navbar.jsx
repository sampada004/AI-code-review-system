"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import GitHubIcon from "@/components/common/github-icon";
import { apiUrl } from "@/lib/api";

const Navbar = ({ isAuthPage = false, hideSignIn = false }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        
        {/* Brand */}
        <Link 
          href="/" 
          className="group inline-flex items-center gap-2.5 text-base font-bold tracking-tight text-white transition hover:opacity-90 sm:text-lg"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-md shadow-sky-500/30">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="leading-none text-white font-extrabold tracking-tight">Inspectra <span className="text-sky-400">AI</span></span>
            <span className="text-[10px] font-medium tracking-wider uppercase text-slate-400">GitHub Native</span>
          </div>
        </Link>

        {/* Navigation Links (only when on landing page) */}
        {!isAuthPage && (
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a href="#demo" className="transition hover:text-sky-400">
              Interactive Demo
            </a>
            <a href="#how-it-works" className="transition hover:text-sky-400">
              How It Works
            </a>
            <a href="#features" className="transition hover:text-sky-400">
              Capabilities
            </a>
            <a href="#languages" className="transition hover:text-sky-400">
              Supported Languages
            </a>
          </nav>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {isAuthPage ? (
            <Link 
              href="/" 
              className="btn-secondary text-xs sm:text-sm px-4 py-2"
            >
              Back to Home
            </Link>
          ) : (
            <>
              {!hideSignIn && (
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition px-3 py-2"
                >
                  <GitHubIcon className="h-4 w-4" />
                  Sign In
                </Link>
              )}
              <button
                onClick={() => {
                  window.location.href = apiUrl("/auth/github/login");
                }}
                className="btn-primary text-xs sm:text-sm px-4 py-2 flex items-center gap-2"
              >
                <GitHubIcon className="h-4 w-4" />
                <span>Continue with GitHub</span>
                <ArrowRight className="hidden sm:inline-block h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
