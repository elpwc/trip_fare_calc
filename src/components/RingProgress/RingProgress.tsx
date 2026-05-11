import React from 'react';
import clsx from 'clsx';
import './ring-progress.css';

export interface RingProgressProps {
	/** 1-100 */
	progress: number;
	ringWidth?: number;
	innerR?: number;
	backcolor?: string;
	forecolor?: string;
	className?: string;
	style?: React.CSSProperties;
	children?: React.ReactNode;
	showInnerText?: boolean;
}

export const RingProgress: React.FC<RingProgressProps> = ({ progress, ringWidth = 10, innerR, backcolor = '#e5e7eb', forecolor = '#4f46e5', className, style, children, showInnerText = false }) => {
	const p = Math.min(100, Math.max(0, progress));
	const deg = p * 3.6;

	const innerInset = innerR !== undefined ? `${(1 - innerR) * 50}%` : `${ringWidth}px`;

	return (
		<div
			className={clsx('ring-progress', className)}
			style={
				{
					'--rp-deg': `${deg}deg`,
					'--rp-back': backcolor,
					'--rp-fore': forecolor,
					'--rp-inset': innerInset,
					...style,
				} as React.CSSProperties
			}
		>
			<div className="ring-progress__inner">{children ?? showInnerText ? <span className="ring-progress__text">{p}%</span> : <></>}</div>
		</div>
	);
};
