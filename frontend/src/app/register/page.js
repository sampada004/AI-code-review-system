"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiUrl } from "@/lib/api";

const highlights = [
  "Smart AI code reviews on every pull request",
  "Security and performance insights before merge",
  "Team-aware suggestions tuned to your workflow",
];

const RegisterPage = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const payload = {
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      password,
    };

    try {
      const response = await fetch(apiUrl("/auth/register"), {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Registration failed");
      }

      setMessage("Account created. Redirecting to login...");
      router.push("/login");
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-black text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.25),transparent_35%),radial-gradient(circle_at_85%_90%,rgba(14,165,233,0.15),transparent_35%)]" />

      <Navbar isAuthPage hideSignIn />

      <section className="relative flex h-[calc(100vh-66px)] items-center justify-center px-4 py-3 sm:px-6">
        <div className="grid w-full max-w-6xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <aside className="hidden lg:block">
            <div className="mx-auto max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">CodeReview AI</p>
              <h2 className="mt-2.5 text-3xl font-semibold leading-[1.12] tracking-tight text-white">
                Create your workspace and ship better code faster.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Join modern engineering teams using AI-assisted reviews to improve quality and velocity from day one.
              </p>

              <ul className="mt-5 space-y-2.5">
                {highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-900/45 px-3.5 py-2.5"
                  >
                    <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.7)]" />
                    <span className="text-sm text-slate-200">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-white/10 bg-slate-900/45 px-3 py-2.5 text-center">
                  <p className="text-lg font-semibold text-white">2M+</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-slate-400">Developers</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/45 px-3 py-2.5 text-center">
                  <p className="text-lg font-semibold text-white">99.9%</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-slate-400">Uptime</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/45 px-3 py-2.5 text-center">
                  <p className="text-lg font-semibold text-white">SOC 2</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-slate-400">Secure</p>
                </div>
              </div>
            </div>
          </aside>

          <div className="mx-auto w-full max-w-md rounded-2xl border border-white/25 border-b-white/45 bg-slate-900/70 p-4.5 shadow-[0_26px_65px_rgba(2,6,23,0.62)] backdrop-blur-xl sm:p-5">
            <div className="mb-4 text-center">
              <h1 className="text-[1.35rem] font-semibold tracking-tight text-white">Create your account</h1>
              <p className="mt-1 text-sm text-slate-300">Start your AI code review workspace.</p>
            </div>

            <button
              type="button"
              className="flex h-9.5 w-full items-center justify-center gap-2 rounded-xl border border-slate-600/70 bg-slate-800/85 text-[13px] font-semibold text-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-700/85"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 19c-4 1.5-4-2-6-2m12 4v-3.9a3.3 3.3 0 0 0-.9-2.6c3-.3 6.2-1.5 6.2-6.7a5.2 5.2 0 0 0-1.4-3.6 4.8 4.8 0 0 0-.1-3.5s-1.1-.3-3.7 1.4a13 13 0 0 0-6.8 0C5.7.7 4.6 1 4.6 1a4.8 4.8 0 0 0-.1 3.5 5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.2 6.4 6.2 6.7a3.3 3.3 0 0 0-.9 2.6V21" />
              </svg>
              Continue with GitHub
            </button>

            <div className="my-3.5 flex items-center gap-3 text-[10px] font-semibold tracking-[0.18em] text-slate-400">
              <div className="h-px flex-1 bg-white/15" />
              <span>OR</span>
              <div className="h-px flex-1 bg-white/15" />
            </div>

            <form className="space-y-2.5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Full Name</span>
                <input
                  type="text"
                  name="full_name"
                  placeholder="Linus Torvalds"
                  className="h-9.5 w-full rounded-xl border border-[#32496f] bg-[#131a27] px-3 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-[#4f7bc3] focus:ring-2 focus:ring-sky-500/20"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Email</span>
                <input
                  type="email"
                  name="email"
                  placeholder="dev@codepilot.ai"
                  className="h-9.5 w-full rounded-xl border border-[#32496f] bg-[#131a27] px-3 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-[#4f7bc3] focus:ring-2 focus:ring-sky-500/20"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Password</span>
                <div className="flex h-9.5 items-center rounded-xl border border-[#32496f] bg-[#131a27] px-3 transition-all duration-200 focus-within:border-[#4f7bc3] focus-within:ring-2 focus-within:ring-sky-500/20">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a strong password"
                    className="w-full bg-transparent text-[13px] text-slate-100 outline-none placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="ml-2 rounded-md p-1 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Confirm Password</span>
                <div className="flex h-9.5 items-center rounded-xl border border-[#32496f] bg-[#131a27] px-3 transition-all duration-200 focus-within:border-[#4f7bc3] focus-within:ring-2 focus-within:ring-sky-500/20">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    className="w-full bg-transparent text-[13px] text-slate-100 outline-none placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="ml-2 rounded-md p-1 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-1 flex h-9.5 w-full items-center justify-center rounded-xl text-[13px] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>

            {error ? <p className="mt-3 text-center text-sm text-rose-300">{error}</p> : null}
            {message ? <p className="mt-3 text-center text-sm text-emerald-300">{message}</p> : null}

            <p className="mt-3.5 text-center text-[11px] text-slate-400">
              Already have an account? <a href="/login" className="font-medium text-sky-300 hover:text-sky-200">Sign in</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default RegisterPage;
