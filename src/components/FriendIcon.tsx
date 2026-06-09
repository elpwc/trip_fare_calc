'use client';

import React from 'react';
import { usePreferences } from '@/src/utils/preferences-provider';

type FriendIconProps = {
	name: string;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	isSelf?: boolean;
	className?: string;
};

/**
 * 根据名称生成不同的背景色
 */
export function getBackgroundColor(name: string): string {
	const colors = [
		'bg-blue-500',
		'bg-green-500',
		'bg-purple-500',
		'bg-pink-500',
		'bg-indigo-500',
		'bg-red-500',
		'bg-yellow-500',
		'bg-teal-500',
		'bg-orange-500',
		'bg-cyan-500',
		'bg-lime-500',
		'bg-emerald-500',
		'bg-violet-500',
		'bg-fuchsia-500',
		'bg-rose-500',
		'bg-sky-500',
	];

	// 使用名称的字符码和来决定颜色
	const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
	return colors[hash % colors.length];
}

/**
 * 获取显示文字（最多两个字符）
 */
export function getDisplayText(name: string): string {
	if (name.length <= 2) return name;
	// 如果是中文，取前两个字符
	if (/[\u4e00-\u9fa5]/.test(name)) {
		return name.substring(0, 2);
	}
	// 如果是英文，取前两个字符
	return name.substring(0, 2);
}

/**
 * 获取尺寸相关的样式
 */
function getSizeClasses(size: 'sm' | 'md' | 'lg' | 'xl'): { container: string; badge: string; badgeText: string } {
	const sizeMap = {
		sm: {
			container: 'w-6 h-6 text-xs',
			badge: 'w-3 h-3 -bottom-0.5 -right-0.5',
			badgeText: 'text-[8px]',
		},
		md: {
			container: 'w-8 h-8 text-xs',
			badge: 'w-4 h-4 -bottom-0.5 -right-0.5',
			badgeText: 'text-[8px]',
		},
		lg: {
			container: 'w-12 h-12 text-sm',
			badge: 'w-6 h-6 -bottom-1 -right-1',
			badgeText: 'text-xs',
		},
		xl: {
			container: 'w-16 h-16 text-base',
			badge: 'w-7 h-7 -bottom-1 -right-1',
			badgeText: 'text-xs',
		},
	};
	return sizeMap[size];
}

/**
 * 朋友/成员头像Icon组件
 * 支持不同的大小和"本人"标识
 */
export const FriendIcon: React.FC<FriendIconProps> = ({ name, size = 'md', isSelf = false, className = '' }) => {
	const { t } = usePreferences();
	const sizeClasses = getSizeClasses(size);
	const bgColor = getBackgroundColor(name);
	const displayText = getDisplayText(name);

	return (
		<div
			className={`relative ${sizeClasses.container} ${bgColor} rounded-full flex items-center justify-center text-white font-bold shadow-md ${className}`}
		>
			{displayText}
			{isSelf && (
				<div
					className={`absolute ${sizeClasses.badge} bg-orange-500 text-white rounded-full flex items-center justify-center font-bold shadow-md`}
				>
					<span className={`${sizeClasses.badgeText}`}>{t('common.self')}</span>
				</div>
			)}
		</div>
	);
};

export default FriendIcon;
