'use client';

import { useRouter } from 'next/navigation';
import { Modal } from '@/src/components/Modal';
import { usePreferences } from '@/src/utils/preferences-provider';

type AuthRequiredModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

export default function AuthRequiredModal({ isOpen, onClose }: AuthRequiredModalProps) {
	const router = useRouter();
	const { t } = usePreferences();

	const goToAuth = (mode: 'login' | 'register') => {
		onClose();
		router.push(`/user?auth=${mode}`);
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={t('auth.requiredTitle')}
			showOkButton
			showCancelButton
			showCancel2Button
			okText={t('auth.goLogin')}
			cancelText={t('auth.goRegister')}
			cancel2Text={t('common.cancel')}
			onOk={() => goToAuth('login')}
			onCancel={() => goToAuth('register')}
			onCancel2={onClose}
		>
			<p className="modal-hint leading-relaxed">{t('auth.requiredBody')}</p>
		</Modal>
	);
}
