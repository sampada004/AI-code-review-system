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
    <section className="rounded-md border border-[#38404d] bg-[#161a22] px-6 py-6">
      <h2 className="font-semibold text-[#e7ebf2]">Add Repository</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Repository URL</label>
          <input
            value={repositoryUrl}
            onChange={(e) => setRepositoryUrl(e.target.value)}
            placeholder="https://github.com/owner/repo or owner/repo"
            className="w-full rounded-md border border-[#2b313a] bg-[#0f1418] px-3 py-2 text-slate-200"
          />
          <p className="mt-2 text-xs text-slate-400">Example: owner/repo or https://github.com/owner/repo</p>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Default Branch (optional)</label>
          <input
            value={defaultBranch}
            onChange={(e) => setDefaultBranch(e.target.value)}
            placeholder="main"
            className="w-full rounded-md border border-[#2b313a] bg-[#0f1418] px-3 py-2 text-slate-200"
          />
        </div>

        {error ? <div className="text-sm text-rose-400">{error}</div> : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-gradient-to-b from-[#0f68d9] to-[#0b57c6] px-4 py-2 text-sm font-medium text-white shadow-lg hover:brightness-105"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Repository"}
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-transparent border border-[#2b313a] px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
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
