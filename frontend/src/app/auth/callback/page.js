"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Authenticating with GitHub...");

  useEffect(() => {
    const token = searchParams?.get("token");
    const error = searchParams?.get("error");

    if (error) {
      setStatus("error");
      setMessage(error || "Failed to authenticate with GitHub");
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }

    if (token) {
      try {
        window.localStorage.setItem("auth_token", token);
        setStatus("success");
        setMessage("Authentication successful! Redirecting...");
        const timer = setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
        return () => clearTimeout(timer);
      } catch (err) {
        setStatus("error");
        setMessage("Failed to save authentication token.");
      }
    } else {
      setStatus("error");
      setMessage("No authentication token received.");
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-black text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.25),transparent_35%),radial-gradient(circle_at_85%_90%,rgba(14,165,233,0.15),transparent_35%)]" />
      
      <Navbar isAuthPage hideSignIn />

      <section className="relative flex flex-1 items-center justify-center px-4 py-6 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/12 bg-slate-900/65 p-8 text-center shadow-[0_24px_60px_rgba(2,6,23,0.6)] backdrop-blur-xl">
          <div className="flex justify-center mb-6">
            {status === "loading" && (
              <Loader2 className="h-12 w-12 animate-spin text-sky-400" />
            )}
            {status === "success" && (
              <CheckCircle className="h-12 w-12 text-emerald-400" />
            )}
            {status === "error" && (
              <XCircle className="h-12 w-12 text-rose-400" />
            )}
          </div>
          
          <h2 className="text-xl font-semibold tracking-tight text-white mb-2">
            {status === "loading" ? "Connecting..." : status === "success" ? "Connected" : "Error"}
          </h2>
          <p className="text-sm leading-relaxed text-slate-300">
            {message}
          </p>
        </div>
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-black text-slate-100">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
            Completing GitHub authentication...
          </div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
