export const sidebarNav = [
  { label: "Dashboard", icon: "grid", href: "/dashboard" },
  { label: "Reviews", icon: "review", href: "/reviews" },
  { label: "History", icon: "history", href: "/history" },
  { label: "Settings", icon: "settings", href: "/settings" },
];

export const activeReview = {
  title: "Current Active Review",
  status: "ANALYZING",
  repo: "infra / api-gateway-v2",
  branch: "main",
  progress: 68,
  progressLabel: "Scanning code vulnerabilities...",
  counts: [
    { label: "CRITICAL", value: "1", tone: "rose" },
    { label: "HIGH", value: "24", tone: "amber" },
    { label: "MEDIUM", value: "08", tone: "sky" },
  ],
};

export const activityRows = [
  {
    project: "auth-service-node",
    status: "Completed",
    statusTone: "green",
    issues: ["0", "2", "1", "2"],
    branch: "feature/jwt-rotation",
    timestamp: "2m ago",
  },
  {
    project: "payment-engine",
    status: "Failed",
    statusTone: "rose",
    issues: ["--"],
    branch: "hotfix/db-leak",
    timestamp: "14m ago",
  },
  {
    project: "data-pipeline-kinesis",
    status: "Analyzing",
    statusTone: "sky",
    issues: ["4", "1", "0"],
    branch: "dev",
    timestamp: "Just now",
  },
  {
    project: "user-frontend-react",
    status: "Completed",
    statusTone: "green",
    issues: ["0", "0", "1"],
    branch: "main",
    timestamp: "1h ago",
  },
];

export const quickLinks = [
  { label: "Documentation", icon: "book", href: "/landing#docs" },
  { label: "Support", icon: "headset", href: "/landing#support" },
];
