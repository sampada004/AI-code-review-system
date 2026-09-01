"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddRepoForm({ onCancel, onAdded }) {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!repositoryUrl) {
      setError("Please provide a repository URL or owner/repo");
      return;
    }

    // basic parse for owner/repo
    const parsed = parseOwnerRepo(repositoryUrl.trim());
    if (!parsed) {
      setError("Invalid repository format. Use owner/repo or a GitHub URL");
      return;
    }

    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;

      const { apiUrl } = await import("@/lib/api");
      const res = await fetch(apiUrl("/repositories"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ repository_url: repositoryUrl, default_branch: defaultBranch || "main" }),
      });

      let data = null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Unexpected server response: ${res.status} ${text.substring(0, 200)}`);
      }

      if (!res.ok) {
        throw new Error(data?.message || "Failed to add repository");
      }

      // On success, either call onAdded (modal) or navigate back to dashboard
      if (onAdded) {
        onAdded(data);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      alert(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  function parseOwnerRepo(input) {
    // accepts owner/repo or https://github.com/owner/repo or git@github.com:owner/repo.git
    try {
      const cleaned = input.replace(/\.git$/i, "");
      const githubUrl = cleaned.match(/github.com[:\/]{1,2}([^\/\s]+)\/([^\/\s]+)/i);
      if (githubUrl) return { owner: githubUrl[1], repo: githubUrl[2] };
      const simple = cleaned.match(/^([\w-_.]+)\/(?<repo>[\w-_.]+)$/);
      if (simple) return { owner: simple[1], repo: simple[2] };
      return null;
    } catch {
      return null;
    }
  }

  return (
    <section className="rounded-xl border border-white/10 bg-[#0f141f] p-6 shadow-xl">
      <h2 className="text-base font-semibold text-white">Repository Details</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Repository URL or Slug</label>
          <input
            value={repositoryUrl}
            onChange={(e) => setRepositoryUrl(e.target.value)}
            placeholder="e.g. facebook/react or https://github.com/owner/repo"
            className="w-full rounded-lg border border-white/10 bg-[#080c14] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20"
          />
          <p className="mt-1.5 text-xs text-slate-500">Supported: owner/repo or full HTTPS GitHub URL</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Default Branch (optional)</label>
          <input
            value={defaultBranch}
            onChange={(e) => setDefaultBranch(e.target.value)}
            placeholder="main"
            className="w-full rounded-lg border border-white/10 bg-[#080c14] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20"
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        ) : null}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-sky-400/40 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-sky-500/20 transition hover:brightness-110 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Connecting Repository..." : "Connect Repository"}
          </button>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
            onClick={() => {
              if (onCancel) onCancel();
              else router.push("/dashboard");
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
