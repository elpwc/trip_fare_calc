'use client';

import { useState } from 'react';
import { usePwa } from '@/src/utils/pwa/pwa-provider';
import { usePreferences } from '@/src/utils/preferences-provider';

export default function PwaInstallButton() {
	const { t } = usePreferences();
	const { canInstall, isInstalled, isIos, install } = usePwa();
	const [message, setMessage] = useState('');

	const handleClick = async () => {
		setMessage('');
		if (isInstalled) return;

		if (canInstall) {
			const result = await install();
			if (result === 'dismissed') {
				setMessage(t('pwa.installDismissed'));
			}
			return;
		}

		setMessage(isIos ? t('pwa.iosHint') : t('pwa.installUnavailable'));
	};

	return (
		<div id="pwa-install" className="scroll-mt-24">
			<p className="settings-mono text-app-muted text-[10px] uppercase tracking-[0.28em]">{t('pwa.sectionTitle')}</p>
			<p className="text-app-muted mt-2 text-[13px] leading-relaxed">{t('pwa.sectionDesc')}</p>
			<button
				type="button"
				onClick={handleClick}
				disabled={isInstalled}
				className={`settings-btn-primary mt-4 w-full ${isInstalled ? 'opacity-60' : ''}`}
			>
				{isInstalled ? t('pwa.installed') : t('pwa.installDesktop')}
			</button>
			{message ? <p className="text-app-muted mt-2 text-[12px] leading-relaxed">{message}</p> : null}
		</div>
	);
}
