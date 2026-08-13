import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client.ts";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
export async function connectDatabase() {
    try {
        await prisma.$connect();
        console.log("Connected to the database successfully.");
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1); // Exit the process with an error code
    }
}