'use client';

import React from 'react';

type Friend = {
  id: string;
  name: string;
  participationCount: number;
};

type FriendSelectorProps = {
  friends: Friend[];
  selectedFriends: string[];
  onToggleFriend: (friendId: string) => void;
};

const FriendSelector: React.FC<FriendSelectorProps> = ({
  friends,
  selectedFriends,
  onToggleFriend,
}) => {
  const getFriendPosition = (index: number, total: number) => {
    if (total === 0) return { x: 0, y: 0 };
    const angle = (index / total) * 2 * Math.PI;
    const radius = 120; // Smaller radius for modal
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  const getFriendSize = (participationCount: number, maxCount: number) => {
    const baseSize = 40;
    const maxSize = 60;
    if (maxCount === 0) return baseSize;
    return baseSize + (participationCount / maxCount) * (maxSize - baseSize);
  };

  const maxParticipation = Math.max(...friends.map(f => f.participationCount), 0);

  return (
    <div className="relative w-full h-80 flex items-center justify-center">
      <div className="relative">
        {friends.map((friend, index) => {
          const position = getFriendPosition(index, friends.length);
          const size = getFriendSize(friend.participationCount, maxParticipation);
          const isSelected = selectedFriends.includes(friend.id);
          return (
            <div
              key={friend.id}
              className={`absolute cursor-pointer flex flex-col items-center transition-all ${
                isSelected ? 'scale-110' : ''
              }`}
              style={{
                left: `calc(50% + ${position.x}px - ${size / 2}px)`,
                top: `calc(50% + ${position.y}px - ${size / 2}px)`,
              }}
              onClick={() => onToggleFriend(friend.id)}
            >
              <div
                className={`rounded-full flex items-center justify-center text-white font-bold border-2 ${
                  isSelected
                    ? 'bg-green-500 border-green-600'
                    : 'bg-blue-500 border-blue-600'
                }`}
                style={{ width: size, height: size }}
              >
                {friend.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs mt-1 text-center max-w-16 truncate">
                {friend.name}
              </span>
            </div>
          );
        })}
      </div>
      {friends.length === 0 && (
        <div className="text-center text-slate-500">
          <div className="text-2xl mb-2">👥</div>
          <div>暂无好友</div>
        </div>
      )}
    </div>
  );
};

export default FriendSelector;