import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const yearGroupId = searchParams.get('yearGroupId');

        const where: Record<string, unknown> = {};
        if (type) where.type = type;
        if (yearGroupId) {
            where.yearSubjects = { some: { yearGroupId } };
        }

        const subjects = await prisma.subject.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { yearSubjects: { include: { yearGroup: true } } },
        });
        return NextResponse.json(subjects);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { name, color, type, yearGroupIds } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const subject = await prisma.subject.create({
            data: {
                name,
                color: color || '#60a5fa',
                type: type || 'MAIN',
                yearSubjects: yearGroupIds?.length
                    ? { create: yearGroupIds.map((ygId: string) => ({ yearGroupId: ygId })) }
                    : undefined,
            },
            include: { yearSubjects: { include: { yearGroup: true } } },
        });
        return NextResponse.json(subject, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
    }
}
