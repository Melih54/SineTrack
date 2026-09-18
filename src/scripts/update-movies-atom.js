const { PrismaClient } = require("@prisma/client");
const { execSync } = require("child_process");
const prisma = new PrismaClient();

function rtt(e) {
  return (e + "").replace(/[a-z]/gi, function (c) {
    return String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < "n" ? 13 : -13));
  });
}

function resolveFullHD(title, origTitle) {
  const queries = [origTitle, title].filter(Boolean);
  for (const q of queries) {
    try {
      const searchUrl = `https://www.fullhdfilmizlesene.now/arama/${encodeURIComponent(q.trim())}`;
      const curlCmd = `curl.exe -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "${searchUrl}"`;
      const html = execSync(curlCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 10000 }).toString("utf8");

      const matches = html.match(/href="https:\/\/www\.fullhdfilmizlesene\.now\/film\/([^"]+)\/"/g);
      if (!matches || matches.length === 0) continue;

      for (let i = 0; i < Math.min(3, matches.length); i++) {
        const slugMatch = matches[i].match(/film\/([^"]+)\//);
        if (!slugMatch) continue;
        const slug = slugMatch[1];

        const filmUrl = `https://www.fullhdfilmizlesene.now/film/${slug}/`;
        const filmCmd = `curl.exe -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "${filmUrl}"`;
        const filmHtml = execSync(filmCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 10000 }).toString("utf8");

        const scxMatch = filmHtml.match(/var\s+scx\s*=\s*({[\s\S]*?});/);
        if (!scxMatch) continue;

        const scx = JSON.parse(scxMatch[1]);
        if (scx.atom && scx.atom.sx && scx.atom.sx.t) {
          for (const k in scx.atom.sx.t) {
            const raw = scx.atom.sx.t[k];
            const decoded = Buffer.from(rtt(raw), "base64").toString("utf8");
            if (decoded.includes("rapidvid")) {
              return `/api/player/atom-embed?url=${encodeURIComponent(decoded)}`;
            }
          }
        }
      }
    } catch (e) {}
  }
  return null;
}

async function main() {
  const movies = await prisma.mediaItem.findMany({
    where: { mediaType: "movie" }
  });

  console.log(`Found ${movies.length} movies to update...`);

  for (const m of movies) {
    console.log(`Checking ${m.title} (${m.originalTitle || ""})...`);
    const atomUrl = resolveFullHD(m.title, m.originalTitle);
    if (atomUrl) {
      await prisma.mediaItem.update({
        where: { id: m.id },
        data: {
          dubUrl: atomUrl,
          videoUrl: atomUrl,
          subUrl: atomUrl,
        }
      });
      console.log(`  -> Updated with Atom source!`);
    } else {
      console.log(`  -> Not found on FullHDFilmizlesene`);
    }
  }

  console.log("Database update complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
