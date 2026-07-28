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
        className="inline-flex w-full items-center justify-center rounded-md bg-[#0f68d9] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_24px_rgba(15,104,217,0.18)] hover:bg-[#1777f0]"
      >
        Add Repository
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20">
          <div className="fixed inset-0 bg-black/60" onClick={closeModal} />

          <div className="relative z-10 w-full max-w-2xl">
            <div className="rounded-md border border-[#38404d] bg-[#161a22] px-6 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
              <div className="flex items-start justify-between">
                <h2 className="font-serif text-[18px] font-semibold text-[#e7ebf2]">Add Repository</h2>
                <button className="text-slate-400" onClick={closeModal} aria-label="Close">✕</button>
              </div>

              <div className="mt-4">
                <AddRepoForm
                  onCancel={closeModal}
                  onAdded={handleAdded}
                />

                {message ? <div className="mt-3 text-sm text-emerald-400">{message}</div> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
