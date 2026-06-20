'use client';

import { usePreferences } from '@/src/utils/preferences-provider';
import type { FriendLayoutMode } from '@/src/utils/friend-layout';
import { getNextFriendLayoutMode } from '@/src/utils/friend-layout';
import type { MessageKey } from '@/src/utils/i18n/types';

const MODE_LABEL_KEYS: Record<FriendLayoutMode, MessageKey> = {
	ring: 'friends.layout.ring',
	layered: 'friends.layout.layered',
	grid: 'friends.layout.grid',
};

const MODE_ICONS: Record<FriendLayoutMode, string> = {
	ring: '◯',
	layered: '◎',
	grid: '▦',
};

type FriendLayoutToggleProps = {
	mode: FriendLayoutMode;
	onChange: (mode: FriendLayoutMode) => void;
};

export default function FriendLayoutToggle({ mode, onChange }: FriendLayoutToggleProps) {
	const { t } = usePreferences();
	const label = t(MODE_LABEL_KEYS[mode]);

	return (
		<button
			type="button"
			onClick={() => onChange(getNextFriendLayoutMode(mode))}
			className="app-toolbar-chip inline-flex items-center gap-1 px-2 py-1 text-[10px]"
			aria-label={t('friends.layout.toggleAria', { mode: label })}
			title={label}
		>
			<span aria-hidden>{MODE_ICONS[mode]}</span>
			<span>{label}</span>
		</button>
	);
}
