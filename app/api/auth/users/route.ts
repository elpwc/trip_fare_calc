import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyJwtToken } from '@/src/lib/jwt';

function verifyToken(token: string) {
  return verifyJwtToken(token);
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { name, email, password, oldPassword } = await request.json();

    if (!name && !email && !password) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (name) {
      updates.name = name;
    }

    if (email) {
      if (!email.includes('@')) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json({ error: 'Email already taken' }, { status: 400 });
      }

      updates.email = email;
    }

    if (password) {
      if (!oldPassword) {
        return NextResponse.json({ error: 'Old password required to change password' }, { status: 400 });
      }

      const isValidOldPassword = await bcrypt.compare(oldPassword, user.password);
      if (!isValidOldPassword) {
        return NextResponse.json({ error: 'Invalid old password' }, { status: 400 });
      }

      updates.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updates,
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, createdAt: updatedUser.createdAt.toISOString() },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
