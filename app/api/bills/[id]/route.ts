import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJwtToken } from '@/src/lib/jwt';
import { getTripAccess, formatTripMemberForViewer } from '@/lib/trip-access';
import { notifyTripBillChange } from '@/lib/trip-realtime';
import { isSharesBalanced, roundMoney } from '@/src/utils/bill-split';
import type { ExpenseStatus } from '@prisma/client';

type OwedSharePayload = {
  friendId: string;
  shareAmount: number;
  isCustomShare?: boolean;
};

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

function normalizeOwedShares(body: BillUpdateRequestBody) {
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

async function canAccessBill(userId: string, billId: string) {
  const bill = await prisma.bill.findFirst({
    where: { id: billId, isDeleted: false },
    include: {
      owedFriends: { where: { isDeleted: false } },
      trip: {
        include: {
          members: {
            include: {
              friend: {
                select: { id: true, name: true, description: true, participationCount: true, isSelf: true, userId: true },
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
      tripMembers: bill.trip?.members.map((member) => formatTripMemberForViewer(member.friend, userId)) || [],
      trip: bill.trip
        ? {
            ...bill.trip,
            members: bill.trip.members.map((member) => formatTripMemberForViewer(member.friend, userId)),
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
    const { payerId, amount, currency = 'CNY', paymentMethod = 'Cash', name, description, category, status, owedFriendIds, owedShares, latitude, longitude } = body;

    if (!payerId || !amount || !category || !status) {
      return NextResponse.json({ error: 'Missing required bill fields' }, { status: 400 });
    }

    const bill = await canAccessBill(userId, id);
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const owedResult = normalizeOwedShares({ ...body, owedFriendIds, owedShares });
    if ('error' in owedResult) {
      return NextResponse.json({ error: owedResult.error }, { status: 400 });
    }

    const updatedBill = await prisma.bill.update({
      where: { id },
      data: {
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
        owedFriends:
          owedFriendIds || owedShares
            ? {
                deleteMany: {},
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

    if (bill.tripId) {
      void notifyTripBillChange({
        type: 'bill:updated',
        tripId: bill.tripId,
        billId: updatedBill.id,
        actorUserId: userId,
        billName: updatedBill.name,
        amount: updatedBill.amount,
        currency: updatedBill.currency,
      });
    }

    return NextResponse.json({ ...updatedBill, createdById: updatedBill.userId });
  } catch (error) {
    console.error('Update bill error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
