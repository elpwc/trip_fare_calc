'use client';

import { useState } from 'react';
import { Modal } from '@/src/components/Modal';
import PwaInstallGuide from '@/src/components/PwaInstallGuide';
import { usePwa } from '@/src/utils/pwa/pwa-provider';
import { usePreferences } from '@/src/utils/preferences-provider';

export default function PwaInstallButton() {
	const { t } = usePreferences();
	const { canInstall, isInstalled, install } = usePwa();
	const [message, setMessage] = useState('');
	const [guideOpen, setGuideOpen] = useState(false);

	const handleClick = async () => {
		setMessage('');
		if (isInstalled) return;

		if (canInstall) {
			const result = await install();
			if (result === 'dismissed') {
				setMessage(t('pwa.installDismissed'));
			}
			if (result === 'unavailable') {
				setGuideOpen(true);
			}
			return;
		}

		setGuideOpen(true);
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

			<Modal isOpen={guideOpen} onClose={() => setGuideOpen(false)} title={t('pwa.guideTitleBrowser')} showOkButton okText={t('common.ok')} onOk={() => setGuideOpen(false)}>
				<PwaInstallGuide />
			</Modal>
		</div>
	);
}
