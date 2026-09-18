import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { resolveTurboSource } from "@/lib/turbofilmizle-resolver";
import { resolveDizibalSource } from "@/lib/dizibal-resolver";
import { CURL_BIN } from "@/lib/curl";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let targetUrl = searchParams.get("url");
  const title = searchParams.get("title");
  const originalTitle = searchParams.get("originalTitle");
  const tmdbId = searchParams.get("tmdbId") ? Number(searchParams.get("tmdbId")) : undefined;

  if (!targetUrl && title) {
    const resolved = resolveTurboSource(title, originalTitle);
    if (resolved) {
      targetUrl = resolved.hotstreamUrl;
    }
  }

  if (!targetUrl) {
    if (title) {
      try {
        const dizibal = await resolveDizibalSource({
          title,
          originalTitle,
          tmdbId,
          mediaType: "movie",
        });
        if (dizibal && dizibal.m3u8Url) {
          return NextResponse.redirect(new URL(`/api/player/dizibal-embed?${searchParams.toString()}`, req.url));
        }
      } catch (e) {}
    }

    return new NextResponse(
      `<!DOCTYPE html><html><body style="background:#0b0c15;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;">
        <div>
          <h3 style="color:#ef4444;margin-bottom:8px;">TurboFilm Kaynağı Bulunamadı</h3>
          <p style="color:#aaa;font-size:13px;">Bu içerik için TurboFilmizle sunucusunda kayıt bulunamadı. Lütfen oynatıcı menüsünden diğer Türk sunucularını seçin.</p>
        </div>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    const curlCmd = `${CURL_BIN} -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Referer: https://turbofilmizle.org/" --connect-timeout 8 -m 15 "${targetUrl}"`;
    let html = execSync(curlCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 16000 }).toString("utf8");

    const baseDomain = targetUrl.startsWith("https://hotstream.club")
      ? "https://hotstream.club/"
      : "https://turbofilmizle.org/";

    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head><base href="${baseDomain}">`);
    } else {
      html = `<head><base href="${baseDomain}"></head>` + html;
    }

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="background:#0b0c15;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;">
        <div>
          <h3 style="color:#ef4444;margin-bottom:8px;">Bağlantı Hatası</h3>
          <p style="color:#aaa;font-size:13px;">Kaynak yüklenirken zaman aşımı oluştu. Lütfen sayfayı yenileyin veya diğer sunucuları deneyin.</p>
        </div>
      </body></html>`,
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
