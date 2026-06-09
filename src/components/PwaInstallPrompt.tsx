'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/src/components/Modal';
import PwaInstallGuide from '@/src/components/PwaInstallGuide';
import { PWA_PROMPT_DISMISSED_KEY } from '@/src/utils/pwa/constants';
import { usePwa } from '@/src/utils/pwa/pwa-provider';
import { usePreferences } from '@/src/utils/preferences-provider';

type PromptMode = 'ask' | 'guide';

export default function PwaInstallPrompt() {
	const { t } = usePreferences();
	const { canInstall, isInstalled, install } = usePwa();
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState<PromptMode>('ask');

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (isInstalled) return;
		if (localStorage.getItem(PWA_PROMPT_DISMISSED_KEY) === 'true') return;

		const timer = window.setTimeout(() => {
			setMode('ask');
			setOpen(true);
		}, 1200);

		return () => window.clearTimeout(timer);
	}, [isInstalled]);

	const dismissForever = () => {
		localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, 'true');
		setOpen(false);
	};

	const showBrowserGuide = () => {
		setMode('guide');
	};

	const handleSetup = async () => {
		if (canInstall) {
			const result = await install();
			if (result === 'accepted') {
				setOpen(false);
				return;
			}
			if (result === 'unavailable') {
				showBrowserGuide();
				return;
			}
			setOpen(false);
			return;
		}

		showBrowserGuide();
	};

	const handleClose = () => {
		setOpen(false);
		setMode('ask');
	};

	if (isInstalled) return null;

	const isGuide = mode === 'guide';

	return (
		<Modal
			isOpen={open}
			onClose={handleClose}
			title={isGuide ? t('pwa.guideTitleBrowser') : t('pwa.promptTitle')}
			showOkButton
			showCancelButton={!isGuide}
			showCancel2Button={!isGuide}
			okText={isGuide ? t('common.ok') : t('pwa.promptSetup')}
			cancelText={t('common.cancel')}
			cancel2Text={t('pwa.promptNever')}
			onOk={isGuide ? handleClose : handleSetup}
			onCancel={handleClose}
			onCancel2={dismissForever}
			showCloseButton={false}
		>
			{isGuide ? <PwaInstallGuide /> : <p className="modal-hint leading-relaxed">{t('pwa.promptBody')}</p>}
		</Modal>
	);
}
