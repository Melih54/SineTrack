import { NextResponse } from "next/server";
import { execFileSync } from "child_process";
import { CURL_BIN, CHROME_UA, BROWSER_HEADERS } from "@/lib/curl";
import { getWorkingDomain } from "@/lib/domain-resolver";
import { resolveHdfSeriesEpisode } from "@/lib/hdfilmcehennemi-resolver";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const steps: Record<string, any> = {};

  // 1. Check curl binary version & environment
  try {
    steps.curlVersion = execFileSync(CURL_BIN, ["--version"]).toString("utf8").split("\n")[0];
  } catch (e: any) {
    steps.curlVersion = "ERROR: " + e.message;
  }

  // 2. Check Dizilla
  const dizillaBase = getWorkingDomain("dizilla");
  steps.dizillaBase = dizillaBase;
  const dizillaUrl = `${dizillaBase}/breaking-bad-1-sezon-1-bolum`;
  steps.dizillaUrl = dizillaUrl;

  try {
    const dizillaHtml = execFileSync(
      CURL_BIN,
      ["-s", "-L", "-A", CHROME_UA, ...BROWSER_HEADERS, "--connect-timeout", "6", "-m", "10", dizillaUrl],
      { timeout: 12000 }
    ).toString("utf8");

    steps.dizillaLength = dizillaHtml.length;
    steps.dizillaHasNextData = dizillaHtml.includes('id="__NEXT_DATA__"');
    steps.dizillaHasCloudflare = dizillaHtml.includes("cf-browser-verification") || dizillaHtml.includes("Attention Required") || dizillaHtml.includes("Just a moment");
    steps.dizillaSnippet = dizillaHtml.slice(0, 300);
  } catch (e: any) {
    steps.dizillaError = e.message;
  }

  // 3. Check HDFilmCehennemi
  const hdfBase = getWorkingDomain("hdfilmcehennemi");
  steps.hdfBase = hdfBase;
  const hdfSteps: Record<string, any> = {};
  steps.hdfSteps = hdfSteps;

  try {
    const searchUrl = `${hdfBase}/search?q=${encodeURIComponent("Breaking Bad")}`;
    hdfSteps.searchUrl = searchUrl;

    const raw = execFileSync(
      CURL_BIN,
      [
        "-s",
        "-L",
        "-A", CHROME_UA,
        ...BROWSER_HEADERS,
        "-H", "X-Requested-With: fetch",
        "-H", `Referer: ${hdfBase}/`,
        "--connect-timeout", "8",
        "-m", "14",
        searchUrl,
      ],
      { timeout: 15000 }
    ).toString("utf8");

    hdfSteps.rawSearchLength = raw.length;
    hdfSteps.rawSearchSnippet = raw.slice(0, 200);

    try {
      const json = JSON.parse(raw);
      hdfSteps.resultsCount = json.results?.length || 0;
      hdfSteps.firstResultSnippet = json.results?.[0]?.slice(0, 150);
    } catch (je: any) {
      hdfSteps.jsonParseError = je.message;
    }

    const hdf = resolveHdfSeriesEpisode("Breaking Bad", "Breaking Bad", 1, 1);
    steps.hdfResolved = !!hdf?.m3u8Url;
    steps.hdfStreamUrl = hdf?.m3u8Url?.slice(0, 50);
  } catch (e: any) {
    steps.hdfError = e.message;
  }

  // 5. Probe candidates
  const candidates = [
    "https://www.fullhdfilmizlesene.now/film-ara?kelime=breaking+bad",
    "https://filmmodu.org/dizi/breaking-bad-izle",
    "https://filmmodu.cx/dizi/breaking-bad-izle",
    "https://sezonlukdizi.vip/diziler/breaking-bad.html",
    "https://sezonlukdizi.net/diziler/breaking-bad.html",
    "https://sezonlukdizi.org/diziler/breaking-bad.html",
    "https://diziyo.org/dizi/breaking-bad",
    "https://diziyou.co/dizi/breaking-bad",
    "https://sinefy.cc/dizi/breaking-bad",
    "https://webteizle.vip/dizi/breaking-bad",
    "https://720p-izle.com/dizi/breaking-bad",
    "https://filmakinesi.net/dizi/breaking-bad-izle.html",
    "https://vidsrc.cc/v2/embed/tv/1396/1/1",
    "https://vidsrc.xyz/embed/tv?tmdb=1396&season=1&episode=1",
    "https://player.videasy.net/tv/1396/1/1",
    "https://vidlink.pro/tv/1396/1/1",
    "https://autoembed.co/tv/tmdb/1396-1-1",
  ];

  const probeResults: Record<string, any> = {};
  for (const url of candidates) {
    try {
      const out = execFileSync(
        CURL_BIN,
        [
          "-s",
          "-o", "/dev/null",
          "-w", "%{http_code}|%{size_download}",
          "-L",
          "-A", CHROME_UA,
          ...BROWSER_HEADERS,
          "--connect-timeout", "4",
          "-m", "6",
          url,
        ],
        { timeout: 8000 }
      ).toString("utf8").trim();
      probeResults[url] = out;
    } catch (e: any) {
      probeResults[url] = "ERROR: " + e.message;
    }
  }
  steps.probeResults = probeResults;

  return NextResponse.json(steps);
}
