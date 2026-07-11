import { PrismaClient } from "@prisma/client";

// Runtime connection string:
//  - Netlify (prod): NETLIFY_DATABASE_URL (pooled Neon), injected automatically.
//  - Local dev: DATABASE_URL from .env (local Postgres).
const url = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

// Reuse a single client across hot reloads / serverless invocations.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ datasourceUrl: url, log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
