"use client";

import { useEffect } from "react";
import { ReviewFileExplorer } from "./review-file-explorer";

export function RepositoryExplorerDrawer({ open, onClose }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close repository explorer"
        className="absolute inset-0 cursor-default bg-black/60"
        onClick={onClose}
      />
      <div
        className={`relative h-full w-[320px] max-w-[90vw] border-r border-white/8 bg-[#141821] shadow-[18px_0_40px_rgba(0,0,0,0.42)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full p-3">
          <ReviewFileExplorer />
        </div>
      </div>
    </div>
  );
}
