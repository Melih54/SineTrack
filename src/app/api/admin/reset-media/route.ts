import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Bu işlem için admin yetkisi gereklidir." }, { status: 403 });
    }

    await prisma.mediaSource.deleteMany({});
    await prisma.mediaItem.deleteMany({});
    await prisma.watchedItem.deleteMany({});
    await prisma.watchlistItem.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.rating.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "Tüm filmler, diziler, kaynaklar ve ilgili kayıtlar başarıyla sıfırlandı!",
    });
  } catch (error) {
    console.error("Reset media error:", error);
    return NextResponse.json({ error: "Veritabanı sıfırlanırken bir hata oluştu." }, { status: 500 });
  }
}
