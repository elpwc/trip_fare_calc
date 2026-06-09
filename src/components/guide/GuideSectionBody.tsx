'use client';

import type { ReactNode } from 'react';
import { usePreferences } from '@/src/utils/preferences-provider';
import type { GuideSection } from '@/src/utils/guide/sections';

function GuideWhy({ children }: { children: ReactNode }) {
	const { t } = usePreferences();
	return (
		<div className="mb-4 rounded-sm border-l-4 border-[#e63946] bg-[#fde8e8]/80 px-3.5 py-3 dark:border-[#ff6b6b] dark:bg-[#ff6b6b]/10">
			<p className="settings-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#c1121f] dark:text-[#ff8787]">{t('guide.whyLabel')}</p>
			<p className="mt-1.5 text-[13px] leading-relaxed">{children}</p>
		</div>
	);
}

function GuideStepsLabel() {
	const { t } = usePreferences();
	return <p className="settings-mono mb-2.5 text-[10px] uppercase tracking-[0.22em] text-[#2a9d8f] dark:text-[#5fd3c4]">{t('guide.stepsLabel')}</p>;
}

function GuideStep({ index, children }: { index: number; children: ReactNode }) {
	return (
		<li className="flex gap-3 text-[13px] leading-relaxed">
			<span className="settings-mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1a1814] text-[11px] font-bold text-[#f4efe4] dark:bg-[#f4efe4] dark:text-[#1a1814]">
				{index}
			</span>
			<span className="min-w-0 flex-1 pt-0.5">{children}</span>
		</li>
	);
}

function GuidePath({ children }: { children: ReactNode }) {
	return <span className="font-semibold text-[#2a9d8f] dark:text-[#5fd3c4]">「{children}」</span>;
}

function GuideEm({ children }: { children: ReactNode }) {
	return <strong className="font-bold text-[#1a1814] dark:text-[#f4efe4]">{children}</strong>;
}

function GuideNote({ children }: { children: ReactNode }) {
	const { t } = usePreferences();
	return (
		<div className="mt-4 rounded-sm border border-dashed border-[#1a1814]/15 bg-[#fef9c3]/50 px-3 py-2.5 dark:border-[#f4efe4]/10 dark:bg-[#121110]/80">
			<span className="settings-mono text-[9px] uppercase tracking-[0.18em] text-[#854d0e] dark:text-[#fde047]">{t('guide.tipLabel')}</span>
			<p className="mt-1 text-[12px] italic leading-relaxed text-[#6b6458] dark:text-[#a89f8f]">{children}</p>
		</div>
	);
}

type GuideSectionBodyProps = {
	section: GuideSection;
};

export default function GuideSectionBody({ section }: GuideSectionBodyProps) {
	const { t } = usePreferences();

	switch (section.id) {
		case 'overview':
			return (
				<>
					<GuideWhy>{t('guide.section.overview.why')}</GuideWhy>
					<GuideStepsLabel />
					<ol className="space-y-3">
						<GuideStep index={1}>{t('guide.section.overview.step1')}</GuideStep>
						<GuideStep index={2}>{t('guide.section.overview.step2')}</GuideStep>
						<GuideStep index={3}>{t('guide.section.overview.step3')}</GuideStep>
						<GuideStep index={4}>{t('guide.section.overview.step4')}</GuideStep>
						<GuideStep index={5}>{t('guide.section.overview.step5')}</GuideStep>
					</ol>
				</>
			);
		case 'friends':
			return (
				<>
					<GuideWhy>{t('guide.section.friends.why')}</GuideWhy>
					<GuideStepsLabel />
					<ol className="space-y-3">
						<GuideStep index={1}>
							{t('guide.section.friends.step1.prefix')}
							<GuidePath>{t('nav.friends')}</GuidePath>
							{t('guide.section.friends.step1.suffix')}
						</GuideStep>
						<GuideStep index={2}>{t('guide.section.friends.step2')}</GuideStep>
						<GuideStep index={3}>{t('guide.section.friends.step3')}</GuideStep>
					</ol>
					<GuideNote>{t('guide.section.friends.note')}</GuideNote>
				</>
			);
		case 'trip':
			return (
				<>
					<GuideWhy>{t('guide.section.trip.why')}</GuideWhy>
					<GuideStepsLabel />
					<ol className="space-y-3">
						<GuideStep index={1}>
							{t('guide.section.trip.step1.prefix')}
							<GuidePath>{t('nav.bills')}</GuidePath>
							{t('guide.section.trip.step1.suffix')}
							<GuideEm>+</GuideEm>
							{t('guide.section.trip.step1.end')}
						</GuideStep>
						<GuideStep index={2}>{t('guide.section.trip.step2')}</GuideStep>
						<GuideStep index={3}>{t('guide.section.trip.step3')}</GuideStep>
					</ol>
				</>
			);
		case 'bill':
			return (
				<>
					<GuideWhy>{t('guide.section.bill.why')}</GuideWhy>
					<GuideStepsLabel />
					<ol className="space-y-3">
						<GuideStep index={1}>
							{t('guide.section.bill.step1.prefix')}
							<GuideEm>+</GuideEm>
							{t('guide.section.bill.step1.suffix')}
						</GuideStep>
						<GuideStep index={2}>{t('guide.section.bill.step2')}</GuideStep>
						<GuideStep index={3}>{t('guide.section.bill.step3')}</GuideStep>
						<GuideStep index={4}>{t('guide.section.bill.step4')}</GuideStep>
					</ol>
				</>
			);
		case 'share':
			return (
				<>
					<GuideWhy>{t('guide.section.share.why')}</GuideWhy>
					<GuideStepsLabel />
					<ol className="space-y-3">
						<GuideStep index={1}>{t('guide.section.share.step1')}</GuideStep>
						<GuideStep index={2}>{t('guide.section.share.step2')}</GuideStep>
						<GuideStep index={3}>{t('guide.section.share.step3')}</GuideStep>
					</ol>
				</>
			);
		case 'settle':
			return (
				<>
					<GuideWhy>{t('guide.section.settle.why')}</GuideWhy>
					<GuideStepsLabel />
					<ol className="space-y-3">
						<GuideStep index={1}>
							{t('guide.section.settle.step1.prefix')}
							<GuidePath>{t('home.settle')}</GuidePath>
							{t('guide.section.settle.step1.suffix')}
						</GuideStep>
						<GuideStep index={2}>{t('guide.section.settle.step2')}</GuideStep>
						<GuideStep index={3}>{t('guide.section.settle.step3')}</GuideStep>
					</ol>
				</>
			);
		case 'chart':
			return (
				<>
					<GuideWhy>{t('guide.section.chart.why')}</GuideWhy>
					<GuideStepsLabel />
					<ol className="space-y-3">
						<GuideStep index={1}>{t('guide.section.chart.step1')}</GuideStep>
						<GuideStep index={2}>{t('guide.section.chart.step2')}</GuideStep>
					</ol>
				</>
			);
		case 'history':
			return (
				<>
					<GuideWhy>{t('guide.section.history.why')}</GuideWhy>
					<GuideStepsLabel />
					<ol className="space-y-3">
						<GuideStep index={1}>
							{t('guide.section.history.step1.prefix')}
							<GuidePath>{t('nav.history')}</GuidePath>
							{t('guide.section.history.step1.suffix')}
						</GuideStep>
						<GuideStep index={2}>{t('guide.section.history.step2')}</GuideStep>
					</ol>
				</>
			);
		default:
			return null;
	}
}
