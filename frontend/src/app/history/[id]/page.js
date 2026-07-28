import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import HistoryDetailsWrapper from "@/components/history/history-details-wrapper";

export const metadata = {
  title: "Review Details | CodePilot AI",
  description: "View details of past AI code reviews",
};

export default async function HistoryDetailsPage({ params }) {
  // Await params in Next.js 15+
  const { id } = await params;

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 flex flex-col">
      <div className="lg:pl-[70px] flex-1 flex flex-col">
        <DashboardSidebar activeItem="History" collapsed={true} />

        <main className="flex-1 flex flex-col">
          <DashboardTopbar />

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1440px] h-[calc(100vh-120px)]">
              <HistoryDetailsWrapper reviewId={id} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
