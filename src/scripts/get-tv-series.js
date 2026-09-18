const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const series = await prisma.mediaItem.findMany({
    where: { mediaType: "tv" },
    select: { id: true, title: true, originalTitle: true, tmdbId: true }
  });
  console.log("TV Series in Database:");
  console.log(JSON.stringify(series, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
