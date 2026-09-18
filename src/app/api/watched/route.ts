import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekmektedir." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mediaType = searchParams.get("mediaType");
    const tmdbIdStr = searchParams.get("tmdbId");

    // Belirli bir film veya dizinin izlenen bölümlerini sorgula
    if (mediaType && tmdbIdStr) {
      const tmdbId = parseInt(tmdbIdStr, 10);
      const watched = await prisma.watchedItem.findMany({
        where: {
          userId: user.id,
          mediaType,
          tmdbId,
        },
      });
      return NextResponse.json({ watched });
    }

    // Kullanıcının tüm izleme geçmişi
    const allWatched = await prisma.watchedItem.findMany({
      where: { userId: user.id },
      orderBy: { watchedAt: "desc" },
    });

    return NextResponse.json({ items: allWatched });
  } catch (error) {
    console.error("Watched GET error:", error);
    return NextResponse.json({ error: "İzleme geçmişi alınamadı." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekmektedir." }, { status: 401 });
    }

    const { mediaType, tmdbId, seasonNum, episodeNum, title, posterPath, episodeTitle } = await req.json();

    if (!mediaType || !tmdbId) {
      return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });
    }

    const sNum = seasonNum !== undefined ? Number(seasonNum) : null;
    const eNum = episodeNum !== undefined ? Number(episodeNum) : null;

    // Eğer zaten işaretliyse kaldır (toggle), değilse ekle
    const existing = await prisma.watchedItem.findFirst({
      where: {
        userId: user.id,
        mediaType,
        tmdbId: Number(tmdbId),
        seasonNum: sNum,
        episodeNum: eNum,
      },
    });

    if (existing) {
      await prisma.watchedItem.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ watched: false, message: "İzlendi işareti kaldırıldı." });
    }

    const created = await prisma.watchedItem.create({
      data: {
        userId: user.id,
        mediaType,
        tmdbId: Number(tmdbId),
        seasonNum: sNum,
        episodeNum: eNum,
        title,
        posterPath,
        episodeTitle,
      },
    });

    return NextResponse.json({ watched: true, item: created, message: "İzlendi olarak işaretlendi!" });
  } catch (error) {
    console.error("Watched POST error:", error);
    return NextResponse.json({ error: "İşlem sırasında hata oluştu." }, { status: 500 });
  }
}
