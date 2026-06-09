import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJwtToken } from '@/src/lib/jwt';
import { fetchTripWithDetails, formatTripResponse } from '@/lib/trip-access';

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

    const [ownedTrips, sharedAccess] = await Promise.all([
      prisma.trip.findMany({
        where: { userId, isDeleted: false },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tripAccess.findMany({
        where: { userId, trip: { isDeleted: false } },
        select: { tripId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const ownedIds = ownedTrips.map((t) => t.id);
    const sharedIds = sharedAccess.map((a) => a.tripId).filter((id) => !ownedIds.includes(id));
    const allIds = [...ownedIds, ...sharedIds];

    const trips = await Promise.all(
      allIds.map(async (tripId) => {
        const trip = await fetchTripWithDetails(tripId);
        return trip ? formatTripResponse(trip, userId) : null;
      }),
    );

    return NextResponse.json(trips.filter(Boolean));
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
    });

    const tripWithDetails = await fetchTripWithDetails(trip.id);
    if (!tripWithDetails) {
      return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
    }

    return NextResponse.json(formatTripResponse(tripWithDetails, userId));
  } catch (error) {
    console.error('Create trip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
