import { NextResponse } from "next/server";
import { getSeasonDetails } from "@/lib/tmdb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tvIdStr = searchParams.get("tvId");
    const seasonStr = searchParams.get("season");

    if (!tvIdStr || !seasonStr) {
      return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });
    }

    const tvId = parseInt(tvIdStr, 10);
    const season = parseInt(seasonStr, 10);

    const episodes = await getSeasonDetails(tvId, season);
    return NextResponse.json({ episodes });
  } catch (error) {
    console.error("Season episodes API error:", error);
    return NextResponse.json({ episodes: [] }, { status: 500 });
  }
}
