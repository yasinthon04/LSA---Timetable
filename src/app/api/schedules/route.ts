import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const teacherId = searchParams.get('teacherId');
        const yearGroupId = searchParams.get('yearGroupId');
        const dayOfWeek = searchParams.get('dayOfWeek');

        const where: Record<string, unknown> = {};
        if (teacherId) where.teacherId = teacherId;
        if (yearGroupId) where.yearGroupId = yearGroupId;
        if (dayOfWeek !== null && dayOfWeek !== undefined && dayOfWeek !== '') {
            where.dayOfWeek = parseInt(dayOfWeek);
        }

        const schedules = await prisma.schedule.findMany({
            where,
            include: {
                teacher: true,
                subject: true,
                yearGroup: true,
            },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });
        return NextResponse.json(schedules);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { teacherId, subjectId, yearGroupId, dayOfWeek, startTime, endTime } = body;

        if (!teacherId || !subjectId || !yearGroupId || dayOfWeek === undefined || !startTime || !endTime) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const schedule = await prisma.schedule.create({
            data: { teacherId, subjectId, yearGroupId, dayOfWeek, startTime, endTime },
            include: { teacher: true, subject: true, yearGroup: true },
        });
        return NextResponse.json(schedule, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
    }
}
