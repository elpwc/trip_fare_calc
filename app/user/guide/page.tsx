'use client';

import { useRouter } from 'next/navigation';
import SettingsShell from '@/src/components/settings/SettingsShell';
import ReceiptPanel from '@/src/components/settings/ReceiptPanel';
import Perforation from '@/src/components/settings/Perforation';
import GuideScreenshot from '@/src/components/guide/GuideScreenshot';
import GuideSectionHeader from '@/src/components/guide/GuideSectionHeader';
import GuideSectionBody from '@/src/components/guide/GuideSectionBody';
import { useOnboardingOptional } from '@/src/components/onboarding/OnboardingProvider';
import { useAuth } from '@/src/utils/auth-provider';
import { usePreferences } from '@/src/utils/preferences-provider';
import { GUIDE_SECTIONS } from '@/src/utils/guide/sections';

export default function GuidePage() {
	const router = useRouter();
	const { t } = usePreferences();
	const { user } = useAuth();
	const onboarding = useOnboardingOptional();

	return (
		<SettingsShell title={t('page.guide')} subtitle={t('guide.subtitle')} stamp="GUIDE" backHref="/user">
			{user && onboarding ? (
				<button
					type="button"
					onClick={() => {
						onboarding.restartOnboarding();
						router.push('/');
					}}
					className="settings-btn-ghost mt-4 w-full py-2.5 text-sm"
				>
					{t('guide.restartOnboarding')}
				</button>
			) : null}

			<Perforation />

			{GUIDE_SECTIONS.map((section) => (
				<div key={section.id}>
					<section className="settings-receipt">
						<GuideSectionHeader serial={section.serial} title={t(section.titleKey)} subtitle={t(section.subtitleKey)} />
						<div className="px-4 py-4">
							<GuideSectionBody section={section} />
							{/* {!section.noScreenshot && <GuideScreenshot slot={section.screenshotSlot} />} */}
						</div>
						<div className="settings-receipt-teeth" aria-hidden />
					</section>
					<Perforation />
				</div>
			))}
		</SettingsShell>
	);
}
