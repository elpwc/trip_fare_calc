export type OnboardingStep = 1 | 2 | 3 | 4;
export type OnboardingStatus = OnboardingStep | 'done' | 'inactive';

const STORAGE_PREFIX = 'tripFareCalc:onboarding:';

export const ONBOARDING_CHANGED_EVENT = 'tripFareCalc:onboarding-changed';
export const ONBOARDING_FRIEND_ADDED_EVENT = 'tripFareCalc:onboarding-friend-added';
export const ONBOARDING_TRIP_CREATED_EVENT = 'tripFareCalc:onboarding-trip-created';

function storageKey(userId: string) {
	return `${STORAGE_PREFIX}${userId}`;
}

function readStorage(): Record<string, OnboardingStatus> {
	if (typeof window === 'undefined') return {};
	try {
		const raw = window.localStorage.getItem(STORAGE_PREFIX.slice(0, -1));
		if (!raw) return {};
		const parsed = JSON.parse(raw) as Record<string, OnboardingStatus>;
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}

function writeStorage(data: Record<string, OnboardingStatus>) {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(STORAGE_PREFIX.slice(0, -1), JSON.stringify(data));
}

export function notifyOnboardingChanged() {
	if (typeof window === 'undefined') return;
	window.dispatchEvent(new Event(ONBOARDING_CHANGED_EVENT));
}

export function getOnboardingStatus(userId: string | undefined | null): OnboardingStatus {
	if (!userId || typeof window === 'undefined') return 'inactive';
	const status = readStorage()[userId];
	if (status === 'done' || status === 1 || status === 2 || status === 3 || status === 4) return status;
	return 'inactive';
}

export function startOnboarding(userId: string) {
	if (typeof window === 'undefined') return;
	const data = readStorage();
	data[userId] = 1;
	writeStorage(data);
	notifyOnboardingChanged();
}

export function setOnboardingStep(userId: string, step: OnboardingStep) {
	if (typeof window === 'undefined') return;
	const data = readStorage();
	data[userId] = step;
	writeStorage(data);
	notifyOnboardingChanged();
}

export function completeOnboarding(userId: string) {
	if (typeof window === 'undefined') return;
	const data = readStorage();
	data[userId] = 'done';
	writeStorage(data);
	notifyOnboardingChanged();
}

export function skipOnboarding(userId: string) {
	completeOnboarding(userId);
}

export function restartOnboarding(userId: string) {
	startOnboarding(userId);
}
