const STORAGE_PREFIX = 'tripFareCalc:selectedTripId:';

export function getStoredSelectedTripId(userId: string | undefined | null): string | null {
	if (!userId || typeof window === 'undefined') return null;
	return sessionStorage.getItem(`${STORAGE_PREFIX}${userId}`);
}

export function setStoredSelectedTripId(userId: string, tripId: string) {
	if (typeof window === 'undefined') return;
	sessionStorage.setItem(`${STORAGE_PREFIX}${userId}`, tripId);
}
