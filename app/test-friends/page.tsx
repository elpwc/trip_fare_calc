'use client';

import React from 'react';
import AppShell from '@/src/components/layout/AppShell';
import { getBackgroundColor, getDisplayText } from '@/src/components/FriendIcon';
import { TripMember } from '@/src/types';
import { usePreferences } from '@/src/utils/preferences-provider';

const testMembers = [
	{ id: '1', name: '张三', participationCount: 5, description: '', isSelf: false },
	{ id: '2', name: '李四', participationCount: 3, description: '', isSelf: true },
	{ id: '3', name: '王五', participationCount: 8, description: '', isSelf: false },
	{ id: '4', name: '赵六', participationCount: 2, description: '', isSelf: false },
	{ id: '5', name: 'Alice', participationCount: 4, description: '', isSelf: false },
	{ id: '6', name: 'Bob', participationCount: 6, description: '', isSelf: false },
];

type FriendListProps = {
	friends: TripMember[];
	onFriendClick: (friend: TripMember) => void;
	selfLabel: string;
};

const FriendListTest: React.FC<FriendListProps> = ({ friends, onFriendClick, selfLabel }) => {
	const getFriendPosition = (index: number, total: number) => {
		if (total === 0) return { x: 0, y: 0 };
		const angle = (index / total) * 2 * Math.PI;
		const radius = 150;
		return {
			x: Math.cos(angle) * radius,
			y: Math.sin(angle) * radius,
		};
	};

	const getFriendSize = (participationCount: number, maxCount: number) => {
		const baseSize = 40;
		const maxSize = 80;
		if (maxCount === 0) return baseSize;
		return baseSize + (participationCount / maxCount) * (maxSize - baseSize);
	};

	const maxParticipation = Math.max(...friends.map((f) => f.participationCount), 0);

	return (
		<div className="relative flex h-96 w-full items-center justify-center rounded-lg border-2 border-[#1a1814]/10 bg-[#f4efe4]/50 dark:border-[#f4efe4]/10 dark:bg-[#1c1a18]/50">
			{friends.map((friend, index) => {
				const position = getFriendPosition(index, friends.length);
				const size = getFriendSize(friend.participationCount, maxParticipation);
				return (
					<div
						key={friend.id}
						className="absolute flex cursor-pointer flex-col items-center transition-transform hover:scale-105"
						style={{
							left: `calc(50% + ${position.x}px - ${size / 2}px)`,
							top: `calc(50% + ${position.y}px - ${size / 2}px)`,
						}}
						onClick={() => onFriendClick(friend)}
					>
						<div
							className={`relative ${getBackgroundColor(friend.name)} flex items-center justify-center rounded-full font-bold text-white shadow-md`}
							style={{ width: size, height: size }}
						>
							{getDisplayText(friend.name)}
							{friend.isSelf && (
								<div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-md">
									{selfLabel}
								</div>
							)}
						</div>
						<span className="mt-1 max-w-16 truncate text-center text-xs text-app-muted">{friend.name}</span>
					</div>
				);
			})}
		</div>
	);
};

export default function FriendListTestPage() {
	const { t } = usePreferences();

	const handleFriendClick = (friend: TripMember) => {
		alert(
			t('test.friends.clicked', {
				name: friend.name,
				self: friend.isSelf ? t('test.friends.selfSuffix') : '',
			}),
		);
	};

	return (
		<AppShell>
			<h1 className="mb-4 text-2xl font-bold">{t('page.testFriends')}</h1>
			<p className="mb-4 text-app-muted">{t('test.friends.desc')}</p>
			<FriendListTest friends={testMembers} onFriendClick={handleFriendClick} selfLabel={t('common.self')} />
		</AppShell>
	);
}
