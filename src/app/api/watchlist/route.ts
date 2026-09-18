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

    // Tek bir öğenin varlığını kontrol etme
    if (mediaType && tmdbIdStr) {
      const tmdbId = parseInt(tmdbIdStr, 10);
      const item = await prisma.watchlistItem.findUnique({
        where: {
          userId_mediaType_tmdbId: {
            userId: user.id,
            mediaType,
            tmdbId,
          },
        },
      });
      return NextResponse.json({ inWatchlist: !!item, item });
    }

    const items = await prisma.watchlistItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Watchlist GET error:", error);
    return NextResponse.json({ error: "Liste alınamadı." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekmektedir." }, { status: 401 });
    }

    const { mediaType, tmdbId, title, posterPath, voteAverage } = await req.json();

    if (!mediaType || !tmdbId || !title) {
      return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });
    }

    const item = await prisma.watchlistItem.upsert({
      where: {
        userId_mediaType_tmdbId: {
          userId: user.id,
          mediaType,
          tmdbId: Number(tmdbId),
        },
      },
      update: {
        title,
        posterPath,
        voteAverage: voteAverage ? Number(voteAverage) : null,
      },
      create: {
        userId: user.id,
        mediaType,
        tmdbId: Number(tmdbId),
        title,
        posterPath,
        voteAverage: voteAverage ? Number(voteAverage) : null,
      },
    });

    return NextResponse.json({ message: "Listeye eklendi.", item });
  } catch (error) {
    console.error("Watchlist POST error:", error);
    return NextResponse.json({ error: "Listeye eklenirken bir hata oluştu." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekmektedir." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mediaType = searchParams.get("mediaType");
    const tmdbIdStr = searchParams.get("tmdbId");

    if (!mediaType || !tmdbIdStr) {
      return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });
    }

    await prisma.watchlistItem.deleteMany({
      where: {
        userId: user.id,
        mediaType,
        tmdbId: parseInt(tmdbIdStr, 10),
      },
    });

    return NextResponse.json({ message: "Listeden çıkarıldı." });
  } catch (error) {
    console.error("Watchlist DELETE error:", error);
    return NextResponse.json({ error: "Listeden çıkarılırken bir hata oluştu." }, { status: 500 });
  }
}
