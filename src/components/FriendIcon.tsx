'use client';

import React from 'react';
import { usePreferences } from '@/src/utils/preferences-provider';

type FriendIconProps = {
	name: string;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	isSelf?: boolean;
	className?: string;
	style?: React.CSSProperties;
};

const FRIEND_TONE_CLASSES = [
	'bg-[#fde8d8] text-[#9a3412] dark:bg-orange-500/25 dark:text-orange-200',
	'bg-[#ede9fe] text-[#5b21b6] dark:bg-violet-500/25 dark:text-violet-200',
	'bg-[#cffafe] text-[#0e7490] dark:bg-cyan-500/20 dark:text-cyan-200',
	'bg-[#fce7f3] text-[#9d174d] dark:bg-pink-500/25 dark:text-pink-200',
	'bg-[#fef9c3] text-[#854d0e] dark:bg-yellow-500/20 dark:text-yellow-200',
	'bg-[#e0e7ff] text-[#3730a3] dark:bg-indigo-500/25 dark:text-indigo-200',
	'bg-[#ecfccb] text-[#3f6212] dark:bg-lime-500/20 dark:text-lime-200',
	'bg-[#e2e8f0] text-[#475569] dark:bg-slate-500/25 dark:text-slate-200',
] as const;

export function getFriendToneClass(name: string): string {
	const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
	return FRIEND_TONE_CLASSES[hash % FRIEND_TONE_CLASSES.length];
}

/** @deprecated Use getFriendToneClass */
export function getBackgroundColor(name: string): string {
	return getFriendToneClass(name);
}

export function getDisplayText(name: string): string {
	if (name.length <= 2) return name;
	if (/[\u4e00-\u9fa5]/.test(name)) {
		return name.substring(0, 2);
	}
	return name.substring(0, 2).toUpperCase();
}

function getSizeClasses(size: 'sm' | 'md' | 'lg' | 'xl'): { container: string; badge: string } {
	const sizeMap = {
		sm: {
			container: 'h-6 w-6 text-[8px]',
			badge: 'min-h-[14px] min-w-[14px] px-0.5 text-[9px] -bottom-1 -right-1.5',
		},
		md: {
			container: 'h-8 w-8 text-[10px]',
			badge: 'min-h-[16px] min-w-[16px] px-0.5 text-[10px] -bottom-1 -right-2',
		},
		lg: {
			container: 'h-11 w-11 text-[11px]',
			badge: 'min-h-[18px] min-w-[18px] px-1 text-[11px] -bottom-1 -right-2',
		},
		xl: {
			container: 'h-14 w-14 text-xs',
			badge: 'min-h-[20px] min-w-[20px] px-1 text-xs -bottom-1 -right-2.5',
		},
	};
	return sizeMap[size];
}

const SELF_BADGE_BASE =
	'absolute z-10 inline-flex items-center justify-center rounded-full border-2 border-[#1a1814] bg-[#e63946] font-bold leading-none text-[#fffdf8] shadow-[1px_1px_0_rgba(26,24,20,0.35)] ring-1 ring-[#fffdf8] dark:border-[#f4efe4] dark:bg-[#ff6b6b] dark:text-[#1a1814] dark:ring-[#1c1a18] dark:shadow-[1px_1px_0_rgba(244,239,228,0.2)]';

const STAMP_BASE =
	'relative inline-flex shrink-0 items-center justify-center border-2 border-[#1a1814] font-bold shadow-[2px_2px_0_rgba(26,24,20,0.12)] transition-transform dark:border-[#f4efe4] dark:shadow-[2px_2px_0_rgba(244,239,228,0.06)] settings-mono';

export const FriendIcon: React.FC<FriendIconProps> = ({ name, size = 'md', isSelf = false, className = '', style }) => {
	const { t } = usePreferences();
	const sizeClasses = getSizeClasses(size);
	const toneClass = getFriendToneClass(name);
	const displayText = getDisplayText(name);

	return (
		<div
			className={`${STAMP_BASE} ${sizeClasses.container} ${toneClass} ${className}`}
			style={style}
			title={name}
		>
			{displayText}
			{isSelf ? (
				<span className={`${SELF_BADGE_BASE} ${sizeClasses.badge}`}>{t('common.self')}</span>
			) : null}
		</div>
	);
};

export default FriendIcon;
