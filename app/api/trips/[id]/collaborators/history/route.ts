import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtToken } from '@/src/lib/jwt';
import { fetchTripWithDetails, formatTripResponse, getTripAccess, removeCoeditorHistory } from '@/lib/trip-access';

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const decoded = verifyJwtToken(token);
  return decoded?.userId || null;
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
      return NextResponse.json({ error: 'Only trip owner can manage collaborator history' }, { status: 403 });
    }

    const { userId: targetUserId } = await request.json();

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await removeCoeditorHistory(userId, tripId, targetUserId);

    const trip = await fetchTripWithDetails(tripId);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json(formatTripResponse(trip, userId));
  } catch (error) {
    console.error('Remove collaborator history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
