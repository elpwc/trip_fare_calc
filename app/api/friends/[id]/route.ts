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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();
    const { id: friendId } = await params;

    const friend = await prisma.friend.findFirst({
      where: { id: friendId, userId, isDeleted: false },
    });

    if (!friend) {
      return NextResponse.json({ error: 'Friend not found' }, { status: 404 });
    }

    const updatedFriend = await prisma.friend.update({
      where: { id: friendId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(updatedFriend);
  } catch (error) {
    console.error('Update friend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: friendId } = await params;

    const friend = await prisma.friend.findFirst({
      where: { id: friendId, userId, isDeleted: false },
    });

    if (!friend) {
      return NextResponse.json({ error: 'Friend not found' }, { status: 404 });
    }

    await prisma.friend.update({
      where: { id: friendId },
      data: { isDeleted: true },
    });

    return NextResponse.json({ message: 'Friend deleted' });
  } catch (error) {
    console.error('Delete friend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}