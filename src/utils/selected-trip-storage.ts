const STORAGE_PREFIX = 'tripFareCalc:selectedTripId:';
const LEGACY_SESSION_PREFIX = STORAGE_PREFIX;

function readLegacySessionValue(userId: string): string | null {
	if (typeof window === 'undefined') return null;
	return sessionStorage.getItem(`${LEGACY_SESSION_PREFIX}${userId}`);
}

export function getStoredSelectedTripId(userId: string | undefined | null): string | null {
	if (!userId || typeof window === 'undefined') return null;

	const key = `${STORAGE_PREFIX}${userId}`;
	const persisted = localStorage.getItem(key);
	if (persisted) return persisted;

	const legacy = readLegacySessionValue(userId);
	if (legacy) {
		localStorage.setItem(key, legacy);
		sessionStorage.removeItem(`${LEGACY_SESSION_PREFIX}${userId}`);
		return legacy;
	}

	return null;
}

export function setStoredSelectedTripId(userId: string, tripId: string) {
	if (typeof window === 'undefined') return;
	localStorage.setItem(`${STORAGE_PREFIX}${userId}`, tripId);
}

export function clearStoredSelectedTripId(userId: string) {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
	sessionStorage.removeItem(`${LEGACY_SESSION_PREFIX}${userId}`);
}
