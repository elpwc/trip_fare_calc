'use client';

import React from 'react';
import FriendIcon, { getBackgroundColor, getDisplayText } from '@/src/components/FriendIcon';
import { TripMember } from '@/src/types';

// 测试用的成员数据（包含isSelf字段）
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
};

const FriendListTest: React.FC<FriendListProps> = ({
  friends,
  onFriendClick,
}) => {
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

  const maxParticipation = Math.max(...friends.map(f => f.participationCount), 0);

  return (
    <div className="relative w-full h-96 flex items-center justify-center bg-gray-100">
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
              className={`relative ${getBackgroundColor(friend.name)} rounded-full flex items-center justify-center text-white font-bold shadow-md`}
              style={{ width: size, height: size }}
            >
              {getDisplayText(friend.name)}
              {friend.isSelf && (
                <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
                  我
                </div>
              )}
            </div>
            <span className="text-xs mt-1 text-center max-w-16 truncate">{friend.name}</span>
          </div>
        );
      })}
    </div>
  );
};

export default function FriendListTestPage() {
  const handleFriendClick = (friend: TripMember) => {
    alert(`点击了朋友: ${friend.name}${friend.isSelf ? ' (本人)' : ''}`);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">朋友列表测试</h1>
      <p className="mb-4 text-gray-600">
        测试功能：根据名称自动生成不同背景色，最多显示两个文字，本人显示橙色"我"标识
      </p>
      <FriendListTest friends={testMembers} onFriendClick={handleFriendClick} />
    </div>
  );
}