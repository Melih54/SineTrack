import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { resolveFullHDSource } from "@/lib/fullhd-resolver";
import { CURL_BIN } from "@/lib/curl";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let targetUrl = searchParams.get("url");
  const title = searchParams.get("title");
  const originalTitle = searchParams.get("originalTitle");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "sinetrack-production.up.railway.app";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${proto}://${host}`;

  // If no direct url provided, resolve by title
  if (!targetUrl && title) {
    const resolved = resolveFullHDSource(title, originalTitle);
    if (resolved) {
      targetUrl = resolved.rapidvidUrl;
    }
  }

  if (!targetUrl) {
    if (title) {
      // Fallback seamlessly to dizibal-embed!
      return NextResponse.redirect(new URL(`/api/player/dizibal-embed?${searchParams.toString()}`, baseUrl));
    }

    return new NextResponse(
      `<html><body style="background:#0b0c15;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;">
        <div>
          <h3>Atom Kaynağı Yüklenemedi</h3>
          <p style="color:#aaa;font-size:13px;">Bu film için Atom sunucusunda kayıt bulunamadı. Lütfen diğer sunuculardan birini seçin.</p>
        </div>
        <script>
          try {
            window.parent.postMessage({ type: "STREAM_ERROR", source: "atom-embed", reason: "NOT_FOUND" }, "*");
          } catch(e) {}
        </script>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    const curlCmd = `${CURL_BIN} -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Referer: https://www.fullhdfilmizlesene.now/" "${targetUrl}"`;
    let html = execSync(curlCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }).toString("utf8");

    const baseDomain = targetUrl.startsWith("https://rapidvid.org")
      ? "https://rapidvid.org/"
      : "https://rapidvid.net/";

    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head><base href="${baseDomain}">`);
    } else {
      html = `<head><base href="${baseDomain}"></head>` + html;
    }

    const injectScript = `<script>
      try {
        window.parent.postMessage({ type: "STREAM_READY", source: "atom-embed" }, "*");
        var v = document.querySelector("video");
        if (v) {
          v.addEventListener("playing", function() {
            window.parent.postMessage({ type: "STREAM_PLAYING", source: "atom-embed" }, "*");
          });
          v.addEventListener("error", function() {
            window.parent.postMessage({ type: "STREAM_ERROR", source: "atom-embed", reason: "VIDEO_ERROR" }, "*");
          });
        }
      } catch(e) {}
    </script>`;

    if (html.includes("</body>")) {
      html = html.replace("</body>", `${injectScript}</body>`);
    } else {
      html += injectScript;
    }

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    if (title) {
      return NextResponse.redirect(new URL(`/api/player/dizibal-embed?${searchParams.toString()}`, baseUrl));
    }

    return new NextResponse(
      `<html><body style="background:#0b0c15;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;">
        <div>
          <h3 style="color:#ef4444;">Atom Bağlantı Hatası</h3>
          <p style="color:#aaa;font-size:13px;">Kaynak yüklenirken hata oluştu.</p>
        </div>
        <script>
          try {
            window.parent.postMessage({ type: "STREAM_ERROR", source: "atom-embed", reason: "FETCH_ERROR" }, "*");
          } catch(e) {}
        </script>
      </body></html>`,
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
