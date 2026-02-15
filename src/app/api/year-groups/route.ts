import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const yearGroups = await prisma.yearGroup.findMany({
            orderBy: { name: 'asc' },
            include: {
                yearSubjects: { include: { subject: true } },
                _count: { select: { schedules: true } },
            },
        });
        return NextResponse.json(yearGroups);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch year groups' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { name, subjectIds } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const yearGroup = await prisma.yearGroup.create({
            data: {
                name,
                yearSubjects: subjectIds?.length
                    ? { create: subjectIds.map((sId: string) => ({ subjectId: sId })) }
                    : undefined,
            },
            include: { yearSubjects: { include: { subject: true } } },
        });
        return NextResponse.json(yearGroup, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create year group' }, { status: 500 });
    }
}
