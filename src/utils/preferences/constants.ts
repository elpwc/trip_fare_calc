export type ThemeMode = 'light' | 'dark' | 'system';

export type Locale = 'zh-CN' | 'en' | 'ja';

export const THEME_STORAGE_KEY = 'tripFareCalc:theme';
export const LANGUAGE_STORAGE_KEY = 'tripFareCalc:language';

export const DEFAULT_THEME_MODE: ThemeMode = 'system';
export const DEFAULT_LOCALE: Locale = 'zh-CN';

export const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
	{ value: 'zh-CN', label: '简体中文' },
	{ value: 'en', label: 'English' },
	{ value: 'ja', label: '日本語' },
];

export const APP_NAME = '算钱';
