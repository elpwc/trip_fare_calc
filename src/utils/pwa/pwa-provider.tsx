'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { BeforeInstallPromptEvent, PwaInstallResult } from '@/src/utils/pwa/types';

type PwaContextValue = {
	canInstall: boolean;
	isInstalled: boolean;
	isIos: boolean;
	install: () => Promise<PwaInstallResult>;
};

const PwaContext = createContext<PwaContextValue | null>(null);

function detectStandalone(): boolean {
	if (typeof window === 'undefined') return false;
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		window.matchMedia('(display-mode: fullscreen)').matches ||
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window.navigator as any).standalone === true
	);
}

function detectIos(): boolean {
	if (typeof window === 'undefined') return false;
	return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaProvider({ children }: { children: ReactNode }) {
	const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
	const [canInstall, setCanInstall] = useState(false);
	const [isInstalled, setIsInstalled] = useState(false);
	const [isIos] = useState(() => detectIos());

	useEffect(() => {
		setIsInstalled(detectStandalone());

		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').catch(() => undefined);
		}

		const onBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			deferredPromptRef.current = event as BeforeInstallPromptEvent;
			setCanInstall(true);
		};

		const onAppInstalled = () => {
			deferredPromptRef.current = null;
			setCanInstall(false);
			setIsInstalled(true);
		};

		window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
		window.addEventListener('appinstalled', onAppInstalled);

		return () => {
			window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
			window.removeEventListener('appinstalled', onAppInstalled);
		};
	}, []);

	const install = useCallback(async (): Promise<PwaInstallResult> => {
		const deferred = deferredPromptRef.current;
		if (!deferred) return 'unavailable';

		await deferred.prompt();
		const choice = await deferred.userChoice;
		if (choice.outcome === 'accepted') {
			deferredPromptRef.current = null;
			setCanInstall(false);
			setIsInstalled(true);
			return 'accepted';
		}

		return 'dismissed';
	}, []);

	const value = useMemo(
		() => ({
			canInstall,
			isInstalled,
			isIos,
			install,
		}),
		[canInstall, isInstalled, isIos, install],
	);

	return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
	const context = useContext(PwaContext);
	if (!context) {
		throw new Error('usePwa must be used within PwaProvider');
	}
	return context;
}
