'use client';

import React, { useMemo, useState } from 'react';
import FriendIcon from '@/src/components/FriendIcon';
import FriendLayoutToggle from '@/src/components/FriendLayout/FriendLayoutToggle';
import type { Member } from '@/src/types';
import type { MessageKey } from '@/src/utils/i18n/types';
import {
	getFriendLayoutCanvasSize,
	getFriendLayoutPosition,
	getGridColumns,
	type FriendLayoutMode,
} from '@/src/utils/friend-layout';
import {
	formatFriendRecentTripDate,
	getFriendRecentTrip,
	getMaxParticipationCount,
	getScaledFriendIconSize,
} from '@/src/utils/friend-layout-display';
import { usePreferences } from '@/src/utils/preferences-provider';
import type { Locale } from '@/src/utils/preferences/constants';

type LayoutFriend = Member & {
	trips?: { id: string; name: string; startDate?: string | null; createdAt: string }[];
};

type FriendLayoutBoardProps = {
	friends: LayoutFriend[];
	scaleByParticipation?: boolean;
	showTripMeta?: boolean;
	showLayoutToggle?: boolean;
	variant?: 'list' | 'selector';
	emptyMessageKey: MessageKey;
	className?: string;
	ringRadius?: number;
	selectedFriends?: string[];
	onFriendClick?: (friend: LayoutFriend) => void;
	onToggleFriend?: (friendId: string) => void;
};

const DATE_LOCALE_MAP: Record<Locale, string> = {
	'zh-CN': 'zh-CN',
	en: 'en-US',
	ja: 'ja-JP',
};

function FriendMeta({
	friend,
	showTripMeta,
	dateLocale,
}: {
	friend: LayoutFriend;
	showTripMeta: boolean;
	dateLocale: string;
}) {
	const { t } = usePreferences();

	if (!showTripMeta) {
		return <span className="mt-1 max-w-[4.5rem] truncate text-center text-xs">{friend.name}</span>;
	}

	const recentTrip = getFriendRecentTrip(friend.trips);
	const recentDate = recentTrip ? formatFriendRecentTripDate(recentTrip, dateLocale) : null;

	return (
		<div className="mt-1 flex max-w-[4.75rem] flex-col items-center gap-px text-center">
			<span className="w-full truncate text-xs font-semibold">{friend.name}</span>
			<span className="settings-mono text-[8px] leading-tight text-app-muted">
				{t('friends.layout.tripMetaCount', { count: friend.participationCount })}
			</span>
			{recentDate ? (
				<span className="settings-mono text-[8px] leading-tight text-app-muted">
					{t('friends.layout.lastTrip', { date: recentDate })}
				</span>
			) : null}
		</div>
	);
}

