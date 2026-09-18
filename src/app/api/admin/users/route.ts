import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            comments: true,
            ratings: true,
            watchedItems: true,
            watchlist: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Kullanıcılar alınamadı." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
    }

    const { userId, isAdmin } = await req.json();

    if (!userId || isAdmin === undefined) {
      return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: Boolean(isAdmin) },
      select: {
        id: true,
        username: true,
        isAdmin: true,
      },
    });

    return NextResponse.json({ message: "Kullanıcı yetkisi güncellendi.", user: updated });
  } catch (error) {
    console.error("Admin users PATCH error:", error);
    return NextResponse.json({ error: "Kullanıcı güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Eksik kullanıcı ID." }, { status: 400 });
    }

    if (userId === user.id) {
      return NextResponse.json({ error: "Kendi hesabınızı admin panelinden silemezsiniz." }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: "Kullanıcı başarıyla silindi." });
  } catch (error) {
    console.error("Admin users DELETE error:", error);
    return NextResponse.json({ error: "Kullanıcı silinemedi." }, { status: 500 });
  }
}
