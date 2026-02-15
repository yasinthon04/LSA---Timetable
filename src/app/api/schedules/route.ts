export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
                studentSchedules: {
                    include: { student: true }
                }
            },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });
        return NextResponse.json(schedules);
    } catch (error: any) {
        console.error('Failed to fetch schedules:', error);
        return NextResponse.json({ error: 'Failed to fetch schedules', details: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { teacherId, subjectId, yearGroupId, dayOfWeek, startTime, endTime, studentIds } = body;

        if (!teacherId || !subjectId || dayOfWeek === undefined || !startTime || !endTime) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const schedule = await prisma.schedule.create({
            data: {
                teacherId,
                subjectId,
                yearGroupId: yearGroupId || null,
                dayOfWeek,
                startTime,
                endTime,
                studentSchedules: studentIds && studentIds.length > 0 ? {
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
        return NextResponse.json(schedule, { status: 201 });
    } catch (error: any) {
        console.error('Schedule creation error:', error);
        return NextResponse.json({ error: 'Failed to create schedule', details: error.message }, { status: 500 });
    }
}
