import {
  BookIcon,
  GridIcon,
  HeadsetIcon,
  HistoryIcon,
  LogoMark,
  ReviewIcon,
  SettingsIcon,
} from "./dashboard-icons";
import { quickLinks, sidebarNav } from "./dashboard-data";

const iconMap = {
  grid: GridIcon,
  review: ReviewIcon,
  history: HistoryIcon,
  settings: SettingsIcon,
  book: BookIcon,
  headset: HeadsetIcon,
};

export function DashboardSidebar({
  activeItem = "Dashboard",
  collapsed = false,
  workspaceMode = false,
  mobileOpen = true,
}) {
  if (!workspaceMode) {
    return (
      <aside className="w-full border-r border-white/8 bg-[#141821] text-slate-200 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-72">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/6 px-4 py-5">
            <div className="flex items-center gap-3">
              <LogoMark />
              <div>
                <div className="text-[18px] font-semibold tracking-[-0.02em] text-[#dfe6f2]">
                  CodePilot AI
                </div>
                <div className="text-[11px] text-slate-400">Developer Dashboard</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4">
            <div className="space-y-1.5">
              {sidebarNav.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive = item.label === activeItem;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-[4px] px-3 py-2 text-[13px] transition-colors ${
                      isActive
                        ? "bg-[#4b525c] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-white/8 px-4 py-4">
            <div className="space-y-2">
              {quickLinks.map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 rounded-[4px] px-2 py-2 text-[12px] text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-[10px] bg-[#0e1218] px-3 py-3">
              <div className="h-8 w-8 rounded-full border border-sky-400/25 bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.55),rgba(14,23,37,0.95))]" />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-slate-100">Alex Chen</div>
                <div className="text-[11px] leading-tight text-slate-400">PREMIUM DEV</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 border-r border-white/8 bg-[#141821] text-slate-200 transition-transform duration-300 ease-out lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      } ${collapsed ? "lg:w-[70px]" : "lg:w-[240px]"} w-[240px]`}
      style={{ width: collapsed ? "70px" : "240px" }}
      data-mobile-open={mobileOpen ? "true" : "false"}
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-white/6 px-4 py-5">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <LogoMark />
            {!collapsed ? (
              <div>
                <div className="text-[18px] font-semibold tracking-[-0.02em] text-[#dfe6f2]">
                  CodePilot AI
                </div>
                <div className="text-[11px] text-slate-400">Developer Dashboard</div>
              </div>
            ) : null}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1.5">
            {sidebarNav.map((item) => {
              const Icon = iconMap[item.icon];
              const isActive = item.label === activeItem;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center rounded-[4px] px-3 py-2 text-[13px] transition-colors ${
                    isActive
                      ? "bg-[#4b525c] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className={`flex items-center ${collapsed ? "w-full justify-center" : "gap-3"}`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed ? <span>{item.label}</span> : null}
                  </span>
                </a>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/8 px-4 py-4">
          <div className="space-y-2">
            {quickLinks.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center rounded-[4px] px-2 py-2 text-[12px] text-slate-300 transition-colors hover:bg-white/5 hover:text-white ${
                    collapsed ? "justify-center" : "gap-3"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {!collapsed ? <span>{item.label}</span> : null}
                </a>
              );
            })}
          </div>

          <div className={`mt-4 flex items-center rounded-[10px] bg-[#0e1218] px-3 py-3 ${collapsed ? "justify-center" : "gap-3"}`}>
            <div className="h-8 w-8 rounded-full border border-sky-400/25 bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.55),rgba(14,23,37,0.95))]" />
            {!collapsed ? (
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-slate-100">Alex Chen</div>
                <div className="text-[11px] leading-tight text-slate-400">PREMIUM DEV</div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
