import { NextResponse } from "next/server";
import { getWorkingDomain, refreshAllDomains, StreamProvider } from "@/lib/domain-resolver";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const refresh = searchParams.get("refresh") === "true";

  if (refresh) {
    const updated = refreshAllDomains();
    return NextResponse.json({
      success: true,
      message: "Tüm yayın sitelerinin domainleri kontrol edildi ve güncellendi.",
      domains: updated,
      timestamp: new Date().toISOString(),
    });
  }

  const providers: StreamProvider[] = ["hdfilmcehennemi", "dizilla", "fullhdfilmizlesene", "dizipal"];
  const current: Record<string, string> = {};

  for (const p of providers) {
    current[p] = getWorkingDomain(p);
  }

  return NextResponse.json({
    success: true,
    domains: current,
    timestamp: new Date().toISOString(),
  });
}
