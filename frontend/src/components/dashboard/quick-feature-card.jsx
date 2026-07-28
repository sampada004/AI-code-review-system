import ActionButton from "./action-button";

export default function QuickFeatureCard({ title, description }) {
  return (
    <div className="rounded-md border border-[#38404d] bg-[#161a22] px-5 py-4 shadow-[0_8px_20px_rgba(0,0,0,0.28)]">
      <h5 className="font-medium text-[#e7ebf2]">{title}</h5>
      <p className="mt-1 text-[13px] text-slate-300">{description}</p>
      <div className="mt-3">
        <ActionButton variant="primary" size="sm">Open</ActionButton>
      </div>
    </div>
  );
}
