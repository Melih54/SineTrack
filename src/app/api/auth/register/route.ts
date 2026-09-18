import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Tüm alanları doldurmanız gerekmektedir." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Şifre en az 6 karakter olmalıdır." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu kullanıcı adı veya e-posta adresi zaten kullanılıyor." },
        { status: 409 }
      );
    }

    // İlk kayıt olan kullanıcı otomatik olarak Admin olsun
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
        isAdmin: isFirstUser,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
    });

    const response = NextResponse.json(
      { message: "Kayıt başarılı!", user },
      { status: 201 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Kayıt işlemi sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
