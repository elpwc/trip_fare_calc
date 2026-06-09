'use client';

import React, { ReactNode } from 'react';
import './index.css';
import clsx from 'clsx';

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
	okText = 'OK',
	cancelText = 'キャンセル',
	cancel2Text = '取り消し',
	title,
	children,
	mobileMode = 'fullscreen',
	showCloseButton = true,
	className,
	style,
	bodyClassName,
	bodyStyle,
}) => {
	if (!isOpen) return null;

	const hasFooter = showCancelButton || showCancel2Button || showOkButton;

	return (
		<div
			className="modal-overlay"
			onClick={(e) => {
				e.preventDefault();
				onClose();
			}}
		>
			<div className={clsx('modal-content', `mobile-${mobileMode}`, className)} style={style} onClick={(e) => e.stopPropagation()}>
				{showCloseButton ? (
					<button
						type="button"
						className="modal-close-btn"
						aria-label="关闭"
						onClick={(e) => {
							e.preventDefault();
							onClose();
						}}
					>
						×
					</button>
				) : null}

				{title ? (
					<div className="modal-head">
						<div className="modal-title">{title}</div>
						<div className="modal-perforation" aria-hidden />
					</div>
				) : null}

				<div className={clsx('modal-body', bodyClassName)} style={bodyStyle}>
					{children}
				</div>

				{hasFooter ? (
					<>
						<div className="modal-perforation" aria-hidden />
						<div className="modal-footer">
							{showCancelButton ? (
								<button type="button" className="settings-btn-ghost modal-footer-btn" onClick={onCancel || onClose}>
									{cancelText}
								</button>
							) : null}
							{showCancel2Button ? (
								<button type="button" className="settings-btn-ghost modal-footer-btn" onClick={onCancel2}>
									{cancel2Text}
								</button>
							) : null}
							{showOkButton ? (
								<button type="button" className="settings-btn-primary modal-footer-btn" onClick={onOk}>
									{okText}
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
