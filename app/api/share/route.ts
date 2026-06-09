import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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

async function verifySharePassword(token: string, password: string) {
  const share = await prisma.tripShare.findUnique({
    where: { shareToken: token },
    include: {
      trip: {
        select: { id: true, isDeleted: true, userId: true },
      },
    },
  });

  if (!share || share.trip.isDeleted) {
    return null;
  }

  const valid = await bcrypt.compare(password, share.passwordHash);
  if (!valid) {
    return null;
  }

  return share;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    const password = request.nextUrl.searchParams.get('password');

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    const share = await verifySharePassword(token, password);
    if (!share) {
      return NextResponse.json({ error: 'Invalid token or password' }, { status: 403 });
    }

    const trip = await fetchTripWithDetails(share.tripId);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const userId = getUserId(request);
    const viewerId = userId || trip.userId;

    return NextResponse.json({
      ...formatTripResponse(trip, viewerId),
      readOnly: !userId,
      alreadyJoined: userId
        ? userId === trip.userId ||
          !!(await prisma.tripAccess.findUnique({
            where: { tripId_userId: { tripId: trip.id, userId } },
          }))
        : false,
    });
  } catch (error) {
    console.error('Get shared trip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    const share = await verifySharePassword(token, password);
    if (!share) {
      return NextResponse.json({ error: 'Invalid token or password' }, { status: 403 });
    }

    if (share.trip.userId === userId) {
      return NextResponse.json({ error: 'Cannot join your own trip' }, { status: 400 });
    }

    const existing = await prisma.tripAccess.findUnique({
      where: { tripId_userId: { tripId: share.tripId, userId } },
    });

    if (existing) {
      return NextResponse.json({ tripId: share.tripId, message: 'Already joined' });
    }

    await prisma.tripAccess.create({
      data: {
        tripId: share.tripId,
        userId,
      },
    });

    const trip = await fetchTripWithDetails(share.tripId);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({
      tripId: share.tripId,
      trip: formatTripResponse(trip, userId),
      message: 'Joined successfully',
    });
  } catch (error) {
    console.error('Join shared trip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
