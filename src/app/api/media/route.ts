import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const mediaType = searchParams.get("mediaType");
    const genre = searchParams.get("genre");
    const featured = searchParams.get("featured");
    const limitStr = searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : 100;

    const where: any = {};

    if (mediaType && mediaType !== "all") {
      where.mediaType = mediaType;
    }

    if (genre && genre !== "all") {
      where.genres = { contains: genre };
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim() } },
        { originalTitle: { contains: search.trim() } },
        { overview: { contains: search.trim() } },
      ];
    }

    const items = await prisma.mediaItem.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    const totalCount = await prisma.mediaItem.count({ where });

    return NextResponse.json({ items, totalCount });
  } catch (error) {
    console.error("Media GET error:", error);
    return NextResponse.json({ error: "İçerikler alınamadı." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Film/Dizi eklemek için yönetici yetkisi gereklidir." }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      originalTitle,
      overview,
      posterPath,
      backdropPath,
      mediaType = "movie",
      releaseYear,
      voteAverage = 0,
      genres = "Genel",
      duration,
      videoUrl,
      dubUrl,
      subUrl,
      isFeatured = false,
      tmdbId,
      seasonsCount = 1,
      episodesCount = 1,
    } = body;

    if (!title || !overview) {
      return NextResponse.json({ error: "Başlık ve açıklama alanları zorunludur." }, { status: 400 });
    }

    const defaultPoster =
      posterPath ||
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80";

    const item = await prisma.mediaItem.create({
      data: {
        title: title.trim(),
        originalTitle: originalTitle?.trim() || null,
        overview: overview.trim(),
        posterPath: defaultPoster,
        backdropPath: backdropPath || null,
        mediaType,
        releaseYear: releaseYear?.toString() || new Date().getFullYear().toString(),
        voteAverage: parseFloat(voteAverage) || 0,
        genres: genres.trim(),
        duration: duration ? parseInt(duration, 10) : null,
        videoUrl: videoUrl?.trim() || null,
        dubUrl: dubUrl?.trim() || null,
        subUrl: subUrl?.trim() || null,
        isFeatured: Boolean(isFeatured),
        tmdbId: tmdbId ? parseInt(tmdbId, 10) : null,
        seasonsCount: seasonsCount ? parseInt(seasonsCount, 10) : 1,
        episodesCount: episodesCount ? parseInt(episodesCount, 10) : 1,
      },
    });

    return NextResponse.json({ message: "Film/Dizi başarıyla eklendi!", item }, { status: 201 });
  } catch (error) {
    console.error("Media POST error:", error);
    return NextResponse.json({ error: "Film/Dizi eklenirken bir hata oluştu." }, { status: 500 });
  }
}
