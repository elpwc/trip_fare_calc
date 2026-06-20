'use client';

import React from 'react';
import FriendLayoutBoard from '@/src/components/FriendLayout/FriendLayoutBoard';
import { Friend } from '@/src/types';

type FriendListProps = {
	friends: Friend[];
	onFriendClick: (friend: Friend) => void;
	scaleByParticipation?: boolean;
	showTripMeta?: boolean;
};

const FriendList: React.FC<FriendListProps> = ({
	friends,
	onFriendClick,
	scaleByParticipation = false,
	showTripMeta = true,
}) => {
	return (
		<FriendLayoutBoard
			friends={friends}
			onFriendClick={onFriendClick}
			scaleByParticipation={scaleByParticipation}
			showTripMeta={showTripMeta}
			variant="list"
			emptyMessageKey="friends.emptyList"
			className="h-full"
			ringRadius={150}
		/>
	);
};

export default FriendList;
