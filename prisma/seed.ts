import "dotenv/config";
import { DEMO_ACCOUNT } from "../src/server/lib/demoAccount.ts";
import { auth } from "../src/server/lib/auth.ts";
import { prisma } from "../src/server/lib/prisma.ts";
import { GameStatus, Priority } from "../generated/prisma/enums.ts";

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

  const games = await prisma.game.createManyAndReturn({
    data: [
      {
        userId,
        title: "Metroid Prime 4: Beyond",
        platform: "Nintendo Switch",
        status: GameStatus.WISHLIST,
        priority: Priority.HIGH,
        notes: "Day-one pickup when it lands.",
      },
      {
        userId,
        title: "Balatro",
        platform: "PC",
        status: GameStatus.BACKLOG,
        priority: Priority.MEDIUM,
        notes: "Everyone keeps recommending this one.",
      },
      {
        userId,
        title: "Hollow Knight",
        platform: "Nintendo Switch",
        status: GameStatus.PLAYING,
        priority: Priority.HIGH,
        rating: 9,
        notes: "Deep in Crystal Peak.",
      },
      {
        userId,
        title: "Super Mario Odyssey",
        platform: "Nintendo Switch",
        status: GameStatus.COMPLETED,
        priority: Priority.LOW,
        rating: 10,
        notes: "100% moons collected.",
      },
      {
        userId,
        title: "Cyberpunk 2077",
        platform: "PC",
        status: GameStatus.DROPPED,
        priority: Priority.LOW,
        notes: "Might revisit after Phantom Liberty.",
      },
      {
        userId,
        title: "The Legend of Zelda: Tears of the Kingdom",
        platform: "Nintendo Switch",
        status: GameStatus.PLAYING,
        priority: Priority.MEDIUM,
        rating: 9,
      },
    ],
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
  console.log(`Games: ${games.length}, play sessions: 8`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
