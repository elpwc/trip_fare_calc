import type { MetadataRoute } from 'next';
import { zhCN } from '@/src/utils/i18n/locales/zh-CN';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: zhCN['app.name'],
		short_name: zhCN['app.name'],
		description: zhCN['app.description'],
		start_url: '/',
		scope: '/',
		display: 'standalone',
		orientation: 'portrait',
		background_color: '#f4efe4',
		theme_color: '#2a9d8f',
		icons: [
			{
				src: '/icon',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'any',
			},
			{
				src: '/icon',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: '/apple-icon',
				sizes: '180x180',
				type: 'image/png',
			},
		],
	};
}
