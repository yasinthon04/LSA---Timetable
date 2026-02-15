import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params;
        const body = await request.json();
        const { name, color, type, yearGroupIds } = body;

        // Update year group assignments if provided
        if (yearGroupIds) {
            await prisma.yearSubject.deleteMany({ where: { subjectId: id } });
            await prisma.yearSubject.createMany({
                data: yearGroupIds.map((ygId: string) => ({ subjectId: id, yearGroupId: ygId })),
            });
        }

        const subject = await prisma.subject.update({
            where: { id },
            data: { ...(name && { name }), ...(color && { color }), ...(type && { type }) },
            include: { yearSubjects: { include: { yearGroup: true } } },
        });
        return NextResponse.json(subject);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params;
        await prisma.subject.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
    }
}
