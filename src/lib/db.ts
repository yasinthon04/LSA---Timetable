import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is MISSION in environment variables!");
} else {
    const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
    console.log("🌏 DATABASE_URL detected:", maskedUrl.substring(0, 20) + "...");
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
