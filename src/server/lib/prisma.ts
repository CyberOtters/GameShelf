import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client.ts";

/**
 * Prisma Dev prints extra pool hints in DATABASE_URL that node-pg ignores or
 * mishandles. Keep the base URL and let our Pool manage sizing/timeouts.
 */
function poolConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const parsed = new URL(url);
  parsed.search = "";
  parsed.searchParams.set("sslmode", "disable");
  return parsed.toString();
}

const pool = new pg.Pool({
  connectionString: poolConnectionString(),
  max: 10,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
  // Rotate connections before prisma dev drops idle sockets.
  maxLifetimeSeconds: 30,
  keepAlive: true,
});

// prisma dev can drop idle connections; evict broken clients from the pool.
pool.on("error", (error) => {
  console.error("Postgres pool error:", error.message);
});

const adapter = new PrismaPg(pool);
const base = new PrismaClient({ adapter });

function isConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const { code, message = "" } = error as { code?: string; message?: string };
  if (code === "P1017" || code === "P1001" || code === "P1008") return true;

  return /connection closed|closed the connection|connection terminated|econnreset/i.test(
    message,
  );
}

/** Retry once on dropped prisma-dev connections so auth/session lookups recover. */
export const prisma = base.$extends({
  query: {
    async $allOperations({ args, query }) {
      try {
        return await query(args);
      } catch (error) {
        if (!isConnectionError(error)) throw error;
        return query(args);
      }
    },
  },
});

export async function connectDatabase() {
  await base.$connect();
  console.log("Connected to database");
}