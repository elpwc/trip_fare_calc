import { DEFAULT_THEME_MODE, THEME_STORAGE_KEY, type ThemeMode } from './constants';

export function readStoredThemeMode(): ThemeMode {
	if (typeof window === 'undefined') return DEFAULT_THEME_MODE;
	const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
	if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
	return DEFAULT_THEME_MODE;
}

export function writeStoredThemeMode(mode: ThemeMode) {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(THEME_STORAGE_KEY, mode);
}

export function resolveDarkMode(mode: ThemeMode): boolean {
	if (mode === 'dark') return true;
	if (mode === 'light') return false;
	return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyThemeMode(mode: ThemeMode) {
	if (typeof document === 'undefined') return;
	document.documentElement.dataset.theme = mode;
	document.documentElement.classList.toggle('dark', resolveDarkMode(mode));
}
