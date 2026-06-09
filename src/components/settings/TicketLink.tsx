'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

type TicketLinkProps = {
	href?: string;
	onClick?: () => void;
	index: string;
	title: string;
	desc?: string;
	tag?: string;
	children?: ReactNode;
};

export default function TicketLink({ href, onClick, index, title, desc, tag, children }: TicketLinkProps) {
	const body = (
		<>
			<div className="settings-ticket-hole" aria-hidden />
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="settings-mono text-[10px] text-[#2a9d8f] dark:text-[#5fd3c4]">{index}</span>
					{tag ? (
						<span className="rounded-sm bg-[#1a1814] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#f4efe4] dark:bg-[#f4efe4] dark:text-[#1a1814]">
							{tag}
						</span>
					) : null}
				</div>
				<p className="mt-1 text-base font-semibold tracking-tight">{title}</p>
				{desc ? <p className="mt-1 text-[12px] leading-relaxed text-[#6b6458] dark:text-[#a89f8f]">{desc}</p> : null}
				{children}
			</div>
			<span className="settings-mono shrink-0 text-lg text-[#e85d4c] dark:text-[#ff7a68]" aria-hidden>
				→
			</span>
		</>
	);

	const className =
		'settings-ticket group flex w-full items-start gap-3 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1a1814] dark:hover:shadow-[4px_4px_0_#f4efe4]/20';

	if (href) {
		return (
			<Link href={href} className={className}>
				{body}
			</Link>
		);
	}

	return (
		<button type="button" onClick={onClick} className={className}>
			{body}
		</button>
	);
}
