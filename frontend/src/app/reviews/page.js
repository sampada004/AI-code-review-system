import { Suspense } from "react";
import { ReviewWorkspace } from "@/components/review/review-workspace";

export const metadata = {
  title: "Reviews | Inspectra AI",
  description: "AI Code Review Workspace",
};

export default function ReviewsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#000000] text-slate-400">Loading workspace...</div>}>
      <ReviewWorkspace />
    </Suspense>
  );
}
