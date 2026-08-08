"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiUrl } from "@/lib/api";

const highlights = [
  "AI review suggestions in under 90 seconds",
  "Security and performance checks in every PR",
  "Works with your existing GitHub workflow",
];

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const redirectTo = searchParams.get("next") || "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const response = await fetch(apiUrl("/auth/login"), {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // persist token for client-side API calls (backend also sets httpOnly cookie)
      try {
        if (typeof window !== "undefined" && data?.token) {
          window.localStorage.setItem("auth_token", data.token);
        }
      } catch {
        // ignore storage errors
      }

      setMessage("Login successful. Redirecting...");
      router.replace(redirectTo);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-black text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.25),transparent_35%),radial-gradient(circle_at_85%_90%,rgba(14,165,233,0.15),transparent_35%)]" />

      <Navbar isAuthPage hideSignIn />

      <section className="relative flex flex-1 items-center justify-center px-4 py-6 sm:px-6">
        <div className="grid w-full max-w-5xl items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <aside className="hidden p-2 lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">CodeReview AI</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-white">
                Build faster with AI-powered code confidence.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                Join engineering teams shipping safer, cleaner code through intelligent reviews and actionable
                feedback.
              </p>
            </div>

            <ul className="mt-6 space-y-3">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-900/45 px-3 py-2.5"
                >
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-sky-300" />
                  <span className="text-sm text-slate-200">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-slate-900/45 px-3 py-2 text-center">
                <p className="text-lg font-semibold text-white">2M+</p>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Developers</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/45 px-3 py-2 text-center">
                <p className="text-lg font-semibold text-white">99.9%</p>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Uptime</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/45 px-3 py-2 text-center">
                <p className="text-lg font-semibold text-white">SOC 2</p>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Secure</p>
              </div>
            </div>
          </aside>

          <div className="w-full rounded-2xl border border-white/12 bg-slate-900/65 p-6 shadow-[0_24px_60px_rgba(2,6,23,0.6)] backdrop-blur-xl sm:p-7">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-white">Sign in to CodeReview AI</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Continue building with your developer workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => { window.location.href = apiUrl("/auth/github/login"); }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-600/70 bg-slate-800/80 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-700/80"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 19c-4 1.5-4-2-6-2m12 4v-3.9a3.3 3.3 0 0 0-.9-2.6c3-.3 6.2-1.5 6.2-6.7a5.2 5.2 0 0 0-1.4-3.6 4.8 4.8 0 0 0-.1-3.5s-1.1-.3-3.7 1.4a13 13 0 0 0-6.8 0C5.7.7 4.6 1 4.6 1a4.8 4.8 0 0 0-.1 3.5 5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.2 6.4 6.2 6.7a3.3 3.3 0 0 0-.9 2.6V21" />
              </svg>
              Continue with GitHub
            </button>

            <div className="my-5 flex items-center gap-3 text-[11px] font-semibold tracking-[0.18em] text-slate-400">
              <div className="h-px flex-1 bg-white/15" />
              <span>OR</span>
              <div className="h-px flex-1 bg-white/15" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Email</span>
                <input
                  type="email"
                  name="email"
                  defaultValue="dev@codepilot.ai"
                  className="h-11 w-full rounded-lg border border-[#32496f] bg-[#131a27] px-3 text-sm text-slate-100 outline-none transition focus:border-[#4f7bc3]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Password</span>
                <div className="flex h-11 items-center rounded-lg border border-[#32496f] bg-[#131a27] px-3">
                  <input
                    type="password"
                    name="password"
                    defaultValue="password"
                    className="w-full bg-transparent text-sm text-slate-100 outline-none"
                  />
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
              </label>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border border-[#3f5578] bg-[#111827]" />
                  Remember me
                </label>
                <a href="#" className="text-sky-300 transition hover:text-sky-200">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-1 flex h-11 w-full items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
            {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}

            <p className="mt-4 text-center text-xs text-slate-400">
              New here? <a href="/register" className="font-medium text-sky-300 hover:text-sky-200">Create account</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-black text-slate-100">
          <div className="text-sm text-slate-400">Loading sign in...</div>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
