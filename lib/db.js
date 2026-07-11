import { PrismaClient } from "@prisma/client";

// Reads DATABASE_URL from the schema datasource (Neon, set in .env locally and
// in Netlify env in production). Reuse one client across hot reloads / invocations.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
