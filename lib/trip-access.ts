import prisma from '@/lib/prisma';

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
    },
  },
  user: {
    select: { id: true, name: true },
  },
} as const;

export async function fetchTripWithDetails(tripId: string) {
  return prisma.trip.findFirst({
    where: { id: tripId, isDeleted: false },
    include: tripInclude,
  });
}

export function formatTripResponse(trip: NonNullable<Awaited<ReturnType<typeof fetchTripWithDetails>>>, viewerUserId: string) {
  return {
    id: trip.id,
    name: trip.name,
    description: trip.description,
    createdAt: trip.createdAt,
    members: trip.members.map((tm) => tm.friend),
    bills: trip.bills.map((bill) => ({
      ...bill,
      createdById: bill.userId,
    })),
    isOwner: trip.userId === viewerUserId,
    ownerName: trip.user.name,
    ownerUserId: trip.userId,
  };
}
