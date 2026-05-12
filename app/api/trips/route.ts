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

    const trips = await prisma.trip.findMany({
      where: { userId, isDeleted: false },
      include: {
        members: {
          include: {
            friend: {
              select: { id: true, name: true, description: true, participationCount: true },
            },
          },
        },
        bills: {
          select: {
            id: true,
            payerId: true,
            amount: true,
            latitude: true,
            longitude: true,
            owedFriends: true,
            name: true,
            category: true,
            status: true,
            paymentMethod: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tripsWithDetails = trips.map(trip => ({
      ...trip,
      members: trip.members.map(tm => tm.friend),
      bills: trip.bills,
    }));

    return NextResponse.json(tripsWithDetails);
  } catch (error) {
    console.error('Get trips error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, startDate, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const trip = await prisma.trip.create({
      data: {
        userId,
        name,
        description: description || '',
      },
      include: {
        members: {
          include: {
            friend: {
              select: { id: true, name: true, description: true, participationCount: true },
            },
          },
        },
        bills: {
          select: { id: true, payerId: true, amount: true, owedFriends: true, name: true, category: true, status: true },
        },
      },
    });

    const tripWithDetails = {
      ...trip,
      members: trip.members.map(tm => tm.friend),
      bills: trip.bills,
    };

    return NextResponse.json(tripWithDetails);
  } catch (error) {
    console.error('Create trip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}