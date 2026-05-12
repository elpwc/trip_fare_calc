import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJwtToken } from '@/src/lib/jwt';

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const decoded = verifyJwtToken(token);
  return decoded?.userId || null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const friends = await prisma.friend.findMany({
      where: { userId, isDeleted: false },
      include: {
        tripMembers: {
          include: {
            trip: {
              select: { id: true, name: true, createdAt: true },
            },
          },
        },
      },
      orderBy: { participationCount: 'desc' },
    });

    const friendsWithTrips = friends.map(friend => ({
      ...friend,
      trips: friend.tripMembers.map(tm => ({
        id: tm.trip.id,
        name: tm.trip.name,
        date: tm.trip.createdAt.toISOString().split('T')[0],
      })),
    }));

    return NextResponse.json(friendsWithTrips);
  } catch (error) {
    console.error('Get friends error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const friend = await prisma.friend.create({
      data: {
        userId,
        name,
        description: description || '',
      },
    });

    return NextResponse.json(friend);
  } catch (error) {
    console.error('Create friend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}