'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/utils/auth-provider';
import { usePreferences } from '@/src/utils/preferences-provider';
import OnboardingBubble from '@/src/components/onboarding/OnboardingBubble';
import { resolveOnboardingTarget } from '@/src/utils/onboarding/resolve-target';
import {
	ONBOARDING_CHANGED_EVENT,
	ONBOARDING_FRIEND_ADDED_EVENT,
	ONBOARDING_TRIP_CREATED_EVENT,
	completeOnboarding,
	getOnboardingStatus,
	setOnboardingStep,
	skipOnboarding,
	type OnboardingStep,
	type OnboardingStatus,
	restartOnboarding as restartOnboardingStorage,
} from '@/src/utils/onboarding/storage';

type OnboardingContextValue = {
	status: OnboardingStatus;
	restartOnboarding: () => void;
	skipOnboardingGuide: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

const TOTAL_STEPS = 4;

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const { user } = useAuth();
	const { t } = usePreferences();
	const [status, setStatus] = useState<OnboardingStatus>('inactive');

	const syncStatus = useCallback(() => {
		setStatus(getOnboardingStatus(user?.id));
	}, [user?.id]);

	useEffect(() => {
		syncStatus();
	}, [syncStatus]);

	useEffect(() => {
		const handleChange = () => syncStatus();
		window.addEventListener(ONBOARDING_CHANGED_EVENT, handleChange);
		return () => window.removeEventListener(ONBOARDING_CHANGED_EVENT, handleChange);
	}, [syncStatus]);

	const advanceTo = useCallback(
		(step: OnboardingStep) => {
			if (!user?.id) return;
			setOnboardingStep(user.id, step);
		},
		[user?.id],
	);

	useEffect(() => {
		if (!user?.id || typeof status !== 'number') return;

		const handleFriendAdded = () => {
			if (status === 1) advanceTo(2);
		};
		const handleTripCreated = () => {
			if (status === 2) advanceTo(3);
		};

		window.addEventListener(ONBOARDING_FRIEND_ADDED_EVENT, handleFriendAdded);
		window.addEventListener(ONBOARDING_TRIP_CREATED_EVENT, handleTripCreated);
		return () => {
			window.removeEventListener(ONBOARDING_FRIEND_ADDED_EVENT, handleFriendAdded);
			window.removeEventListener(ONBOARDING_TRIP_CREATED_EVENT, handleTripCreated);
		};
	}, [status, user?.id, advanceTo]);

	useEffect(() => {
		if (!user?.id || status !== 3) return;
		if (pathname?.startsWith('/bills/new')) {
			advanceTo(4);
		}
	}, [pathname, status, user?.id, advanceTo]);

	useEffect(() => {
		if (!user?.id || status !== 4) return;
		if (pathname === '/settle') {
			completeOnboarding(user.id);
		}
	}, [pathname, status, user?.id]);

	const restartOnboarding = useCallback(() => {
		if (!user?.id) return;
		restartOnboardingStorage(user.id);
	}, [user?.id]);

	const skipOnboardingGuide = useCallback(() => {
		if (!user?.id) return;
		skipOnboarding(user.id);
	}, [user?.id]);

	const skipCurrentStep = useCallback(() => {
		if (!user?.id || typeof status !== 'number') return;
		if (status >= TOTAL_STEPS) {
			completeOnboarding(user.id);
			return;
		}
		advanceTo((status + 1) as OnboardingStep);
	}, [user?.id, status, advanceTo]);

	const contextValue = useMemo(
		() => ({
			status,
			restartOnboarding,
			skipOnboardingGuide,
		}),
		[status, restartOnboarding, skipOnboardingGuide],
	);

	const activeStep = typeof status === 'number' ? status : null;
	const target = activeStep ? resolveOnboardingTarget(activeStep, pathname) : null;

	return (
		<OnboardingContext.Provider value={contextValue}>
			{children}
			{user && activeStep && target ? (
				<OnboardingBubble
					targetId={target.targetId}
					message={t(target.messageKey)}
					step={activeStep}
					totalSteps={TOTAL_STEPS}
					placement={target.placement}
					onSkipStep={skipCurrentStep}
					onSkipAll={skipOnboardingGuide}
				/>
			) : null}
		</OnboardingContext.Provider>
	);
}

export function useOnboardingOptional() {
	return useContext(OnboardingContext);
}

export function useOnboarding() {
	const context = useContext(OnboardingContext);
	if (!context) {
		throw new Error('useOnboarding must be used within OnboardingProvider');
	}
	return context;
}
