import type { MetadataRoute } from 'next';
import { BASE_PATH } from '@/src/config/base-path';
import { zhCN } from '@/src/utils/i18n/locales/zh-CN';

export default function manifest(): MetadataRoute.Manifest {
	return {
		id: `${BASE_PATH}/`,
		name: zhCN['app.name'],
		short_name: '算钱',
		description: zhCN['app.description'],
		start_url: `${BASE_PATH}/`,
		scope: `${BASE_PATH}/`,
		display: 'standalone',
		display_override: ['standalone', 'browser'],
		orientation: 'portrait',
		background_color: '#f4efe4',
		theme_color: '#2a9d8f',
		categories: ['finance', 'utilities'],
		icons: [
			{
				src: `${BASE_PATH}/icons/icon192.png`,
				sizes: '192x192',
				type: 'image/png',
				purpose: 'any',
			},
			{
				src: `${BASE_PATH}/icons/icon512.png`,
				sizes: '512x512',
				type: 'image/png',
				purpose: 'any',
			},
			{
				src: `${BASE_PATH}/icons/icon512.png`,
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: `${BASE_PATH}/icons/icon.png`,
				sizes: '180x180',
				type: 'image/png',
			},
		],
	};
}
