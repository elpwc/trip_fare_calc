'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/src/components/Modal';
import { PWA_PROMPT_DISMISSED_KEY } from '@/src/utils/pwa/constants';
import { usePwa } from '@/src/utils/pwa/pwa-provider';
import { usePreferences } from '@/src/utils/preferences-provider';

export default function PwaInstallPrompt() {
	const router = useRouter();
	const { t } = usePreferences();
	const { canInstall, isInstalled, isIos, install } = usePwa();
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (isInstalled) return;
		if (localStorage.getItem(PWA_PROMPT_DISMISSED_KEY) === 'true') return;

		const timer = window.setTimeout(() => {
			setOpen(true);
		}, 1200);

		return () => window.clearTimeout(timer);
	}, [isInstalled]);

	const dismissForever = () => {
		localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, 'true');
		setOpen(false);
	};

	const handleSetup = async () => {
		if (canInstall) {
			await install();
			setOpen(false);
			return;
		}

		setOpen(false);
		router.push('/user#pwa-install');
	};

	if (isInstalled) return null;

	return (
		<Modal
			isOpen={open}
			onClose={() => setOpen(false)}
			title={t('pwa.promptTitle')}
			showOkButton
			showCancelButton
			showCancel2Button
			okText={t('pwa.promptSetup')}
			cancelText={t('common.cancel')}
			cancel2Text={t('pwa.promptNever')}
			onOk={handleSetup}
			onCancel={() => setOpen(false)}
			onCancel2={dismissForever}
			showCloseButton={false}
		>
			<div className="modal-stack">
				<p className="modal-hint leading-relaxed">{t('pwa.promptBody')}</p>
				{isIos && !canInstall ? <p className="modal-hint text-[12px] leading-relaxed">{t('pwa.iosHint')}</p> : null}
			</div>
		</Modal>
	);
}
