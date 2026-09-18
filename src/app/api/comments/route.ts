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

    if (!mediaType || !tmdbIdStr) {
      return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });
    }

    const tmdbId = parseInt(tmdbIdStr, 10);
    const seasonNum = seasonNumStr !== null ? parseInt(seasonNumStr, 10) : null;
    const episodeNum = episodeNumStr !== null ? parseInt(episodeNumStr, 10) : null;

    const comments = await prisma.comment.findMany({
      where: {
        mediaType,
        tmdbId,
        seasonNum,
        episodeNum,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Comments GET error:", error);
    return NextResponse.json({ error: "Yorumlar alınamadı." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Yorum yapmak için giriş yapmalısınız." }, { status: 401 });
    }

    const { mediaType, tmdbId, content, seasonNum, episodeNum } = await req.json();

    if (!mediaType || !tmdbId || !content || content.trim().length === 0) {
      return NextResponse.json({ error: "Yorum içeriği boş olamaz." }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        mediaType,
        tmdbId: Number(tmdbId),
        seasonNum: seasonNum !== undefined ? Number(seasonNum) : null,
        episodeNum: episodeNum !== undefined ? Number(episodeNum) : null,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ message: "Yorum eklendi.", comment }, { status: 201 });
  } catch (error) {
    console.error("Comments POST error:", error);
    return NextResponse.json({ error: "Yorum eklenemedi." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekmektedir." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("id");

    if (!commentId) {
      return NextResponse.json({ error: "Geçersiz yorum ID." }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: "Yorum bulunamadı." }, { status: 404 });
    }

    if (comment.userId !== user.id) {
      return NextResponse.json({ error: "Bu yorumu silme yetkiniz yok." }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ message: "Yorum silindi." });
  } catch (error) {
    console.error("Comments DELETE error:", error);
    return NextResponse.json({ error: "Yorum silinemedi." }, { status: 500 });
  }
}
