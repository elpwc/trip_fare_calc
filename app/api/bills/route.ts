import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJwtToken } from '@/src/lib/jwt';
import { getTripAccess } from '@/lib/trip-access';
import { notifyTripBillChange } from '@/lib/trip-realtime';
import { isSharesBalanced, roundMoney } from '@/src/utils/bill-split';
import type { ExpenseStatus } from '@prisma/client';

type OwedSharePayload = {
  friendId: string;
  shareAmount: number;
  isCustomShare?: boolean;
};

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
  owedShares?: OwedSharePayload[];
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

function normalizeOwedShares(body: BillRequestBody) {
  const billAmount = roundMoney(Number(body.amount));

  if (body.owedShares?.length) {
    const shares = body.owedShares.map((entry) => ({
      friendId: entry.friendId,
      shareAmount: roundMoney(Number(entry.shareAmount)),
      isCustomShare: Boolean(entry.isCustomShare),
    }));

    if (!isSharesBalanced(billAmount, shares)) {
      return { error: 'Owed share amounts must add up to the bill total' as const };
    }

    return { shares };
  }

  if (body.owedFriendIds?.length) {
    const perPerson = roundMoney(billAmount / body.owedFriendIds.length);
    return {
      shares: body.owedFriendIds.map((friendId) => ({
        friendId,
        shareAmount: perPerson,
        isCustomShare: false,
      })),
    };
  }

  return { shares: [] as { friendId: string; shareAmount: number; isCustomShare: boolean }[] };
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
      latitude,
      longitude,
    } = body;

    if (!tripId || !payerId || !amount || !category || !status) {
      return NextResponse.json({ error: 'Missing required bill fields' }, { status: 400 });
    }

    const owedResult = normalizeOwedShares(body);
    if ('error' in owedResult) {
      return NextResponse.json({ error: owedResult.error }, { status: 400 });
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
        amount: roundMoney(Number(amount)),
        currency,
        paymentMethod,
        name,
        description: description || '',
        category,
        status,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        owedFriends: owedResult.shares.length
          ? {
              create: owedResult.shares.map((entry) => ({
                friendId: entry.friendId,
                shareAmount: entry.shareAmount,
                isCustomShare: entry.isCustomShare,
              })),
            }
          : undefined,
      },
      include: {
        owedFriends: { where: { isDeleted: false } },
      },
    });

    void notifyTripBillChange({
      type: 'bill:created',
      tripId,
      billId: bill.id,
      actorUserId: userId,
      billName: bill.name,
      amount: bill.amount,
      currency: bill.currency,
    });

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Create bill error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
