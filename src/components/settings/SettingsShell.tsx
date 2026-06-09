'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { usePreferences } from '@/src/utils/preferences-provider';

type SettingsShellProps = {
	title: string;
	subtitle?: string;
	stamp?: string;
	backHref?: string;
	children: ReactNode;
};

export default function SettingsShell({ title, subtitle, stamp, backHref = '/user', children }: SettingsShellProps) {
	const { t } = usePreferences();

	return (
		<div className="settings-paper min-h-screen text-[#1a1814] dark:text-[#f4efe4]">
			<div className="settings-paper-grid pointer-events-none fixed inset-0 opacity-70 dark:opacity-30" aria-hidden />
			<div className="relative mx-auto max-w-245 px-4 pb-28 pt-5">
				<div className="mb-6 flex items-start justify-between gap-3">
					<div>
						<Link
							href={backHref}
							className="settings-mono mb-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-app-muted transition hover:text-app-danger"
						>
							<span aria-hidden>←</span>
							{t('common.back')}
						</Link>
						<h1 className="settings-display text-[2rem] leading-none tracking-tight">{title}</h1>
						{subtitle ? <p className="settings-mono mt-3 max-w-md text-[12px] leading-relaxed text-app-muted">{subtitle}</p> : null}
					</div>
					{stamp ? (
						<div className="settings-stamp shrink-0 rotate-6" aria-hidden>
							{stamp}
						</div>
					) : null}
				</div>
				{children}
			</div>
		</div>
	);
}
