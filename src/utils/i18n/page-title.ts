import { APP_NAME } from '@/src/utils/preferences/constants';
import { translate, type MessageKey } from '@/src/utils/i18n/messages';
import type { Locale } from '@/src/utils/preferences/constants';

const routeTitleKeys: { pattern: RegExp; key: MessageKey }[] = [
	{ pattern: /^\/$/, key: 'page.home' },
	{ pattern: /^\/history\/?$/, key: 'page.history' },
	{ pattern: /^\/friends\/?$/, key: 'page.friends' },
	{ pattern: /^\/user\/?$/, key: 'page.settings' },
	{ pattern: /^\/user\/feedback\/?$/, key: 'page.feedback' },
	{ pattern: /^\/user\/about\/?$/, key: 'page.about' },
	{ pattern: /^\/settle\/?$/, key: 'page.settle' },
	{ pattern: /^\/share\/?$/, key: 'page.share' },
	{ pattern: /^\/bills\/new\/?$/, key: 'page.newBill' },
	{ pattern: /^\/bills\/[^/]+\/edit\/?$/, key: 'page.editBill' },
	{ pattern: /^\/test-friends\/?$/, key: 'page.testFriends' },
	{ pattern: /^\/test-homepage-icons\/?$/, key: 'page.testHomepageIcons' },
];

export function getPageTitleKey(pathname: string): MessageKey | null {
	const match = routeTitleKeys.find(({ pattern }) => pattern.test(pathname));
	return match?.key ?? null;
}

export function buildDocumentTitle(pathname: string, locale: Locale): string {
	const key = getPageTitleKey(pathname);
	if (!key) return APP_NAME;
	return `${APP_NAME} - ${translate(locale, key)}`;
}
