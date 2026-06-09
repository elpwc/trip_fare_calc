import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendId } = await request.json();
    const { id: tripId } = await params;

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
    }

    const access = await getTripAccess(userId, tripId);
    if (!access) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const friend = await prisma.friend.findFirst({
      where: { id: friendId, userId, isDeleted: false },
    });

    if (!friend) {
      return NextResponse.json({ error: 'Friend not found' }, { status: 404 });
    }

    const existingMember = await prisma.tripMember.findUnique({
      where: {
        tripId_friendId: {
          tripId: tripId,
          friendId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'Friend is already a member of this trip' }, { status: 400 });
    }

    const tripMember = await prisma.tripMember.create({
      data: {
        tripId: tripId,
        friendId,
      },
    });

    await prisma.friend.update({
      where: { id: friendId },
      data: {
        participationCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(tripMember);
  } catch (error) {
    console.error('Add trip member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendId } = await request.json();
    const { id: tripId } = await params;

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
    }

    const access = await getTripAccess(userId, tripId);
    if (!access) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const tripMember = await prisma.tripMember.findUnique({
      where: {
        tripId_friendId: {
          tripId: tripId,
          friendId,
        },
      },
    });

    if (!tripMember) {
      return NextResponse.json({ error: 'Trip member not found' }, { status: 404 });
    }

    await prisma.tripMember.delete({
      where: {
        tripId_friendId: {
          tripId: tripId,
          friendId,
        },
      },
    });

    await prisma.friend.update({
      where: { id: friendId },
      data: {
        participationCount: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({ message: 'Member removed from trip' });
  } catch (error) {
    console.error('Remove trip member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
