import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJwtToken } from '@/src/lib/jwt';
import { getTripAccess } from '@/lib/trip-access';
import type { ExpenseStatus } from '@prisma/client';

type BillUpdateRequestBody = {
  payerId: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  name: string;
  description?: string;
  category: string;
  status: ExpenseStatus;
  owedFriendIds?: string[];
  latitude?: number | null;
  longitude?: number | null;
};

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const decoded = verifyJwtToken(token);
  return decoded?.userId || null;
}

async function canAccessBill(userId: string, billId: string) {
  const bill = await prisma.bill.findFirst({
    where: { id: billId, isDeleted: false },
    include: {
      owedFriends: true,
      trip: {
        include: {
          members: {
            include: {
              friend: {
                select: { id: true, name: true, description: true, participationCount: true, isSelf: true },
              },
            },
          },
        },
      },
    },
  });

  if (!bill || !bill.tripId) {
    return null;
  }

  const access = await getTripAccess(userId, bill.tripId);
  if (!access) {
    return null;
  }

  return bill;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bill = await canAccessBill(userId, id);
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...bill,
      createdById: bill.userId,
      tripMembers: bill.trip?.members.map((member) => member.friend) || [],
      trip: bill.trip
        ? {
            ...bill.trip,
            members: bill.trip.members.map((member) => member.friend),
          }
        : null,
    });
  } catch (error) {
    console.error('Get bill error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as BillUpdateRequestBody;
    const { payerId, amount, currency = 'CNY', paymentMethod = 'Cash', name, description, category, status, owedFriendIds, latitude, longitude } = body;

    if (!payerId || !amount || !category || !status) {
      return NextResponse.json({ error: 'Missing required bill fields' }, { status: 400 });
    }

    const bill = await canAccessBill(userId, id);
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const updatedBill = await prisma.bill.update({
      where: { id },
      data: {
        payerId,
        amount: Number(amount),
        currency,
        paymentMethod,
        name,
        description: description || '',
        category,
        status,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        owedFriends: owedFriendIds
          ? {
              deleteMany: {},
              create: owedFriendIds.map((friendId) => ({ friendId })),
            }
          : undefined,
      },
      include: {
        owedFriends: true,
      },
    });

    return NextResponse.json({ ...updatedBill, createdById: updatedBill.userId });
  } catch (error) {
    console.error('Update bill error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
