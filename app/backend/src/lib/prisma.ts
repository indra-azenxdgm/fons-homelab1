import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { backendEnv } from "@/config/env";

declare global {
  var prisma: PrismaClient | undefined;
}

export const db =
  globalThis.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: backendEnv.databaseUrl }),
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
