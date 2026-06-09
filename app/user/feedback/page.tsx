'use client';

import { useState } from 'react';
import SettingsShell from '@/src/components/settings/SettingsShell';
import ReceiptPanel from '@/src/components/settings/ReceiptPanel';
import Perforation from '@/src/components/settings/Perforation';
import { usePreferences } from '@/src/utils/preferences-provider';
import type { MessageKey } from '@/src/utils/i18n/messages';

const faqKeys = [
	{ qKey: 'feedback.faq1q', aKey: 'feedback.faq1a' },
	{ qKey: 'feedback.faq2q', aKey: 'feedback.faq2a' },
	{ qKey: 'feedback.faq3q', aKey: 'feedback.faq3a' },
	{ qKey: 'feedback.faq4q', aKey: 'feedback.faq4a' },
	{ qKey: 'feedback.faq5q', aKey: 'feedback.faq5a' },
] as const satisfies ReadonlyArray<{ qKey: MessageKey; aKey: MessageKey }>;

export default function FeedbackPage() {
	const { t } = usePreferences();
	const [openIndex, setOpenIndex] = useState<number | null>(0);

	const milestoneKeys = [
		{ step: '01', titleKey: 'about.step1Title', descKey: 'about.step1Desc' },
		{ step: '02', titleKey: 'about.step2Title', descKey: 'about.step2Desc' },
		{ step: '03', titleKey: 'about.step3Title', descKey: 'about.step3Desc' },
		{ step: '04', titleKey: 'about.step4Title', descKey: 'about.step4Desc' },
	] as const satisfies ReadonlyArray<{ step: string; titleKey: MessageKey; descKey: MessageKey }>;

	return (
		<SettingsShell title={t('page.feedback')} subtitle="" stamp="HELP" backHref="/user">
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

			<Perforation />

			<ReceiptPanel label={t('feedback.faqSection')} serial="NO.001">
				<div className="space-y-3">
					{faqKeys.map((item, index) => {
						const open = openIndex === index;
						return (
							<div key={item.qKey} className="settings-faq-item overflow-hidden">
								<button type="button" onClick={() => setOpenIndex(open ? null : index)} className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left">
									<div>
										<span className="settings-mono text-[10px] text-[#2a9d8f] dark:text-[#5fd3c4]">Q{String(index + 1).padStart(2, '0')}</span>
										<p className="mt-1 font-semibold leading-snug">{t(item.qKey)}</p>
									</div>
									<span className="settings-mono text-app-danger shrink-0">{open ? '−' : '+'}</span>
								</button>
								{open ? (
									<div className="text-app-muted border-t border-dashed border-[#1a1814]/15 px-4 py-3 text-[13px] leading-relaxed dark:border-[#f4efe4]/10">{t(item.aKey)}</div>
								) : null}
							</div>
						);
					})}
				</div>
			</ReceiptPanel>

			<Perforation />

			<ReceiptPanel label={t('feedback.feedbackSection')} serial="NO.002">
				<p className="text-app-muted text-[13px] leading-relaxed">{t('feedback.contactLine')}</p>
			</ReceiptPanel>
		</SettingsShell>
	);
}
