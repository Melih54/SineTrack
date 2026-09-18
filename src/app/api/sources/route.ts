import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaType = searchParams.get("mediaType");
    const tmdbIdStr = searchParams.get("tmdbId");
    const seasonNumStr = searchParams.get("seasonNum");
    const episodeNumStr = searchParams.get("episodeNum");

    // Belirli bir medya için kaynak sorgusu
    if (mediaType && tmdbIdStr) {
      const tmdbId = parseInt(tmdbIdStr, 10);
      const seasonNum = seasonNumStr !== null && seasonNumStr !== undefined ? parseInt(seasonNumStr, 10) : null;
      const episodeNum = episodeNumStr !== null && episodeNumStr !== undefined ? parseInt(episodeNumStr, 10) : null;

      const sources = await prisma.mediaSource.findMany({
        where: {
          mediaType,
          tmdbId,
          seasonNum,
          episodeNum,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ sources });
    }

    // Admin için tüm özel kaynakları listeleme
    const allSources = await prisma.mediaSource.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ sources: allSources });
  } catch (error) {
    console.error("Sources GET error:", error);
    return NextResponse.json({ error: "Kaynaklar alınamadı." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Özel kaynak eklemek için lütfen giriş yapın." }, { status: 401 });
    }

    const { mediaType, tmdbId, seasonNum, episodeNum, title, language, sourceName, url } = await req.json();

    if (!mediaType || !tmdbId || !language || !url) {
      return NextResponse.json({ error: "Gerekli alanlar doldurulmalıdır." }, { status: 400 });
    }

    const source = await prisma.mediaSource.create({
      data: {
        mediaType,
        tmdbId: Number(tmdbId),
        seasonNum: seasonNum !== undefined && seasonNum !== null ? Number(seasonNum) : null,
        episodeNum: episodeNum !== undefined && episodeNum !== null ? Number(episodeNum) : null,
        title: title || null,
        language, // "tr_dub" | "tr_sub" | "original"
        sourceName: sourceName || "Özel Kaynak",
        url: url.trim(),
      },
    });

    return NextResponse.json({ message: "Kaynak başarıyla eklendi.", source }, { status: 201 });
  } catch (error) {
    console.error("Sources POST error:", error);
    return NextResponse.json({ error: "Kaynak eklenirken bir hata oluştu." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Özel kaynak silme yetkiniz yok." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Eksik kaynak ID." }, { status: 400 });
    }

    await prisma.mediaSource.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Kaynak başarıyla silindi." });
  } catch (error) {
    console.error("Sources DELETE error:", error);
    return NextResponse.json({ error: "Kaynak silinemedi." }, { status: 500 });
  }
}
