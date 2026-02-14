import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, email, color } = body;

        const teacher = await prisma.teacher.update({
            where: { id },
            data: { ...(name && { name }), ...(email && { email }), ...(color && { color }) },
        });
        return NextResponse.json(teacher);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.teacher.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 });
    }
}
