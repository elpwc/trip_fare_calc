import { formatDisplayDate } from '@/src/utils/date';
import type { Member } from '@/src/types';

type TripSummary = { startDate?: string | null; createdAt: string };

export function getScaledFriendIconSize(
	participationCount: number,
	maxCount: number,
	scaleByParticipation: boolean,
	variant: 'list' | 'selector' = 'list',
): number | null {
	if (!scaleByParticipation) return null;

	const baseSize = 40;
	const maxSize = variant === 'list' ? 80 : 60;
	if (maxCount === 0) return baseSize;
	return baseSize + (participationCount / maxCount) * (maxSize - baseSize);
}

export function getFriendRecentTrip(trips?: TripSummary[]): TripSummary | null {
	if (!trips?.length) return null;

	return [...trips].sort((a, b) => {
		const aKey = a.startDate || a.createdAt.slice(0, 10);
		const bKey = b.startDate || b.createdAt.slice(0, 10);
		return bKey.localeCompare(aKey);
	})[0];
}

export function formatFriendRecentTripDate(trip: TripSummary, locale: string): string {
	const value = trip.startDate || trip.createdAt;
	return formatDisplayDate(value, locale, { month: '2-digit', day: '2-digit', year: '2-digit' });
}

export function getMaxParticipationCount(friends: Pick<Member, 'participationCount'>[]): number {
	return Math.max(...friends.map((friend) => friend.participationCount), 0);
}
