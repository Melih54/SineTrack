import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Bu alana sadece yöneticiler erişebilir." }, { status: 403 });
    }

    const [userCount, commentCount, ratingCount, watchedCount, sourceCount] = await Promise.all([
      prisma.user.count(),
      prisma.comment.count(),
      prisma.rating.count(),
      prisma.watchedItem.count(),
      prisma.mediaSource.count(),
    ]);

    return NextResponse.json({
      stats: {
        users: userCount,
        comments: commentCount,
        ratings: ratingCount,
        watched: watchedCount,
        sources: sourceCount,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "İstatistikler alınamadı." }, { status: 500 });
  }
}
