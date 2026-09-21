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

  // 4. Check Dizipal
  const dizipalBase = getWorkingDomain("dizipal");
  steps.dizipalBase = dizipalBase;
  try {
    const dizipalUrl = `${dizipalBase}/bolum/breaking-bad-1x1`;
    const dizipalHtml = execFileSync(
      CURL_BIN,
      ["-s", "-L", "-A", CHROME_UA, ...BROWSER_HEADERS, "--connect-timeout", "6", "-m", "10", dizipalUrl],
      { timeout: 12000 }
    ).toString("utf8");
    steps.dizipalLength = dizipalHtml.length;
    steps.dizipalHasData = dizipalHtml.includes('data-rm-k="true"');
    steps.dizipalHasCloudflare = dizipalHtml.includes("cf-browser-verification") || dizipalHtml.includes("Attention Required") || dizipalHtml.includes("Just a moment");
    steps.dizipalSnippet = dizipalHtml.slice(0, 200);
  } catch (e: any) {
    steps.dizipalError = e.message;
  }

  return NextResponse.json(steps);
}
