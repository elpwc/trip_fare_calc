'use client';

import GuideBubble from '@/src/components/onboarding/GuideBubble';
import { usePreferences } from '@/src/utils/preferences-provider';

type OnboardingBubbleProps = {
	targetId: string;
	message: string;
	step: number;
	totalSteps: number;
	placement: 'top' | 'bottom';
	onSkipStep: () => void;
	onSkipAll: () => void;
};

export default function OnboardingBubble({ targetId, message, step, totalSteps, placement, onSkipStep, onSkipAll }: OnboardingBubbleProps) {
	const { t } = usePreferences();

	return (
		<GuideBubble
			targetId={targetId}
			message={message}
			placement={placement}
			header={
				<p className="settings-mono text-[10px] uppercase tracking-[0.24em] text-[#2a9d8f] dark:text-[#5fd3c4]">
					{t('onboarding.stepIndicator', { current: step, total: totalSteps })}
				</p>
			}
			footer={
				<>
					<button type="button" onClick={onSkipStep} className="settings-btn-ghost !px-2.5 !py-1.5 text-[11px]">
						{t('onboarding.skipStep')}
					</button>
					<button type="button" onClick={onSkipAll} className="settings-mono text-[10px] uppercase tracking-[0.16em] text-app-muted underline-offset-2 hover:underline">
						{t('onboarding.skip')}
					</button>
				</>
			}
		/>
	);
}
