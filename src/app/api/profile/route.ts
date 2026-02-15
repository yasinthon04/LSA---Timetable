
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '../auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { name, currentPassword, newPassword } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        const data: any = { name };

        if (newPassword) {
            if (!currentPassword) {
                return new NextResponse('Current password is required to set a new password', { status: 400 });
            }

            const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordCorrect) {
                return new NextResponse('Incorrect current password', { status: 400 });
            }

            data.password = await bcrypt.hash(newPassword, 12);
        }

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}
