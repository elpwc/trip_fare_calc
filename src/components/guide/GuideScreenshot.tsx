'use client';

import { usePreferences } from '@/src/utils/preferences-provider';

type GuideScreenshotProps = {
	slot: string;
};

export default function GuideScreenshot({ slot }: GuideScreenshotProps) {
	const { t } = usePreferences();

	return (
		<div
			className="mt-4 flex min-h-40 flex-col items-center justify-center rounded-sm border-2 border-dashed border-[#1a1814]/20 bg-[#f4efe4]/50 px-4 py-6 text-center dark:border-[#f4efe4]/15 dark:bg-[#121110]/50"
			data-guide-screenshot={slot}
		>
			<p className="text-app-muted text-[12px] leading-relaxed">{t('guide.screenshotPlaceholder')}</p>
			<p className="settings-mono mt-2 text-[10px] uppercase tracking-[0.2em] text-[#2a9d8f] dark:text-[#5fd3c4]">{slot}</p>
		</div>
	);
}
