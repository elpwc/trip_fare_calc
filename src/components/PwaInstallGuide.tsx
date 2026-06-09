'use client';

import { useMemo } from 'react';
import { detectPwaInstallGuidePlatform, getPwaInstallGuideSteps } from '@/src/utils/pwa/install-guide';
import { usePreferences } from '@/src/utils/preferences-provider';

export default function PwaInstallGuide() {
	const { t } = usePreferences();
	const steps = useMemo(() => {
		if (typeof navigator === 'undefined') return getPwaInstallGuideSteps('generic');
		return getPwaInstallGuideSteps(detectPwaInstallGuidePlatform(navigator.userAgent));
	}, []);

	return (
		<div className="modal-stack">
			<p className="modal-hint leading-relaxed">{t('pwa.guideIntro')}</p>
			<ol className="modal-hint list-decimal space-y-2 pl-5 text-[13px] leading-relaxed">
				{steps.map((key) => (
					<li key={key}>{t(key)}</li>
				))}
			</ol>
		</div>
	);
}
