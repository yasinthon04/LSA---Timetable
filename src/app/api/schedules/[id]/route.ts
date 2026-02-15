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
        const { teacherId, subjectId, yearGroupId, dayOfWeek, startTime, endTime, studentIds } = body;

        const schedule = await prisma.schedule.update({
            where: { id },
            data: {
                teacherId: teacherId || undefined,
                subjectId: subjectId || undefined,
                yearGroupId: yearGroupId || null,
                dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : undefined,
                startTime: startTime || undefined,
                endTime: endTime || undefined,
                studentSchedules: studentIds ? {
                    deleteMany: {},
                    create: studentIds.map((sid: string) => ({ studentId: sid }))
                } : undefined
            },
            include: {
                teacher: true,
                subject: true,
                yearGroup: true,
                studentSchedules: {
                    include: { student: true }
                }
            },
        });
        return NextResponse.json(schedule);
    } catch (error: any) {
        console.error('Schedule update error:', error);
        return NextResponse.json({ error: 'Failed to update schedule', details: error.message }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params;
        await prisma.schedule.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
    }
}
