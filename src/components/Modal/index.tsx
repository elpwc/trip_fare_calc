'use client';

import React, { ReactNode } from 'react';
import clsx from 'clsx';
import './index.css';
import { usePreferences } from '@/src/utils/preferences-provider';

type Props = {
	isOpen: boolean;
	onClose: () => void;
	onOk?: () => void;
	onCancel?: () => void;
	onCancel2?: () => void;
	showOkButton?: boolean;
	showCancelButton?: boolean;
	showCancel2Button?: boolean;
	okText?: string;
	cancelText?: string;
	cancel2Text?: string;
	title?: string | ReactNode;
	children: ReactNode;
	mobileMode?: 'fullscreen' | 'scroll' | 'center';
	showCloseButton?: boolean;
	className?: string;
	style?: React.CSSProperties;
	bodyClassName?: string;
	bodyStyle?: React.CSSProperties;
};

export const Modal: React.FC<Props> = ({
	isOpen,
	onClose,
	onOk,
	onCancel,
	onCancel2,
	showOkButton = false,
	showCancelButton = false,
	showCancel2Button = false,
	okText,
	cancelText,
	cancel2Text,
	title,
	children,
	mobileMode = 'fullscreen',
	showCloseButton = true,
	className,
	style,
	bodyClassName,
	bodyStyle,
}) => {
	const { t } = usePreferences();

	if (!isOpen) return null;

	const hasFooter = showCancelButton || showCancel2Button || showOkButton;
	const resolvedCancelText = cancelText ?? t('common.cancel');
	const resolvedCancel2Text = cancel2Text ?? t('common.cancel');
	const resolvedOkText = okText ?? t('common.ok');

	return (
		<div
			className="fixed inset-0 z-[114514] flex items-center justify-center bg-[#1a1814]/55 p-3 dark:bg-black/70 max-sm:p-0"
			onClick={(e) => {
				e.preventDefault();
				onClose();
			}}
		>
			<div
				className={clsx(
					'relative flex max-h-[92vh] w-[92%] max-w-[420px] flex-col overflow-hidden border-2 border-[#1a1814] bg-[#fffdf8] text-[#1a1814] shadow-[8px_8px_0_rgba(26,24,20,0.14)] animate-[modalFadeIn_0.22s_ease] dark:border-[#f4efe4] dark:bg-[#1c1a18] dark:text-[#f4efe4] dark:shadow-[8px_8px_0_rgba(244,239,228,0.08)]',
					mobileMode === 'fullscreen' && 'max-sm:h-full max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:shadow-none max-sm:animate-[modalSlideUp_0.28s_ease]',
					mobileMode === 'scroll' && 'max-sm:mt-auto max-sm:max-h-[90%] max-sm:w-full max-sm:rounded-t-none max-sm:animate-[modalSlideUp_0.28s_ease]',
					className,
				)}
				style={style}
				onClick={(e) => e.stopPropagation()}
			>
				{showCloseButton ? (
					<button
						type="button"
						className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center border-2 border-[#1a1814] bg-[#f4efe4] text-xl leading-none text-[#1a1814] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[2px_2px_0_rgba(26,24,20,0.12)] dark:border-[#f4efe4] dark:bg-[#121110] dark:text-[#f4efe4]"
						aria-label={t('modal.closeAria')}
						onClick={(e) => {
							e.preventDefault();
							onClose();
						}}
					>
						×
					</button>
				) : null}

				{title ? (
					<div className="px-4 pb-2 pt-4 pr-10">
						<div className="text-center font-serif text-lg font-bold leading-tight">{title}</div>
						<div className="my-2.5 h-px bg-[repeating-linear-gradient(90deg,#1a1814_0_6px,transparent_6px_12px)] opacity-20 dark:bg-[repeating-linear-gradient(90deg,#f4efe4_0_6px,transparent_6px_12px)]" aria-hidden />
					</div>
				) : null}

				<div className={clsx('flex-1 overflow-y-auto px-4 pb-3 pt-1', bodyClassName)} style={bodyStyle}>
					{children}
				</div>

				{hasFooter ? (
					<>
						<div className="my-2.5 h-px bg-[repeating-linear-gradient(90deg,#1a1814_0_6px,transparent_6px_12px)] opacity-20 dark:bg-[repeating-linear-gradient(90deg,#f4efe4_0_6px,transparent_6px_12px)]" aria-hidden />
						<div className="flex gap-2 px-4 pb-4">
							{showCancelButton ? (
								<button type="button" className="settings-btn-ghost min-w-0 flex-1 !px-3 !py-2.5 !text-[0.8125rem]" onClick={onCancel || onClose}>
									{resolvedCancelText}
								</button>
							) : null}
							{showCancel2Button ? (
								<button type="button" className="settings-btn-ghost min-w-0 flex-1 !px-3 !py-2.5 !text-[0.8125rem]" onClick={onCancel2}>
									{resolvedCancel2Text}
								</button>
							) : null}
							{showOkButton ? (
								<button type="button" className="settings-btn-primary min-w-0 flex-1 !px-3 !py-2.5 !text-[0.8125rem]" onClick={onOk}>
									{resolvedOkText}
								</button>
							) : null}
						</div>
					</>
				) : null}

				<div className="settings-receipt-teeth" aria-hidden />
			</div>
		</div>
	);
};
