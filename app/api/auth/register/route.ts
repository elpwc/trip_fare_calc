import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/src/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, code } = await request.json();

    if (!email || !name || !password || !code) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const verification = await prisma.emailVerification.findUnique({
      where: { email },
    });

    if (!verification || verification.token !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    if (verification.expiresAt < new Date()) {
      await prisma.emailVerification.delete({
        where: { email },
      });
      return NextResponse.json({ error: 'Verification code expired' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          name,
          password: passwordHash,
        },
      });

      await tx.friend.create({
        data: {
          userId: createdUser.id,
          name: name.trim(),
          isSelf: true,
        },
      });

      return createdUser;
    });

    await prisma.emailVerification.delete({
      where: { email },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}