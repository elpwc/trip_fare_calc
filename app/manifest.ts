import type { MetadataRoute } from 'next';
import { APP_ENTRY, PWA_SCOPE, withBasePath } from '@/src/config/paths';
import { zhCN } from '@/src/utils/i18n/locales/zh-CN';

export default function manifest(): MetadataRoute.Manifest {
	return {
		id: APP_ENTRY,
		name: zhCN['app.name'],
		short_name: '算钱',
		description: zhCN['app.description'],
		start_url: APP_ENTRY,
		scope: PWA_SCOPE,
		display: 'standalone',
		display_override: ['standalone', 'browser'],
		orientation: 'portrait',
		background_color: '#f4efe4',
		theme_color: '#2a9d8f',
		categories: ['finance', 'utilities'],
		icons: [
			{
				src: withBasePath('/icons/icon192.png'),
				sizes: '192x192',
				type: 'image/png',
				purpose: 'any',
			},
			{
				src: withBasePath('/icons/icon512.png'),
				sizes: '512x512',
				type: 'image/png',
				purpose: 'any',
			},
			{
				src: withBasePath('/icons/icon512.png'),
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: withBasePath('/icons/icon.png'),
				sizes: '180x180',
				type: 'image/png',
			},
		],
	};
}
