'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { translate, type MessageKey } from '@/src/utils/i18n/messages';
import { buildDocumentTitle } from '@/src/utils/i18n/page-title';
import {
	DEFAULT_LOCALE,
	DEFAULT_THEME_MODE,
	LANGUAGE_STORAGE_KEY,
	LOCALE_OPTIONS,
	type Locale,
	type ThemeMode,
} from '@/src/utils/preferences/constants';
import { applyThemeMode, readStoredThemeMode, writeStoredThemeMode } from '@/src/utils/preferences/theme';

type PreferencesContextValue = {
	themeMode: ThemeMode;
	setThemeMode: (mode: ThemeMode) => void;
	locale: Locale;
	setLocale: (locale: Locale) => void;
	localeOptions: typeof LOCALE_OPTIONS;
	t: (key: MessageKey, params?: Record<string, string | number>) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readStoredLocale(): Locale {
	if (typeof window === 'undefined') return DEFAULT_LOCALE;
	const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
	if (stored === 'zh-CN' || stored === 'en' || stored === 'ja') return stored;
	return DEFAULT_LOCALE;
}

function writeStoredLocale(locale: Locale) {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
	const [themeMode, setThemeModeState] = useState<ThemeMode>(DEFAULT_THEME_MODE);
	const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const storedTheme = readStoredThemeMode();
		const storedLocale = readStoredLocale();
		setThemeModeState(storedTheme);
		setLocaleState(storedLocale);
		applyThemeMode(storedTheme);
		document.documentElement.lang = storedLocale;
		setReady(true);
	}, []);

	useEffect(() => {
		if (!ready || themeMode !== 'system') return;

		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = () => applyThemeMode('system');

		handleChange();
		media.addEventListener('change', handleChange);
		return () => media.removeEventListener('change', handleChange);
	}, [ready, themeMode]);

	const setThemeMode = useCallback((mode: ThemeMode) => {
		setThemeModeState(mode);
		writeStoredThemeMode(mode);
		applyThemeMode(mode);
	}, []);

	const setLocale = useCallback((nextLocale: Locale) => {
		setLocaleState(nextLocale);
		writeStoredLocale(nextLocale);
		document.documentElement.lang = nextLocale;
	}, []);

	const t = useCallback(
		(key: MessageKey, params?: Record<string, string | number>) => translate(locale, key, params),
		[locale],
	);

	const value = useMemo(
		() => ({
			themeMode,
			setThemeMode,
			locale,
			setLocale,
			localeOptions: LOCALE_OPTIONS,
			t,
		}),
		[themeMode, setThemeMode, locale, setLocale, t],
	);

	return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
	const context = useContext(PreferencesContext);
	if (!context) {
		throw new Error('usePreferences must be used within PreferencesProvider');
	}
	return context;
}

export function PageTitleSync() {
	const pathname = usePathname();
	const { locale } = usePreferences();

	useEffect(() => {
		document.title = buildDocumentTitle(pathname, locale);
	}, [pathname, locale]);

	return null;
}
