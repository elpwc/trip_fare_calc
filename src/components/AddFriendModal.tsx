'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/src/components/Modal';
import { apiPath } from '@/src/config/paths';
import { getAuthHeaders } from '@/src/utils/auth';
import { usePreferences } from '@/src/utils/preferences-provider';
import type { Friend } from '@/src/types';

type AddFriendModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onAdded?: (friend: Friend) => void;
};

export default function AddFriendModal({ isOpen, onClose, onAdded }: AddFriendModalProps) {
	const { t } = usePreferences();
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [isSelf, setIsSelf] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		setName('');
		setDescription('');
		setIsSelf(false);
	}, [isOpen]);

	const handleAdd = async () => {
		if (!name.trim()) return;

		try {
			const response = await fetch(apiPath('/api/friends'), {
				method: 'POST',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: name.trim(),
					description,
					isSelf,
				}),
			});

			if (response.ok) {
				const newFriend = await response.json();
				onAdded?.({ ...newFriend, trips: newFriend.trips ?? [] });
				onClose();
			}
		} catch (error) {
			console.error('Failed to add friend:', error);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={t('friends.addTitle')}
			onOk={handleAdd}
			okText={t('common.add')}
			showOkButton
			showCancelButton
			cancelText={t('common.cancel')}
		>
			<div className="modal-stack">
				<div className="modal-field">
					<label className="app-label">{t('friends.name')}</label>
					<input type="text" placeholder={t('friends.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} className="settings-input py-2 text-sm" />
				</div>
				<div className="modal-field">
					<label className="app-label">{t('friends.description')}</label>
					<input
						type="text"
						placeholder={t('friends.descriptionPlaceholder')}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="settings-input py-2 text-sm"
					/>
				</div>
				<button type="button" onClick={() => setIsSelf(!isSelf)} className={`settings-chip w-full ${isSelf ? 'settings-chip-active' : ''}`}>
					{isSelf ? t('friends.isSelfSelected') : t('friends.isSelf')}
				</button>
			</div>
		</Modal>
	);
}
