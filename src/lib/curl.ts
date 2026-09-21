export const CURL_BIN = process.platform === "win32" ? "curl.exe" : "curl";
export const DEV_NULL = process.platform === "win32" ? "NUL" : "/dev/null";

export function getBaseUrl(req: Request): string {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "sinetrack-production.up.railway.app";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}
