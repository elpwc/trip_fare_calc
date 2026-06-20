'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { getVisualViewportFrame, subscribeVisualViewport, type VisualViewportFrame } from '@/src/utils/visual-viewport';

type GuideBubbleProps = {
	targetId: string;
	message: string;
	placement: 'top' | 'bottom';
	showOverlay?: boolean;
	showHighlight?: boolean;
	header?: ReactNode;
	footer?: ReactNode;
};

function isElementVisible(element: HTMLElement) {
	const rect = element.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) return false;
	const style = window.getComputedStyle(element);
	return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

function queryOnboardingTarget(targetId: string) {
	const nodes = Array.from(document.querySelectorAll<HTMLElement>(`[data-onboarding-target="${targetId}"]`));
	const visible = nodes.filter(isElementVisible);
	if (visible.length > 0) return visible[visible.length - 1];
	return nodes[0] ?? null;
}

export function useAnchorRect(targetId: string) {
	const [rect, setRect] = useState<DOMRect | null>(null);
	const [viewportFrame, setViewportFrame] = useState<VisualViewportFrame>({ top: 0, left: 0, width: 0, height: 0 });
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		let observer: ResizeObserver | null = null;
		let observedElement: Element | null = null;

		const update = () => {
			const el = queryOnboardingTarget(targetId);
			setRect(el?.getBoundingClientRect() ?? null);
			setViewportFrame(getVisualViewportFrame());

			if (observedElement !== el) {
				observer?.disconnect();
				observedElement = el;
				observer = el ? new ResizeObserver(update) : null;
				if (el && observer) observer.observe(el);
			}
		};

		update();
		const unsubscribeViewport = subscribeVisualViewport(update);

		return () => {
			unsubscribeViewport();
			observer?.disconnect();
		};
	}, [targetId]);

	return { rect, viewportFrame, mounted };
}

export default function GuideBubble({ targetId, message, placement, showOverlay = true, showHighlight = true, header, footer }: GuideBubbleProps) {
	const { rect, viewportFrame, mounted } = useAnchorRect(targetId);

	if (!mounted || !rect) return null;

	const bubbleWidth = Math.min(288, viewportFrame.width - 32);
	const centerX = Math.min(Math.max(rect.left + rect.width / 2, 16 + bubbleWidth / 2), viewportFrame.width - 16 - bubbleWidth / 2);
	const bubbleTop = placement === 'top' ? Math.max(12, rect.top - 12) : rect.bottom + 12;
	const bubbleStyle =
		placement === 'top'
			? { top: bubbleTop, left: centerX, transform: 'translate(-50%, -100%)' }
			: { top: bubbleTop, left: centerX, transform: 'translate(-50%, 0)' };

	return createPortal(
		<div
			className="pointer-events-none fixed z-1145140"
			style={{
				top: viewportFrame.top,
				left: viewportFrame.left,
				width: viewportFrame.width,
				height: viewportFrame.height,
			}}
		>
			{showOverlay ? <div className="absolute inset-0 bg-[#1a1814]/20 dark:bg-black/40" aria-hidden /> : null}
			{showHighlight ? (
				<div
					className="pointer-events-none absolute rounded-full ring-4 ring-[#2a9d8f]/80 ring-offset-2 ring-offset-[#fffdf8]/0 animate-pulse dark:ring-[#5fd3c4]/80"
					style={{
						top: rect.top - 6,
						left: rect.left - 6,
						width: rect.width + 12,
						height: rect.height + 12,
					}}
					aria-hidden
				/>
			) : null}
			<div
				className="pointer-events-auto absolute z-1145142 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border-2 border-[#1a1814]/15 bg-[#fffdf8]/90 px-4 py-3 shadow-[0_12px_40px_rgba(26,24,20,0.18)] backdrop-blur-md dark:border-[#f4efe4]/10 dark:bg-[#1c1a18]/90 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
				style={bubbleStyle}
				role="dialog"
				aria-live="polite"
			>
				{header}
				<p className={`${header ? 'mt-2' : ''} text-[13px] leading-relaxed`}>{message}</p>
				{footer ? <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">{footer}</div> : null}
			</div>
		</div>,
		document.body,
	);
}
