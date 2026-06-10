import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtToken } from '@/src/lib/jwt';
import prisma from '@/lib/prisma';
import { fetchTripWithDetails, formatTripResponse, getTripAccess, grantTripAccess, canInviteCoeditor } from '@/lib/trip-access';

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

    const { id: tripId } = await params;
    const access = await getTripAccess(userId, tripId);

    if (!access?.isOwner) {
      return NextResponse.json({ error: 'Only trip owner can invite collaborators' }, { status: 403 });
    }

    const { userId: targetUserId } = await request.json();

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (targetUserId === userId) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
    }

    const canInvite = await canInviteCoeditor(userId, tripId, targetUserId);

    if (!canInvite) {
      return NextResponse.json({ error: 'User is not in collaborator history' }, { status: 400 });
    }

    await grantTripAccess(tripId, targetUserId);

    const trip = await fetchTripWithDetails(tripId);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json(formatTripResponse(trip, userId));
  } catch (error) {
    console.error('Invite collaborator error:', error);
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
      return NextResponse.json({ error: 'Only trip owner can revoke access' }, { status: 403 });
    }

    const { userId: targetUserId } = await request.json();

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await prisma.tripAccess.deleteMany({
      where: { tripId, userId: targetUserId },
    });

    const trip = await fetchTripWithDetails(tripId);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json(formatTripResponse(trip, userId));
  } catch (error) {
    console.error('Revoke collaborator error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
