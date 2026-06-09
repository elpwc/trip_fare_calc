'use client';

import { ReactNode } from 'react';

type ReceiptPanelProps = {
	label?: string;
	serial?: string;
	children: ReactNode;
	className?: string;
	footer?: ReactNode;
};

export default function ReceiptPanel({ label, serial, children, className = '', footer }: ReceiptPanelProps) {
	return (
		<section className={`settings-receipt ${className}`}>
			{(label || serial) && (
				<div className="flex items-center justify-between gap-3 border-b border-dashed border-[#1a1814]/20 px-4 py-3 dark:border-[#f4efe4]/15">
					{label ? <span className="settings-mono text-[10px] uppercase tracking-[0.32em] text-[#6b6458] dark:text-[#a89f8f]">{label}</span> : <span />}
					{serial ? <span className="settings-mono text-[10px] text-[#6b6458] dark:text-[#a89f8f]">{serial}</span> : null}
				</div>
			)}
			<div className="px-4 py-4">{children}</div>
			{footer ? <div className="settings-receipt-footer border-t border-dashed border-[#1a1814]/20 px-4 py-3 dark:border-[#f4efe4]/15">{footer}</div> : null}
			<div className="settings-receipt-teeth" aria-hidden />
		</section>
	);
}
