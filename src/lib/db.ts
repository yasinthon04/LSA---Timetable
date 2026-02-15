import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not defined in environment variables!");
} else {
    console.log("🌏 DATABASE_URL is detected.");
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
