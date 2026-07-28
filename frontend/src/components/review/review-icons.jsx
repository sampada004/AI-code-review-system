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

export function FolderIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h3l2 2h7a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z" />
    </IconShell>
  );
}

export function FileIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M7 3.5h6l4 4V19a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M13 3.5V8h4" />
    </IconShell>
  );
}

export function ChevronIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M9 6l6 6-6 6" />
    </IconShell>
  );
}

export function PlusIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconShell>
  );
}

export function SparkIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Z" />
    </IconShell>
  );
}

export function RefreshIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M21 12a9 9 0 10-3 6.7" />
      <path d="M21 12v6h-6" />
    </IconShell>
  );
}

