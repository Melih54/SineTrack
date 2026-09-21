import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { CURL_BIN, DEV_NULL } from "./curl";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export type StreamProvider = "hdfilmcehennemi" | "dizilla" | "fullhdfilmizlesene" | "dizipal";

interface DomainCacheEntry {
  domain: string;
  lastChecked: number;
}

const PROVIDER_SEEDS: Record<StreamProvider, string[]> = {
  hdfilmcehennemi: [
    "https://www.hdfilmcehennemi.nl",
    "https://hdfilmcehennemi.com",
    "https://hdfilmcehennemi.life",
    "https://hdfilmcehennemi.vip",
    "https://www.hdfilmcehennemi.net",
  ],
  dizilla: [
    "https://dizilla.now",
    "https://dizilla.club",
    "https://dizilla2.com",
  ],
  fullhdfilmizlesene: [
    "https://www.fullhdfilmizlesene.now",
    "https://fullhdfilmizlesene.pw",
  ],
  dizipal: [
    "https://dizipalguncel.co",
    "https://dizipal1581.com",
    "https://dizipal30.com",
  ],
};

const DEFAULT_DOMAINS: Record<StreamProvider, string> = {
  hdfilmcehennemi: "https://www.hdfilmcehennemi.nl",
  dizilla: "https://dizilla.now",
  fullhdfilmizlesene: "https://www.fullhdfilmizlesene.now",
  dizipal: "https://dizipal1581.com",
};

const CACHE_FILE = path.join(process.cwd(), "data", "active-domains.json");
const DOMAIN_TTL_MS = 60 * 60 * 1000; // 1 hour

// In-memory cache
const memoryCache = new Map<StreamProvider, DomainCacheEntry>();

function loadCacheFromFile(): Record<string, string> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (e) {}
  return {};
}

function saveCacheToFile(data: Record<string, string>) {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {}
}

/**
 * Checks a candidate URL, follows redirects, and returns the active origin URL.
 */
function probeUrl(url: string, timeoutSec: number = 9): string | null {
  try {
    const res = execFileSync(
      CURL_BIN,
      [
        "-s",
        "-o", DEV_NULL,
        "-w", "%{http_code}|%{url_effective}",
        "-L",
        "-A", CHROME_UA,
        "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "-H", "Accept-Language: tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        "--connect-timeout", "6",
        "-m", String(timeoutSec),
        url,
      ],
      { timeout: (timeoutSec + 4) * 1000 }
    )
      .toString("utf8")
      .trim();

    const [codeStr, finalUrl] = res.split("|");
    const code = parseInt(codeStr, 10);
    if (code >= 200 && code < 400 && finalUrl && finalUrl.startsWith("http")) {
      const u = new URL(finalUrl);
      return `${u.protocol}//${u.host}`;
    }
  } catch (e) {}
  return null;
}

/**
 * Resolves Dizipal by querying redirect hubs (like dizipalguncel.co) or falling back to seeds.
 */
function resolveDizipalDomain(): string {
  try {
    const html = execFileSync(
      CURL_BIN,
      [
        "-s",
        "-L",
        "-A", CHROME_UA,
        "--connect-timeout", "6",
        "-m", "10",
        "https://dizipalguncel.co",
      ],
      { timeout: 12000 }
    ).toString("utf8");

    const match = html.match(/href="([^"]*dizipal[^"]*)"/i);
    if (match) {
      const target = match[1];
      const verified = probeUrl(target, 4);
      if (verified) return verified;
    }
  } catch (e) {}

  const seeds = PROVIDER_SEEDS.dizipal;
  for (const seed of seeds) {
    const verified = probeUrl(seed, 4);
    if (verified) return verified;
  }

  return DEFAULT_DOMAINS.dizipal;
}

/**
 * Resolves the active working domain for a given provider.
 */
export function getWorkingDomain(
  provider: StreamProvider,
  options?: { forceRefresh?: boolean }
): string {
  const now = Date.now();
  const cached = memoryCache.get(provider);

  if (!options?.forceRefresh && cached && now - cached.lastChecked < DOMAIN_TTL_MS) {
    return cached.domain;
  }

  // Check persistent file on initial startup
  if (!options?.forceRefresh && !cached) {
    const fileData = loadCacheFromFile();
    if (fileData[provider]) {
      memoryCache.set(provider, { domain: fileData[provider], lastChecked: now });
      return fileData[provider];
    }
  }

  let workingDomain: string | null = null;

  if (provider === "dizipal") {
    workingDomain = resolveDizipalDomain();
  } else {
    const seeds = PROVIDER_SEEDS[provider] || [];
    for (const seed of seeds) {
      const verified = probeUrl(seed, 4);
      if (verified) {
        workingDomain = verified;
        break;
      }
    }
  }

  const finalDomain = workingDomain || DEFAULT_DOMAINS[provider];
  memoryCache.set(provider, { domain: finalDomain, lastChecked: now });

  // Update file cache
  const currentFileData = loadCacheFromFile();
  currentFileData[provider] = finalDomain;
  currentFileData.lastUpdated = new Date().toISOString();
  saveCacheToFile(currentFileData);

  return finalDomain;
}

/**
 * Runs a full check on all providers and updates the cache.
 */
export function refreshAllDomains(): Record<StreamProvider, string> {
  const results = {} as Record<StreamProvider, string>;
  const providers: StreamProvider[] = ["hdfilmcehennemi", "dizilla", "fullhdfilmizlesene", "dizipal"];

  for (const p of providers) {
    results[p] = getWorkingDomain(p, { forceRefresh: true });
  }

  return results;
}
