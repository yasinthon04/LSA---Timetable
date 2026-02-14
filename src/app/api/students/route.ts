
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const students = await prisma.student.findMany({
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name } = await req.json();
        const student = await prisma.student.create({
            data: { name },
        });
        return NextResponse.json(student);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
    }
}
