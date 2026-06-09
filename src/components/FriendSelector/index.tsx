'use client';

import React from 'react';
import { Member } from '@/src/types';
import FriendIcon from '@/src/components/FriendIcon';
import { usePreferences } from '@/src/utils/preferences-provider';

type Friend = Member;

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
  const { t } = usePreferences();

  const getFriendPosition = (index: number, total: number) => {
    if (total === 0) return { x: 0, y: 0 };
    const angle = (index / total) * 2 * Math.PI;
    const radius = 120;
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
    <div className="relative flex h-80 w-full items-center justify-center">
      <div className="relative">
        {friends.map((friend, index) => {
          const position = getFriendPosition(index, friends.length);
          const size = getFriendSize(friend.participationCount, maxParticipation);
          const isSelected = selectedFriends.includes(friend.id);
          return (
            <button
              key={friend.id}
              type="button"
              className={`absolute flex cursor-pointer flex-col items-center transition-all ${isSelected ? 'scale-110' : 'opacity-80 hover:opacity-100'}`}
              style={{
                left: `calc(50% + ${position.x}px - ${size / 2}px)`,
                top: `calc(50% + ${position.y}px - ${size / 2}px)`,
              }}
              onClick={() => onToggleFriend(friend.id)}
            >
              <div className={isSelected ? 'rounded-full ring-2 ring-[#2a9d8f] ring-offset-2 ring-offset-[#fffdf8]' : ''}>
                <FriendIcon name={friend.name} size="lg" isSelf={friend.isSelf} />
              </div>
              <span className="mt-1 max-w-16 truncate text-[10px] font-semibold">{friend.name}</span>
            </button>
          );
        })}
      </div>
      {friends.length === 0 ? (
        <div className="modal-hint text-center">
          <div className="mb-1 text-xl">👥</div>
          <div>{t('selector.noFriends')}</div>
        </div>
      ) : null}
    </div>
  );
};

export default FriendSelector;
