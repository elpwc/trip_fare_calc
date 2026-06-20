'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useAnchorRect } from '@/src/components/onboarding/GuideBubble';

type AnchorFloatingChipProps = {
	targetId: string;
	placement: 'top' | 'bottom';
	onClick?: () => void;
	children: ReactNode;
	className?: string;
};

export default function AnchorFloatingChip({ targetId, placement, onClick, children, className = 'app-coedit-strip' }: AnchorFloatingChipProps) {
	const { rect, viewportFrame, mounted } = useAnchorRect(targetId);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (rect) setVisible(true);
	}, [rect]);

	if (!mounted || !rect || !visible) return null;

	const centerX = rect.left + rect.width / 2;
	const style =
		placement === 'bottom'
			? { top: rect.bottom + 2, left: centerX, transform: 'translate(-50%, 0)' }
			: { top: rect.top - 8, left: centerX, transform: 'translate(-50%, -100%)' };

	return createPortal(
		<div
			className="pointer-events-none fixed z-114515"
			style={{
				top: viewportFrame.top,
				left: viewportFrame.left,
				width: viewportFrame.width,
				height: viewportFrame.height,
			}}
		>
			<button type="button" onClick={onClick} className={`pointer-events-auto absolute whitespace-nowrap ${className}`} style={style}>
				{children}
			</button>
		</div>,
		document.body,
	);
}
