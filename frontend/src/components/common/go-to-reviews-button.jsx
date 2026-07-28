"use client";

import { useRouter } from "next/navigation";

export default function GoToReviewsButton({ children = "Add Repository", className = "", href = "/reviews" }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={`inline-flex w-full items-center justify-center rounded-md bg-[#0f68d9] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_24px_rgba(15,104,217,0.18)] hover:bg-[#1777f0] ${className}`}
    >
      {children}
    </button>
  );
}
