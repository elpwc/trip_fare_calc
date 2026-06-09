'use client';

import Link from 'next/link';
import SettingsShell from '@/src/components/settings/SettingsShell';
import ReceiptPanel from '@/src/components/settings/ReceiptPanel';
import Perforation from '@/src/components/settings/Perforation';
import { usePreferences } from '@/src/utils/preferences-provider';
import type { MessageKey } from '@/src/utils/i18n/messages';

const milestoneKeys = [
	{ step: '01', titleKey: 'about.step1Title', descKey: 'about.step1Desc' },
	{ step: '02', titleKey: 'about.step2Title', descKey: 'about.step2Desc' },
	{ step: '03', titleKey: 'about.step3Title', descKey: 'about.step3Desc' },
	{ step: '04', titleKey: 'about.step4Title', descKey: 'about.step4Desc' },
] as const satisfies ReadonlyArray<{ step: string; titleKey: MessageKey; descKey: MessageKey }>;

export default function AboutPage() {
	const { t } = usePreferences();

	return (
		<SettingsShell title={t('page.about')} subtitle="" stamp="ABOUT" backHref="/user">
			<ReceiptPanel label="TRIP FARE CALC" serial="v0.1.0">
				<div className="space-y-4">
					<p className="settings-display text-2xl leading-tight"></p>
					<p className="text-app-muted whitespace-pre-line text-[14px] leading-relaxed">{t('about.intro')}</p>
				</div>
			</ReceiptPanel>

			<Perforation />

			<ReceiptPanel label="HOW IT WORKS" serial="GUIDE">
				<div className="space-y-0">
					{milestoneKeys.map((item, index) => (
						<div key={item.step} className={`flex gap-4 py-4 ${index !== milestoneKeys.length - 1 ? 'border-b border-dashed border-[#1a1814]/15 dark:border-[#f4efe4]/10' : ''}`}>
							<div className="settings-mono flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#1a1814] bg-[#2a9d8f] text-[11px] font-bold text-[#fffdf8] dark:border-[#f4efe4] dark:bg-[#5fd3c4] dark:text-[#1a1814]">
								{item.step}
							</div>
							<div>
								<p className="font-semibold">{t(item.titleKey)}</p>
								<p className="text-app-muted mt-1 text-[13px] leading-relaxed">{t(item.descKey)}</p>
							</div>
						</div>
					))}
				</div>
			</ReceiptPanel>
		</SettingsShell>
	);
}
