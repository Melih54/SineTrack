import { NextResponse } from "next/server";
import { getCurrentUser, generateToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekmektedir." }, { status: 401 });
    }

    // Kullanıcıyı veritabanında Admin yap
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    // Yeni admin yetkili JWT token üret
    const token = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      isAdmin: true,
    });

    const response = NextResponse.json({
      message: "Tebrikler! Hesabınız başarıyla Yönetici (Admin) yapıldı.",
      user: updatedUser,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json({ error: "Admin yetkisi verilemedi." }, { status: 500 });
  }
}
