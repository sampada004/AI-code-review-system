function IconShell({ children, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export function LogoMark({ className = "h-7 w-7" }) {
  return (
    <div
      className={`grid place-items-center rounded-lg border border-sky-400/30 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20 ${className}`}
      aria-hidden="true"
    >
      <span className="text-[11px] font-black tracking-wider text-white">IN</span>
    </div>
  );
}

export function GridIcon({ className }) {
  return (
    <IconShell className={className}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </IconShell>
  );
}

export function ReviewIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H18l2 2v12.5A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-13Z" />
      <path d="M8 9h8" />
      <path d="M8 13h4" />
    </IconShell>
  );
}

export function HistoryIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M12 8v4l3 2" />
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6.04" />
      <path d="M3 4.5v4h4" />
    </IconShell>
  );
}

export function SettingsIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M10.7 4.3a1.6 1.6 0 0 1 2.6 0l.7 1.1a1.6 1.6 0 0 0 1.4.7l1.3-.1a1.6 1.6 0 0 1 1.7 1.7l-.1 1.3a1.6 1.6 0 0 0 .7 1.4l1.1.7a1.6 1.6 0 0 1 0 2.6l-1.1.7a1.6 1.6 0 0 0-.7 1.4l.1 1.3a1.6 1.6 0 0 1-1.7 1.7l-1.3-.1a1.6 1.6 0 0 0-1.4.7l-.7 1.1a1.6 1.6 0 0 1-2.6 0l-.7-1.1a1.6 1.6 0 0 0-1.4-.7l-1.3.1a1.6 1.6 0 0 1-1.7-1.7l.1-1.3a1.6 1.6 0 0 0-.7-1.4l-1.1-.7a1.6 1.6 0 0 1 0-2.6l1.1-.7a1.6 1.6 0 0 0 .7-1.4l-.1-1.3a1.6 1.6 0 0 1 1.7-1.7l1.3.1a1.6 1.6 0 0 0 1.4-.7l.7-1.1Z" />
      <circle cx="12" cy="12" r="2.5" />
    </IconShell>
  );
}

export function SearchIcon({ className }) {
  return (
    <IconShell className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </IconShell>
  );
}

export function BellIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M15 17h4l-1.3-1.3A2 2 0 0 1 17 14.3V11a5 5 0 1 0-10 0v3.3a2 2 0 0 1-.7 1.4L5 17h4" />
      <path d="M10 17a2 2 0 0 0 4 0" />
    </IconShell>
  );
}

export function HelpIcon({ className }) {
  return (
    <IconShell className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.7 9.2A2.7 2.7 0 1 1 12 13v1" />
      <circle cx="12" cy="17" r=".5" fill="currentColor" stroke="none" />
    </IconShell>
  );
}

export function UserIcon({ className }) {
  return (
    <IconShell className={className}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </IconShell>
  );
}

export function BookIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5V5.5Z" />
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3" />
      <path d="M8 8h8" />
    </IconShell>
  );
}

export function HeadsetIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M4 13a8 8 0 1 1 16 0" />
      <path d="M5 13v3a2 2 0 0 0 2 2h2v-6H7a2 2 0 0 0-2 2Z" />
      <path d="M19 13v3a2 2 0 0 1-2 2h-2v-6h2a2 2 0 0 1 2 2Z" />
    </IconShell>
  );
}

export function KbdIcon({ className }) {
  return (
    <IconShell className={className}>
      <rect x="4" y="7" width="16" height="10" rx="2" />
      <path d="M8 10h.01M12 10h.01M16 10h.01M10 13h4" />
    </IconShell>
  );
}

export function DotsIcon({ className }) {
  return (
    <IconShell className={className}>
      <circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
    </IconShell>
  );
}

export function ExternalIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M14 5h5v5" />
      <path d="M10 14 19 5" />
      <path d="M19 11v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" />
    </IconShell>
  );
}

