import prisma from '@/lib/prisma';
import type { TripBillEvent, TripBillEventType } from '@/src/types/trip-realtime';

export type { TripBillEvent, TripBillEventType };

type TripSubscriber = {
	userId: string;
	send: (event: TripBillEvent) => void;
};

const subscribersByTrip = new Map<string, Set<TripSubscriber>>();

function getTripSet(tripId: string) {
	let set = subscribersByTrip.get(tripId);
	if (!set) {
		set = new Set();
		subscribersByTrip.set(tripId, set);
	}
	return set;
}

export function subscribeTripEvents(tripId: string, userId: string, send: (event: TripBillEvent) => void) {
	const subscriber: TripSubscriber = { userId, send };
	getTripSet(tripId).add(subscriber);

	return () => {
		const set = subscribersByTrip.get(tripId);
		if (!set) return;
		set.delete(subscriber);
		if (set.size === 0) {
			subscribersByTrip.delete(tripId);
		}
	};
}

export function publishTripBillEvent(event: TripBillEvent) {
	const set = subscribersByTrip.get(event.tripId);
	if (!set?.size) return;
	set.forEach((subscriber) => {
		try {
			subscriber.send(event);
		} catch {
			// subscriber disconnected
		}
	});
}

export async function notifyTripBillChange(params: {
	type: TripBillEventType;
	tripId: string;
	billId: string;
	actorUserId: string;
	billName: string;
	amount: number;
	currency: string;
}) {
	const actor = await prisma.user.findUnique({
		where: { id: params.actorUserId },
		select: { name: true },
	});

	publishTripBillEvent({
		...params,
		actorName: actor?.name ?? '?',
	});
}
