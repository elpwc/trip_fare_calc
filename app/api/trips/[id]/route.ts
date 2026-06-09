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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();
    const { id: tripId } = await params;

    const access = await getTripAccess(userId, tripId);
    if (!access) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(updatedTrip);
  } catch (error) {
    console.error('Update trip error:', error);
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

    if (!access) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (access.isOwner) {
      await prisma.trip.update({
        where: { id: tripId },
        data: { isDeleted: true },
      });
      return NextResponse.json({ message: 'Trip deleted' });
    }

    await prisma.tripAccess.delete({
      where: {
        tripId_userId: { tripId, userId },
      },
    });

    return NextResponse.json({ message: 'Trip removed from list' });
  } catch (error) {
    console.error('Delete trip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
