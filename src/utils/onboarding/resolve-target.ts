import type { MessageKey } from '@/src/utils/i18n/messages';
import type { OnboardingStep } from '@/src/utils/onboarding/storage';

export type OnboardingTarget = {
	targetId: string;
	messageKey: MessageKey;
	placement: 'top' | 'bottom';
};

function isHomePath(pathname: string | null) {
	return pathname === '/' || pathname === '';
}

function isFriendsPath(pathname: string | null) {
	return pathname === '/friends';
}

export function resolveOnboardingTarget(step: OnboardingStep, pathname: string | null): OnboardingTarget {
	switch (step) {
		case 1:
			if (isFriendsPath(pathname)) {
				return { targetId: 'add-friend', messageKey: 'onboarding.step1.action', placement: 'top' };
			}
			return { targetId: 'friends-tab', messageKey: 'onboarding.step1.nav', placement: 'top' };
		case 2:
			if (isHomePath(pathname)) {
				return { targetId: 'new-trip', messageKey: 'onboarding.step2.action', placement: 'bottom' };
			}
			return { targetId: 'bills-tab', messageKey: 'onboarding.step2.nav', placement: 'top' };
		case 3:
			if (!isHomePath(pathname)) {
				return { targetId: 'bills-tab', messageKey: 'onboarding.step3.nav', placement: 'top' };
			}
			return { targetId: 'new-bill', messageKey: 'onboarding.step3.action', placement: 'top' };
		case 4:
			if (!isHomePath(pathname)) {
				return { targetId: 'bills-tab', messageKey: 'onboarding.step4.nav', placement: 'top' };
			}
			return { targetId: 'settle', messageKey: 'onboarding.step4.action', placement: 'top' };
		default:
			return { targetId: 'bills-tab', messageKey: 'onboarding.step2.nav', placement: 'top' };
	}
}
