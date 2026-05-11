import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const verification = await prisma.emailVerification.findUnique({
      where: { token },
    });

    if (!verification) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    if (verification.expiresAt < new Date()) {
      await prisma.emailVerification.delete({
        where: { token },
      });
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    // Token有效，返回email
    return NextResponse.json({ email: verification.email });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}