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
