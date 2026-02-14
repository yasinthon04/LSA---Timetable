import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { teacherId, subjectId, yearGroupId, dayOfWeek, startTime, endTime, studentIds } = body;

        const schedule = await prisma.schedule.update({
            where: { id },
            data: {
                ...(teacherId && { teacherId }),
                ...(subjectId && { subjectId }),
                ...(yearGroupId && { yearGroupId }),
                ...(dayOfWeek !== undefined && { dayOfWeek }),
                ...(startTime && { startTime }),
                ...(endTime && { endTime }),
                ...(studentIds && {
                    studentSchedules: {
                        deleteMany: {},
                        create: studentIds.map((sid: string) => ({ studentId: sid }))
                    }
                })
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
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.schedule.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
    }
}
