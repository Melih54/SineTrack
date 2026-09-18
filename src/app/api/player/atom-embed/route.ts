import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { resolveFullHDSource } from "@/lib/fullhd-resolver";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let targetUrl = searchParams.get("url");
  const title = searchParams.get("title");
  const originalTitle = searchParams.get("originalTitle");

  // If no direct url provided, resolve by title
  if (!targetUrl && title) {
    const resolved = resolveFullHDSource(title, originalTitle);
    if (resolved) {
      targetUrl = resolved.rapidvidUrl;
    }
  }

  if (!targetUrl) {
    return new NextResponse(
      `<html><body style="background:#0b0c15;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;">
        <div>
          <h3>Atom Kaynağı Yüklenemedi</h3>
          <p style="color:#aaa;font-size:13px;">Bu film için Atom sunucusunda kayıt bulunamadı. Lütfen üstteki diğer sunuculardan birini seçin.</p>
        </div>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    const curlCmd = `curl.exe -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Referer: https://www.fullhdfilmizlesene.now/" "${targetUrl}"`;
    let html = execSync(curlCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }).toString("utf8");

    const baseDomain = targetUrl.startsWith("https://rapidvid.org")
      ? "https://rapidvid.org/"
      : "https://rapidvid.net/";

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
    return new NextResponse("Error fetching embed: " + error.message, { status: 500 });
  }
}
