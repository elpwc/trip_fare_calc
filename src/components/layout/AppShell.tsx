'use client';

import { ReactNode } from 'react';

type AppShellProps = {
	children: ReactNode;
	className?: string;
	tight?: boolean;
};

export default function AppShell({ children, className = '', tight = false }: AppShellProps) {
	return (
		<div className="app-paper min-h-screen">
			<div className="app-paper-grid pointer-events-none fixed inset-0 opacity-70 dark:opacity-30" aria-hidden />
			<div className={`relative mx-auto max-w-245 ${tight ? 'px-2 pb-24 pt-2' : 'px-3 pb-28 pt-3'} ${className}`}>{children}</div>
		</div>
	);
}
