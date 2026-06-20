'use client';

import React from 'react';
import FriendLayoutBoard from '@/src/components/FriendLayout/FriendLayoutBoard';
import { Member } from '@/src/types';

type Friend = Member;

type FriendSelectorProps = {
	friends: Friend[];
	selectedFriends: string[];
	onToggleFriend: (friendId: string) => void;
	scaleByParticipation?: boolean;
	showTripMeta?: boolean;
};

const FriendSelector: React.FC<FriendSelectorProps> = ({
	friends,
	selectedFriends,
	onToggleFriend,
	scaleByParticipation = false,
	showTripMeta = true,
}) => {
	return (
		<FriendLayoutBoard
			friends={friends}
			selectedFriends={selectedFriends}
			onToggleFriend={onToggleFriend}
			scaleByParticipation={scaleByParticipation}
			showTripMeta={showTripMeta}
			variant="selector"
			emptyMessageKey="selector.noFriends"
			className="h-80"
			ringRadius={120}
		/>
	);
};

export default FriendSelector;
