import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaType = searchParams.get("mediaType");
    const tmdbIdStr = searchParams.get("tmdbId");

    if (mediaType && tmdbIdStr) {
      const tmdbId = parseInt(tmdbIdStr, 10);
      
      // Genel ortalama hesaplama
      const allRatings = await prisma.rating.findMany({
        where: { mediaType, tmdbId },
      });

      const count = allRatings.length;
      const average = count > 0 ? (allRatings.reduce((acc, r) => acc + r.score, 0) / count).toFixed(1) : null;

      // Kullanıcının kendi puanı (eğer oturum açıksa)
      const user = await getCurrentUser();
      let userRating = null;
      if (user) {
        const myRating = await prisma.rating.findUnique({
          where: {
            userId_mediaType_tmdbId: {
              userId: user.id,
              mediaType,
              tmdbId,
            },
          },
        });
        userRating = myRating ? myRating.score : null;
      }

      return NextResponse.json({ average, count, userRating });
    }

    // Kullanıcının verdiği tüm puanlar
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekmektedir." }, { status: 401 });
    }

    const myRatings = await prisma.rating.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ ratings: myRatings });
  } catch (error) {
    console.error("Ratings GET error:", error);
    return NextResponse.json({ error: "Puanlar alınamadı." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Puan vermek için giriş yapmalısınız." }, { status: 401 });
    }

    const { mediaType, tmdbId, score, title, posterPath } = await req.json();

    if (!mediaType || !tmdbId || score === undefined) {
      return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });
    }

    const parsedScore = Math.min(Math.max(Number(score), 1), 10);

    const rating = await prisma.rating.upsert({
      where: {
        userId_mediaType_tmdbId: {
          userId: user.id,
          mediaType,
          tmdbId: Number(tmdbId),
        },
      },
      update: {
        score: parsedScore,
        title,
        posterPath,
      },
      create: {
        userId: user.id,
        mediaType,
        tmdbId: Number(tmdbId),
        score: parsedScore,
        title,
        posterPath,
      },
    });

    return NextResponse.json({ message: "Puanınız kaydedildi!", rating });
  } catch (error) {
    console.error("Ratings POST error:", error);
    return NextResponse.json({ error: "Puan kaydedilemedi." }, { status: 500 });
  }
}
