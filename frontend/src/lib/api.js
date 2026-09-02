export function getApiBase() {
  // At runtime in the browser, NEXT_PUBLIC_API_URL will be inlined by Next.js
  return typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
    : (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "") : "");
}

export function apiUrl(path) {
  const base = getApiBase();
  if (!base) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function getGitHubLoginUrl() {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "Ov23liJYJqQciQXHOTs0";
  const apiBase = getApiBase();
  const redirectUri = apiBase 
    ? `${apiBase}/auth/github/callback` 
    : "http://localhost:5000/api/auth/github/callback";
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user%20user:email%20repo`;
}
