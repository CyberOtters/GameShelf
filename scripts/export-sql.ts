import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import "dotenv/config";

const OUTPUT_FILE = "gameshelf-data.sql";

const PG_DUMP_CANDIDATES = [
  "pg_dump",
  "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe",
  "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe",
  "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe",
];

function findPgDump(): string {
  for (const candidate of PG_DUMP_CANDIDATES) {
    if (candidate === "pg_dump") {
      const check = spawnSync("pg_dump", ["--version"], { shell: true });
      if (check.status === 0) return candidate;
      continue;
    }
    if (existsSync(candidate)) return candidate;
  }

  throw new Error(
    "pg_dump not found. Install PostgreSQL or add its bin folder to PATH.",
  );
}

/** Strip pg_dump 18+ directives that break restore on older PostgreSQL. */
function sanitizeDump(sql: string): string {
  return sql
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (
        trimmed.startsWith("\\restrict") ||
        trimmed.startsWith("\\unrestrict")
      ) {
        return false;
      }
      if (trimmed.startsWith("SET transaction_timeout")) {
        return false;
      }
      return true;
    })
    .join("\n");
}

function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required. Check your .env file.");
  }

  const pgDump = findPgDump();
  console.log(`Exporting with ${pgDump} → ${OUTPUT_FILE}`);

  const result = spawnSync(
    pgDump,
    [
      databaseUrl,
      "--schema=public",
      "--data-only",
      "--inserts",
      "--column-inserts",
      "-f",
      OUTPUT_FILE,
    ],
    { stdio: "inherit" },
  );

  if (result.status !== 0) {
    throw new Error(
      "pg_dump failed. Is `npx prisma dev` running and did you run `npm run db:seed`?",
    );
  }

  const sanitized = sanitizeDump(readFileSync(OUTPUT_FILE, "utf8"));
  writeFileSync(OUTPUT_FILE, sanitized, "utf8");

  console.log(`Wrote ${path.resolve(OUTPUT_FILE)}`);
}

main();
