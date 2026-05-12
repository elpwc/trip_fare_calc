'use client';

import React from 'react';

type Friend = {
  id: string;
  name: string;
  participationCount: number;
  description: string;
  trips: any[];
};

type FriendListProps = {
  friends: Friend[];
  onFriendClick: (friend: Friend) => void;
};

const FriendList: React.FC<FriendListProps> = ({
  friends,
  onFriendClick,
}) => {
  const getFriendPosition = (index: number, total: number) => {
    if (total === 0) return { x: 0, y: 0 };
    const angle = (index / total) * 2 * Math.PI;
    const radius = 150; // Adjust radius as needed
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

  const maxParticipation = Math.max(...friends.map(f => f.participationCount), 0);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {friends.map((friend, index) => {
        const position = getFriendPosition(index, friends.length);
        const size = getFriendSize(friend.participationCount, maxParticipation);
        return (
          <div
            key={friend.id}
            className="absolute cursor-pointer flex flex-col items-center transition-transform hover:scale-105"
            style={{
              left: `calc(50% + ${position.x}px - ${size / 2}px)`,
              top: `calc(50% + ${position.y}px - ${size / 2}px)`,
            }}
            onClick={() => onFriendClick(friend)}
          >
            <div
              className="bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-md"
              style={{ width: size, height: size }}
            >
              {friend.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs mt-1 text-center max-w-16 truncate">{friend.name}</span>
          </div>
        );
      })}
      {friends.length === 0 && (
        <div className="text-center text-slate-500">
          <div className="text-4xl mb-4">👥</div>
          <div className="text-lg font-medium">还没有好友</div>
          <div className="mt-2 text-sm">点击右下角的加号按钮添加第一位好友</div>
        </div>
      )}
    </div>
  );
};

export default FriendList;