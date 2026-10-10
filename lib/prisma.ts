import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error"] : [],
    });
  }
  return globalForPrisma.prisma;
}

// Safe proxy to avoid instantiating PrismaClient at build time without DATABASE_URL
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    if (!client) {
      throw new Error("DATABASE_URL is not configured.");
    }
    return (client as unknown as Record<string, unknown>)[prop as string];
  },
});
