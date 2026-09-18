import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const item = await prisma.mediaItem.findFirst({
      where: {
        OR: [
          { id },
          { tmdbId: isNaN(Number(id)) ? -1 : Number(id) },
        ],
      },
    });

    if (!item) {
      return NextResponse.json({ error: "İçerik bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Media GET [id] error:", error);
    return NextResponse.json({ error: "İçerik alınamadı." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.mediaItem.update({
      where: { id },
      data: {
        ...body,
        voteAverage: body.voteAverage ? parseFloat(body.voteAverage) : undefined,
        duration: body.duration ? parseInt(body.duration, 10) : undefined,
        seasonsCount: body.seasonsCount ? parseInt(body.seasonsCount, 10) : undefined,
        episodesCount: body.episodesCount ? parseInt(body.episodesCount, 10) : undefined,
      },
    });

    return NextResponse.json({ message: "İçerik başarıyla güncellendi!", item: updated });
  } catch (error) {
    console.error("Media PATCH error:", error);
    return NextResponse.json({ error: "İçerik güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
    }

    const { id } = await params;

    await prisma.mediaItem.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Film/Dizi başarıyla silindi." });
  } catch (error) {
    console.error("Media DELETE error:", error);
    return NextResponse.json({ error: "İçerik silinemedi." }, { status: 500 });
  }
}
