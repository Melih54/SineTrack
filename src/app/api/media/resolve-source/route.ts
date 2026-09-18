import { NextResponse } from "next/server";
import { resolveFullHDSource } from "@/lib/fullhd-resolver";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "";
  const originalTitle = searchParams.get("originalTitle") || "";
  const tmdbId = searchParams.get("tmdbId");

  if (!title && !originalTitle) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  // 1. Check if mediaItem already has an atom embedUrl or rapidvidUrl saved
  if (tmdbId) {
    const existing = await prisma.mediaItem.findUnique({
      where: { tmdbId: Number(tmdbId) },
    });
    if (existing && existing.dubUrl && existing.dubUrl.includes("atom-embed")) {
      return NextResponse.json({ source: existing.dubUrl, cached: true });
    }
  }

  // 2. Resolve on the fly
  const resolved = resolveFullHDSource(title, originalTitle);
  if (!resolved) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  // 3. Save to database if tmdbId is present
  if (tmdbId) {
    try {
      await prisma.mediaItem.update({
        where: { tmdbId: Number(tmdbId) },
        data: {
          dubUrl: resolved.embedUrl,
          videoUrl: resolved.embedUrl,
        },
      });
    } catch {}
  }

  return NextResponse.json({
    source: resolved.embedUrl,
    rapidvidUrl: resolved.rapidvidUrl,
    slug: resolved.slug,
  });
}
