"use client";

import { useState } from "react";
import AddRepoForm from "./add-repo-form";

export default function AddRepoModal({ className = "" }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  function openModal() {
    setMessage(null);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  async function handleAdded(data) {
    // show success briefly, close modal and notify other components to refresh
    setMessage("Repository added successfully");
    // dispatch global event so RecentRepos can refresh
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("repositories:changed", { detail: data }));
    }
    // small delay so user sees message
    setTimeout(() => {
      setMessage(null);
      closeModal();
    }, 700);
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-sky-400/40 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-500/20 transition hover:brightness-110"
      >
        <span>+ Connect Repository</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative z-10 w-full max-w-xl">
            <div className="rounded-2xl border border-white/15 bg-[#0f141f] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-lg font-bold text-white tracking-tight">Connect Repository</h2>
                <button 
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition" 
                  onClick={closeModal} 
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4">
                <AddRepoForm
                  onCancel={closeModal}
                  onAdded={handleAdded}
                />

                {message ? (
                  <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-300 text-center">
                    {message}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
