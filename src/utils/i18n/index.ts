import { zhCN } from '@/src/utils/i18n/locales/zh-CN';
import { en } from '@/src/utils/i18n/locales/en';
import { ja } from '@/src/utils/i18n/locales/ja';
import type { Locale } from '@/src/utils/preferences/constants';
import type { MessageKey, Messages } from '@/src/utils/i18n/types';

export type { MessageKey } from '@/src/utils/i18n/types';

export const messages: Record<Locale, Messages> = {
	'zh-CN': zhCN,
	en,
	ja,
};

export function getMessages(locale: Locale): Messages {
	return messages[locale];
}

export function translate(
	locale: Locale,
	key: MessageKey,
	params?: Record<string, string | number>,
): string {
	const template = messages[locale][key] ?? messages['zh-CN'][key] ?? key;
	if (!params) return template;
	return Object.entries(params).reduce(
		(result, [paramKey, value]) => result.replaceAll(`{${paramKey}}`, String(value)),
		template,
	);
}
