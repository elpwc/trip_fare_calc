import type { MessageKey } from '@/src/utils/i18n/types';

export type PwaInstallGuidePlatform = 'ios-safari' | 'android-chrome' | 'desktop-chrome' | 'desktop-edge' | 'desktop-safari' | 'generic';

export function detectPwaInstallGuidePlatform(userAgent: string): PwaInstallGuidePlatform {
	const ua = userAgent.toLowerCase();
	if (/iphone|ipad|ipod/.test(ua)) return 'ios-safari';
	if (/android/.test(ua)) return 'android-chrome';
	if (/edg\//.test(ua)) return 'desktop-edge';
	if (/chrome\//.test(ua) && !/edg\//.test(ua)) return 'desktop-chrome';
	if (/safari\//.test(ua) && !/chrome\//.test(ua) && !/crios\//.test(ua)) return 'desktop-safari';
	return 'generic';
}

export function getPwaInstallGuideSteps(platform: PwaInstallGuidePlatform): MessageKey[] {
	switch (platform) {
		case 'ios-safari':
			return ['pwa.guide.ios.step1', 'pwa.guide.ios.step2', 'pwa.guide.ios.step3'];
		case 'android-chrome':
			return ['pwa.guide.android.step1', 'pwa.guide.android.step2', 'pwa.guide.android.step3'];
		case 'desktop-chrome':
			return ['pwa.guide.desktopChrome.step1', 'pwa.guide.desktopChrome.step2'];
		case 'desktop-edge':
			return ['pwa.guide.desktopEdge.step1', 'pwa.guide.desktopEdge.step2'];
		case 'desktop-safari':
			return ['pwa.guide.desktopSafari.step1', 'pwa.guide.desktopSafari.step2', 'pwa.guide.desktopSafari.step3'];
		default:
			return ['pwa.guide.generic.step1', 'pwa.guide.generic.step2'];
	}
}
