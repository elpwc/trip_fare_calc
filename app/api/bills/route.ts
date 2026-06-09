import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJwtToken } from '@/src/lib/jwt';
import { getTripAccess } from '@/lib/trip-access';
import type { ExpenseStatus } from '@prisma/client';

type BillRequestBody = {
  tripId: string;
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

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as BillRequestBody;
    const {
      tripId,
      payerId,
      amount,
      currency = 'CNY',
      paymentMethod = 'Cash',
      name,
      description,
      category,
      status,
      owedFriendIds,
      latitude,
      longitude,
    } = body;

    if (!tripId || !payerId || !amount || !category || !status) {
      return NextResponse.json({ error: 'Missing required bill fields' }, { status: 400 });
    }

    const access = await getTripAccess(userId, tripId);
    if (!access) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const payerMember = await prisma.tripMember.findFirst({
      where: { tripId, friendId: payerId, isDeleted: false },
    });
    if (!payerMember) {
      return NextResponse.json({ error: 'Payer is not a member of this trip' }, { status: 404 });
    }

    const bill = await prisma.bill.create({
      data: {
        userId,
        tripId,
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
        owedFriends: owedFriendIds?.length
          ? {
              create: owedFriendIds.map((friendId) => ({ friendId })),
            }
          : undefined,
      },
      include: {
        owedFriends: true,
      },
    });

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Create bill error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
