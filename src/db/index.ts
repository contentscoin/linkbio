import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb(databaseUrl: string) {
  return drizzle(neon(databaseUrl), { schema });
}

let cachedDb: ReturnType<typeof createDb> | undefined;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  cachedDb ??= createDb(databaseUrl);
  return cachedDb;
}
