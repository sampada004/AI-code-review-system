"use client";

import dynamic from "next/dynamic";

// Dynamically import the Monaco-dependent details component with SSR disabled
const HistoryDetails = dynamic(() => import("./history-details"), { ssr: false });

export default function HistoryDetailsWrapper({ reviewId }) {
  return <HistoryDetails reviewId={reviewId} />;
}
