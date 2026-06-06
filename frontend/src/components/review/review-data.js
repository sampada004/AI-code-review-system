export const repositorySummary = {
  name: "api-gateway-v2",
  branch: "feature/review-hardening",
  commit: "8f2c1d4",
  owner: "infra-team",
};

export const explorerSections = [
  {
    title: "Repository",
    items: [
      { type: "folder", name: "src", active: false, depth: 0 },
      { type: "folder", name: "routes", active: false, depth: 1 },
      { type: "file", name: "authRoutes.js", active: false, depth: 2, status: "modified" },
      { type: "file", name: "gateway.js", active: true, depth: 2, status: "active" },
      { type: "file", name: "rateLimiter.js", active: false, depth: 2, status: "new" },
      { type: "folder", name: "middleware", active: false, depth: 1 },
      { type: "file", name: "jwtGuard.js", active: false, depth: 2, status: "modified" },
      { type: "folder", name: "tests", active: false, depth: 0 },
      { type: "file", name: "gateway.spec.js", active: false, depth: 1, status: "modified" },
    ],
  },
  {
    title: "Changed Files",
    items: [
      { type: "file", name: "gateway.js", meta: "+32 -12", status: "modified" },
      { type: "file", name: "jwtGuard.js", meta: "+12 -3", status: "modified" },
      { type: "file", name: "rateLimiter.js", meta: "new", status: "new" },
    ],
  },
];

export const suggestedFixes = [
  {
    severity: "high",
    title: "Header token parsing lacks null checks",
    description:
      "Guard against missing Authorization headers before attempting JWT verification to avoid noisy 500s.",
    file: "src/middleware/jwtGuard.js",
    actionPrimary: "Apply patch",
    actionSecondary: "Dismiss",
  },
  {
    severity: "medium",
    title: "Route rate limiter should share cache key",
    description:
      "Reuse the normalized user/session key so bursts on equivalent routes collapse into one limiter entry.",
    file: "src/routes/gateway.js",
    actionPrimary: "Open diff",
    actionSecondary: "Mark reviewed",
  },
  {
    severity: "low",
    title: "Response logging can be consolidated",
    description:
      "Move duplicate success logs into a helper so the middleware remains easier to scan.",
    file: "src/utils/logger.js",
    actionPrimary: "Accept suggestion",
    actionSecondary: "Ignore",
  },
];

export const reviewStats = [
  { label: "High Risk", value: "03", tone: "rose" },
  { label: "Medium", value: "08", tone: "amber" },
  { label: "Auto-fix", value: "05", tone: "emerald" },
];