export default function FriendLayoutBoard({
	friends,
	scaleByParticipation = false,
	showTripMeta = true,
	showLayoutToggle = true,
	variant = 'list',
	emptyMessageKey,
	className = '',
	ringRadius = variant === 'list' ? 150 : 120,
	selectedFriends = [],
	onFriendClick,
	onToggleFriend,
}: FriendLayoutBoardProps) {
	const { t, locale } = usePreferences();
	const [layoutMode, setLayoutMode] = useState<FriendLayoutMode>('grid');
	const dateLocale = DATE_LOCALE_MAP[locale];

	const maxParticipation = useMemo(() => getMaxParticipationCount(friends), [friends]);

	const iconSizes = useMemo(
		() =>
			friends.map((friend) =>
				getScaledFriendIconSize(friend.participationCount, maxParticipation, scaleByParticipation, variant),
			),
		[friends, maxParticipation, scaleByParticipation, variant],
	);

	const maxIconSize = useMemo(() => {
		if (scaleByParticipation) {
			return Math.max(...iconSizes.map((size) => size ?? 44), 44);
		}
		return variant === 'list' ? 44 : 44;
	}, [iconSizes, scaleByParticipation, variant]);

	const canvasSize = useMemo(
		() =>
			getFriendLayoutCanvasSize(layoutMode, friends.length, maxIconSize, {
				withMeta: showTripMeta,
				ringRadius,
			}),
		[layoutMode, friends.length, maxIconSize, showTripMeta, ringRadius],
	);

	const nameClassName = showTripMeta ? '' : variant === 'selector' ? 'mt-1 max-w-16 truncate text-[10px] font-semibold' : 'mt-1 max-w-16 truncate text-center text-xs';

	const renderFriendIcon = (friend: LayoutFriend, index: number, isSelected: boolean) => {
		const customSize = iconSizes[index];
		const iconStyle = customSize
			? { width: customSize, height: customSize, fontSize: Math.max(10, Math.round(customSize * 0.24)) }
			: undefined;

		const icon = (
			<div className={isSelected ? 'rounded-full ring-2 ring-[#2a9d8f] ring-offset-2 ring-offset-[#fffdf8] dark:ring-offset-[#1c1a18]' : ''}>
				<FriendIcon
					name={friend.name}
					size="lg"
					isSelf={friend.isSelf}
					className={variant === 'list' ? 'hover:-translate-x-px hover:-translate-y-px' : ''}
					style={iconStyle}
				/>
			</div>
		);

		if (showTripMeta) {
			return (
				<>
					{icon}
					<FriendMeta friend={friend} showTripMeta={showTripMeta} dateLocale={dateLocale} />
				</>
			);
		}

		return (
			<>
				{icon}
				<span className={nameClassName}>{friend.name}</span>
			</>
		);
	};

	const renderAbsoluteItem = (friend: LayoutFriend, index: number) => {
		const position = getFriendLayoutPosition(layoutMode, index, friends.length, {
			ringRadius,
			withMeta: showTripMeta,
		});
		const customSize = iconSizes[index] ?? 44;
		const isSelected = selectedFriends.includes(friend.id);
		const commonClassName = `absolute flex flex-col items-center transition-all ${
			variant === 'selector'
				? `${isSelected ? 'scale-110' : 'opacity-80 hover:opacity-100'}`
				: 'cursor-pointer transition-transform hover:scale-105'
		}`;

		const style = {
			left: `calc(50% + ${position.x}px - ${customSize / 2}px)`,
			top: `calc(50% + ${position.y}px - ${customSize / 2}px)`,
		};

		if (variant === 'selector' && onToggleFriend) {
			return (
				<button
					key={friend.id}
					type="button"
					className={`${commonClassName} cursor-pointer`}
					style={style}
					onClick={() => onToggleFriend(friend.id)}
				>
					{renderFriendIcon(friend, index, isSelected)}
				</button>
			);
		}

		return (
			<div key={friend.id} className={commonClassName} style={style} onClick={() => onFriendClick?.(friend)}>
				{renderFriendIcon(friend, index, false)}
			</div>
		);
	};

	const renderGridItem = (friend: LayoutFriend, index: number) => {
		const isSelected = selectedFriends.includes(friend.id);
		const itemClassName =
			variant === 'selector'
				? `flex flex-col items-center transition-all ${isSelected ? 'scale-105' : 'opacity-80 hover:opacity-100'}`
				: 'flex cursor-pointer flex-col items-center transition-transform hover:scale-105';

		const content = renderFriendIcon(friend, index, isSelected);

		if (variant === 'selector' && onToggleFriend) {
			return (
				<button key={friend.id} type="button" className={`${itemClassName} cursor-pointer`} onClick={() => onToggleFriend(friend.id)}>
					{content}
				</button>
			);
		}

		return (
			<div key={friend.id} className={itemClassName} onClick={() => onFriendClick?.(friend)}>
				{content}
			</div>
		);
	};

	return (
		<div className={`flex h-full w-full flex-col ${className}`}>
			{friends.length > 0 && showLayoutToggle ? (
				<div className="mb-1 flex justify-end px-1">
					<FriendLayoutToggle mode={layoutMode} onChange={setLayoutMode} />
				</div>
			) : null}

			<div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto">
				{friends.length === 0 ? (
					<div className={`text-center text-app-muted ${variant === 'list' ? '' : 'modal-hint'}`}>
						<div className={variant === 'list' ? 'mb-4 text-4xl' : 'mb-1 text-xl'}>👥</div>
						<div className={variant === 'list' ? 'text-lg font-medium' : ''}>{t(emptyMessageKey)}</div>
					</div>
				) : layoutMode === 'grid' && variant === 'list' ? (
					<div className="grid w-full grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))] gap-x-2 gap-y-3 p-1">
						{friends.map(renderGridItem)}
					</div>
				) : layoutMode === 'grid' ? (
					<div
						className="grid w-full justify-items-center gap-x-2 gap-y-3 p-1"
						style={{ gridTemplateColumns: `repeat(${getGridColumns(friends.length)}, minmax(0, 1fr))` }}
					>
						{friends.map(renderGridItem)}
					</div>
				) : (
					<div
						className="relative shrink-0"
						style={{
							width: canvasSize.width,
							height: canvasSize.height,
							minWidth: canvasSize.width,
							minHeight: Math.max(variant === 'selector' ? 280 : 280, canvasSize.height),
						}}
					>
						{friends.map(renderAbsoluteItem)}
					</div>
				)}
			</div>
		</div>
	);
}
