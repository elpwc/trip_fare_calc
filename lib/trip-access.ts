import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021';
}

export type TripAccessResult = {
  trip: {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    isDeleted: boolean;
  };
  isOwner: boolean;
  canEdit: boolean;
};

export type TripCollaborator = {
  id: string;
  name: string;
  joinedAt: string;
};

export type TripShareHistoryUser = {
  id: string;
  name: string;
  isActive: boolean;
};

export async function getTripAccess(userId: string, tripId: string): Promise<TripAccessResult | null> {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, isDeleted: false },
  });

  if (!trip) {
    return null;
  }

  if (trip.userId === userId) {
    return { trip, isOwner: true, canEdit: true };
  }

  const access = await prisma.tripAccess.findUnique({
    where: {
      tripId_userId: { tripId, userId },
    },
  });

  if (!access) {
    return null;
  }

  return { trip, isOwner: false, canEdit: true };
}

export async function getAccessibleTripIds(userId: string): Promise<string[]> {
  const [owned, shared] = await Promise.all([
    prisma.trip.findMany({
      where: { userId, isDeleted: false },
      select: { id: true },
    }),
    prisma.tripAccess.findMany({
      where: { userId, trip: { isDeleted: false } },
      select: { tripId: true },
    }),
  ]);

  return [...owned.map((t) => t.id), ...shared.map((a) => a.tripId)];
}

export async function recordUserCoeditHistory(ownerUserId: string, coeditorUserId: string) {
  if (ownerUserId === coeditorUserId) return;

  try {
    await prisma.userCoeditHistory.upsert({
      where: {
        ownerUserId_coeditorUserId: { ownerUserId, coeditorUserId },
      },
      create: { ownerUserId, coeditorUserId },
      update: { updatedAt: new Date() },
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }
}

export async function recordCollaboratorHistory(tripId: string, userId: string) {
  await prisma.tripCollaboratorHistory.upsert({
    where: { tripId_userId: { tripId, userId } },
    create: { tripId, userId },
    update: { updatedAt: new Date() },
  });

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { userId: true },
  });

  if (trip) {
    await recordUserCoeditHistory(trip.userId, userId);
  }
}

export async function grantTripAccess(tripId: string, userId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { userId: true },
  });

  if (!trip) return;

  const existing = await prisma.tripAccess.findUnique({
    where: { tripId_userId: { tripId, userId } },
  });

  if (!existing) {
    await prisma.tripAccess.create({
      data: { tripId, userId },
    });
  }

  await recordCollaboratorHistory(tripId, userId);
}

export async function canInviteCoeditor(ownerUserId: string, tripId: string, targetUserId: string) {
  try {
    const userHistory = await prisma.userCoeditHistory.findUnique({
      where: {
        ownerUserId_coeditorUserId: { ownerUserId, coeditorUserId: targetUserId },
      },
    });
    if (userHistory) return true;
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }

  const tripHistory = await prisma.tripCollaboratorHistory.findUnique({
    where: { tripId_userId: { tripId, userId: targetUserId } },
  });

  return !!tripHistory;
}

const tripInclude = {
  members: {
    where: { isDeleted: false },
    include: {
      friend: {
        select: { id: true, name: true, description: true, participationCount: true, isSelf: true },
      },
    },
  },
  bills: {
    where: { isDeleted: false },
    select: {
      id: true,
      payerId: true,
      amount: true,
      currency: true,
      latitude: true,
      longitude: true,
      owedFriends: { where: { isDeleted: false } },
      name: true,
      category: true,
      status: true,
      paymentMethod: true,
      description: true,
      createdAt: true,
      userId: true,
      user: { select: { id: true, name: true } },
    },
  },
  user: {
    select: { id: true, name: true },
  },
  share: {
    select: { id: true },
  },
  access: {
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  collaboratorHistory: {
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' as const },
  },
} as const;

function buildShareHistory(
  trip: NonNullable<Awaited<ReturnType<typeof fetchTripWithDetails>>>,
  ownerCoeditHistory: Awaited<ReturnType<typeof fetchOwnerCoeditHistory>>,
) {
  const activeCollaboratorIds = new Set(trip.access.map((entry) => entry.userId));
  const historyMap = new Map<string, TripShareHistoryUser>();

  for (const entry of ownerCoeditHistory) {
    historyMap.set(entry.coeditorUserId, {
      id: entry.coeditor.id,
      name: entry.coeditor.name,
      isActive: activeCollaboratorIds.has(entry.coeditorUserId),
    });
  }

  for (const entry of trip.collaboratorHistory) {
    if (!historyMap.has(entry.userId)) {
      historyMap.set(entry.userId, {
        id: entry.user.id,
        name: entry.user.name,
        isActive: activeCollaboratorIds.has(entry.userId),
      });
    }
  }

  return Array.from(historyMap.values());
}

export async function fetchOwnerCoeditHistory(ownerUserId: string) {
  const tripCollaborators = await prisma.tripCollaboratorHistory.findMany({
    where: {
      trip: { userId: ownerUserId, isDeleted: false },
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  await Promise.all(tripCollaborators.map((entry) => recordUserCoeditHistory(ownerUserId, entry.userId)));

  try {
    return await prisma.userCoeditHistory.findMany({
      where: { ownerUserId },
      include: {
        coeditor: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}

export async function fetchTripWithDetails(tripId: string) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, isDeleted: false },
    include: tripInclude,
  });

  if (!trip) return null;

  const ownerCoeditHistory = await fetchOwnerCoeditHistory(trip.userId);

  return { ...trip, ownerCoeditHistory };
}

export function formatTripResponse(
  trip: NonNullable<Awaited<ReturnType<typeof fetchTripWithDetails>>>,
  viewerUserId: string,
) {
  return {
    id: trip.id,
    name: trip.name,
    description: trip.description,
    createdAt: trip.createdAt,
    members: trip.members.map((tm) => tm.friend),
    bills: trip.bills.map((bill) => ({
      id: bill.id,
      payerId: bill.payerId,
      amount: bill.amount,
      currency: bill.currency,
      latitude: bill.latitude,
      longitude: bill.longitude,
      owedFriends: bill.owedFriends,
      name: bill.name,
      category: bill.category,
      status: bill.status,
      paymentMethod: bill.paymentMethod,
      description: bill.description,
      createdAt: bill.createdAt,
      createdById: bill.userId,
      createdByName: bill.user.name,
    })),
    isOwner: trip.userId === viewerUserId,
    ownerName: trip.user.name,
    ownerUserId: trip.userId,
    isShared: !!trip.share,
    collaboratorCount: trip.access.length,
    collaborators: trip.access.map((entry) => ({
      id: entry.user.id,
      name: entry.user.name,
      joinedAt: entry.createdAt.toISOString(),
    })),
    shareHistory: buildShareHistory(trip, trip.ownerCoeditHistory),
  };
}

export async function removeCoeditorHistory(ownerUserId: string, tripId: string, targetUserId: string) {
  const ops = [
    prisma.tripAccess.deleteMany({
      where: { tripId, userId: targetUserId },
    }),
    prisma.tripCollaboratorHistory.deleteMany({
      where: { tripId, userId: targetUserId },
    }),
  ];

  try {
    await prisma.$transaction([
      ...ops,
      prisma.userCoeditHistory.deleteMany({
        where: { ownerUserId, coeditorUserId: targetUserId },
      }),
    ]);
  } catch (error) {
    if (isMissingTableError(error)) {
      await prisma.$transaction(ops);
      return;
    }
    throw error;
  }
}
