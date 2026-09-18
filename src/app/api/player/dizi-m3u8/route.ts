import { NextResponse } from "next/server";
import { resolveSeriesEpisode } from "@/lib/series-resolver";
import { resolveHdfMovie } from "@/lib/hdfilmcehennemi-resolver";
import { execFileSync } from "child_process";
import { CURL_BIN } from "@/lib/curl";

export const dynamic = "force-dynamic";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const playlistUrl = searchParams.get("playlistUrl");
  let referer = searchParams.get("ref") || "https://dizilla.now/";

  // 1. SUB-PLAYLIST MODE (audio track or video resolution chunks playlist)
  if (playlistUrl) {
    try {
      const content = execFileSync(
        CURL_BIN,
        [
          "-s",
          "-A",
          CHROME_UA,
          "-H",
          `Referer: ${referer}`,
          playlistUrl,
        ],
        { timeout: 10000, maxBuffer: 10 * 1024 * 1024 }
      ).toString("utf8");

      const lines = content.split(/\r?\n/);
      const rewritten = lines.map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
          return `/api/player/stream-proxy?ref=${encodeURIComponent(referer)}&url=${encodeURIComponent(trimmed)}`;
        }
        if (trimmed && !trimmed.startsWith("#")) {
          const abs = new URL(trimmed, playlistUrl).href;
          return `/api/player/stream-proxy?ref=${encodeURIComponent(referer)}&url=${encodeURIComponent(abs)}`;
        }
        return line;
      });

      return new NextResponse(rewritten.join("\n"), {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch (err: any) {
      return new NextResponse("Error fetching sub-playlist: " + err.message, { status: 500 });
    }
  }

  // 2. MASTER PLAYLIST MODE
  const title = searchParams.get("title") || "";
  const originalTitle = searchParams.get("originalTitle") || null;
  const mediaType = searchParams.get("mediaType") || "tv";
  const season = parseInt(searchParams.get("season") || "1", 10);
  const episode = parseInt(searchParams.get("episode") || "1", 10);
  const lang = (searchParams.get("lang") || "tr_dub") as "tr_dub" | "tr_sub" | "original";
  let streamUrl = searchParams.get("streamUrl");

  if (!streamUrl && title) {
    if (mediaType === "movie") {
      const hdfMovie = resolveHdfMovie(title, originalTitle);
      if (hdfMovie && hdfMovie.m3u8Url) {
        streamUrl = hdfMovie.m3u8Url;
        referer = hdfMovie.referer || referer;
      }
    } else {
      const sources = resolveSeriesEpisode(title, originalTitle, season, episode);
      const matched =
        sources.find((s) => s.lang === lang && s.m3u8Url) ||
        sources.find((s) => s.m3u8Url) ||
        sources[0];

      if (matched && matched.m3u8Url) {
        streamUrl = matched.m3u8Url;
        referer = matched.referer || referer;
      }
    }
  }

  if (!streamUrl) {
    return new NextResponse("Stream URL could not be resolved", { status: 404 });
  }

  try {
    const masterContent = execFileSync(
      CURL_BIN,
      [
        "-s",
        "-A",
        CHROME_UA,
        "-H",
        `Referer: ${referer}`,
        streamUrl,
      ],
      { timeout: 10000, maxBuffer: 10 * 1024 * 1024 }
    ).toString("utf8");

    // Rewrite master playlist lines
    const lines = masterContent.split(/\r?\n/);
    const rewritten = lines.map((line) => {
      let l = line.trim();

      // Audio track rewriting
      if (l.startsWith("#EXT-X-MEDIA:TYPE=AUDIO")) {
        const lowerLine = l.toLowerCase();
        const isTr =
          lowerLine.includes('language="tr"') ||
          lowerLine.includes('name="türkçe"') ||
          lowerLine.includes('name="turkish"');
        const makeDefault = (lang === "tr_dub" && isTr) || (lang !== "tr_dub" && !isTr);

        l = l
          .replace(/DEFAULT=(YES|NO)/g, makeDefault ? "DEFAULT=YES" : "DEFAULT=NO")
          .replace(/AUTOSELECT=(YES|NO)/g, makeDefault ? "AUTOSELECT=YES" : "AUTOSELECT=NO");

        l = l.replace(/URI="([^"]+)"/, (_, uri) => {
          const absUri = uri.startsWith("http") ? uri : new URL(uri, streamUrl).href;
          return `URI="/api/player/dizi-m3u8?playlistUrl=${encodeURIComponent(absUri)}&ref=${encodeURIComponent(referer)}"`;
        });
        return l;
      }

      // Video playlist URL rewriting
      if (l.startsWith("http://") || l.startsWith("https://")) {
        return `/api/player/dizi-m3u8?playlistUrl=${encodeURIComponent(l)}&ref=${encodeURIComponent(referer)}`;
      } else if (l && !l.startsWith("#")) {
        const absUrl = new URL(l, streamUrl).href;
        return `/api/player/dizi-m3u8?playlistUrl=${encodeURIComponent(absUrl)}&ref=${encodeURIComponent(referer)}`;
      }

      return l;
    });

    return new NextResponse(rewritten.join("\n"), {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch (err: any) {
    return new NextResponse("Error fetching master m3u8: " + err.message, { status: 500 });
  }
}
