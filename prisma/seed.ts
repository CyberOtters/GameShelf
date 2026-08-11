import "dotenv/config";
import { DEMO_ACCOUNT } from "../src/server/lib/demoAccount.ts";
import { auth } from "../src/server/lib/auth.ts";
import { prisma } from "../src/server/lib/prisma.ts";
import { igdbCoverUrl, searchIgdbGames } from "../src/server/lib/igdb.ts";
import { GameStatus, Priority } from "../generated/prisma/enums.ts";

/**
 * Cover art is looked up from IGDB at seed time rather than hard-coded, so the
 * demo shelf shows the same images the add-game form would have saved. IGDB
 * needs TWITCH_CLIENT_ID/SECRET; without them (or if the API is down) the seed
 * still runs and the games just come out coverless.
 */
async function fetchCoverUrls(titles: string[]) {
  const covers = new Map<string, string | null>(
    titles.map((title) => [title, null]),
  );

  try {
    await Promise.all(
      titles.map(async (title) => {
        const results = await searchIgdbGames(title, 5);
        // IGDB's fuzzy search puts near-misses first often enough that an exact
        // name match is worth preferring before falling back to the top hit.
        const match =
          results.find(
            (game) => game.name.toLowerCase() === title.toLowerCase(),
          ) ?? results[0];
        covers.set(title, igdbCoverUrl(match?.cover));
      }),
    );
  } catch (error) {
    console.warn(
      "Could not fetch IGDB covers, seeding without them:",
      error instanceof Error ? error.message : error,
    );
  }

  return covers;
}

async function resetDemoUser() {
  await prisma.user.deleteMany({ where: { email: DEMO_ACCOUNT.email } });
}

async function ensureDemoUser() {
  const created = await auth.api.signUpEmail({
    body: {
      name: DEMO_ACCOUNT.name,
      email: DEMO_ACCOUNT.email,
      password: DEMO_ACCOUNT.password,
    },
  });

  return created.user.id;
}

async function main() {
  console.log("Seeding GameShelf demo data…");

  await resetDemoUser();
  const userId = await ensureDemoUser();

  const gameSeeds = [
    {
      title: "Metroid Prime 4: Beyond",
      platform: "Nintendo Switch",
      status: GameStatus.WISHLIST,
      priority: Priority.HIGH,
      notes: "Day-one pickup when it lands.",
    },
    {
      title: "Balatro",
      platform: "PC",
      status: GameStatus.BACKLOG,
      priority: Priority.MEDIUM,
      notes: "Everyone keeps recommending this one.",
    },
    {
      title: "Hollow Knight",
      platform: "Nintendo Switch",
      status: GameStatus.PLAYING,
      priority: Priority.HIGH,
      rating: 9,
      notes: "Deep in Crystal Peak.",
    },
    {
      title: "Super Mario Odyssey",
      platform: "Nintendo Switch",
      status: GameStatus.COMPLETED,
      priority: Priority.LOW,
      rating: 10,
      notes: "100% moons collected.",
    },
    {
      title: "Cyberpunk 2077",
      platform: "PC",
      status: GameStatus.DROPPED,
      priority: Priority.LOW,
      notes: "Might revisit after Phantom Liberty.",
    },
    {
      title: "The Legend of Zelda: Tears of the Kingdom",
      platform: "Nintendo Switch",
      status: GameStatus.PLAYING,
      priority: Priority.MEDIUM,
      rating: 9,
    },
  ];

  const covers = await fetchCoverUrls(gameSeeds.map((game) => game.title));

  const games = await prisma.game.createManyAndReturn({
    data: gameSeeds.map((game) => ({
      ...game,
      userId,
      coverUrl: covers.get(game.title) ?? null,
    })),
  });

  const byTitle = Object.fromEntries(games.map((game) => [game.title, game]));

  await prisma.playSession.createMany({
    data: [
      {
        gameId: byTitle["Hollow Knight"].id,
        userId,
        hours: 2.5,
        sessionDate: new Date("2026-07-18"),
        notes: "Mantis Lords finally down.",
      },
      {
        gameId: byTitle["Hollow Knight"].id,
        userId,
        hours: 1.5,
        sessionDate: new Date("2026-07-25"),
        notes: "Crystal Peak exploration.",
      },
      {
        gameId: byTitle["Hollow Knight"].id,
        userId,
        hours: 3,
        sessionDate: new Date("2026-08-02"),
      },
      {
        gameId: byTitle["Super Mario Odyssey"].id,
        userId,
        hours: 12,
        sessionDate: new Date("2026-05-10"),
        notes: "Finished main story.",
      },
      {
        gameId: byTitle["Super Mario Odyssey"].id,
        userId,
        hours: 8.5,
        sessionDate: new Date("2026-05-18"),
        notes: "Moon cleanup sprint.",
      },
      {
        gameId: byTitle["The Legend of Zelda: Tears of the Kingdom"].id,
        userId,
        hours: 4,
        sessionDate: new Date("2026-08-05"),
        notes: "Sky islands and one shrine.",
      },
      {
        gameId: byTitle["The Legend of Zelda: Tears of the Kingdom"].id,
        userId,
        hours: 5.5,
        sessionDate: new Date("2026-08-09"),
      },
      {
        gameId: byTitle["Balatro"].id,
        userId,
        hours: 0.5,
        sessionDate: new Date("2026-08-01"),
        notes: "Quick run before bed.",
      },
    ],
  });

  console.log(`Created demo user ${DEMO_ACCOUNT.email} / ${DEMO_ACCOUNT.password}`);
  const withCovers = games.filter((game) => game.coverUrl).length;
  console.log(
    `Games: ${games.length} (${withCovers} with covers), play sessions: 8`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
