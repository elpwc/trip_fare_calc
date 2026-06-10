import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { verifyJwtToken } from '@/src/lib/jwt';
import { getTripAccess } from '@/lib/trip-access';

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const decoded = verifyJwtToken(token);
  return decoded?.userId || null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tripId } = await params;
    const access = await getTripAccess(userId, tripId);

    if (!access?.isOwner) {
      return NextResponse.json({ error: 'Only trip owner can manage sharing' }, { status: 403 });
    }

    const share = await prisma.tripShare.findUnique({
      where: { tripId },
      select: { shareToken: true, createdAt: true, updatedAt: true },
    });

    if (!share) {
      return NextResponse.json({ shareToken: null });
    }

    return NextResponse.json(share);
  } catch (error) {
    console.error('Get trip share error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tripId } = await params;
    const access = await getTripAccess(userId, tripId);

    if (!access?.isOwner) {
      return NextResponse.json({ error: 'Only trip owner can manage sharing' }, { status: 403 });
    }

    const { password } = await request.json();

    if (!password || typeof password !== 'string' || !password.trim()) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    const share = await prisma.tripShare.upsert({
      where: { tripId },
      create: {
        tripId,
        passwordHash,
      },
      update: {
        passwordHash,
      },
      select: { shareToken: true },
    });

    return NextResponse.json(share);
  } catch (error) {
    console.error('Create trip share error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tripId } = await params;
    const access = await getTripAccess(userId, tripId);

    if (!access?.isOwner) {
      return NextResponse.json({ error: 'Only trip owner can manage sharing' }, { status: 403 });
    }

    await prisma.tripShare.deleteMany({
      where: { tripId },
    });

    return NextResponse.json({ message: 'Share cancelled' });
  } catch (error) {
    console.error('Cancel trip share error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
