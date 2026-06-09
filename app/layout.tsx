import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import BottomMenu from '@/src/components/BottomMenu';
import PwaInstallPrompt from '@/src/components/PwaInstallPrompt';
import { AuthProvider } from '@/src/utils/auth-provider';
import { PageTitleSync, PreferencesProvider } from '@/src/utils/preferences-provider';
import { PwaProvider } from '@/src/utils/pwa/pwa-provider';
import { OnboardingProvider } from '@/src/components/onboarding/OnboardingProvider';
import { BASE_PATH } from '@/src/config/base-path';
import { zhCN } from '@/src/utils/i18n/locales/zh-CN';
import 'leaflet/dist/leaflet.css';
import './globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: {
		default: zhCN['app.name'],
		template: `${zhCN['app.name']} - %s`,
	},
	description: zhCN['app.description'],
	applicationName: '算钱',
	manifest: `${BASE_PATH}/manifest.webmanifest`,
	icons: {
		icon: [
			{ url: `${BASE_PATH}/icons/icon192.png`, sizes: '192x192', type: 'image/png' },
			{ url: `${BASE_PATH}/icons/icon512.png`, sizes: '512x512', type: 'image/png' },
		],
		apple: [{ url: `${BASE_PATH}/icons/icon.png`, sizes: '180x180', type: 'image/png' }],
	},
	appleWebApp: {
		capable: true,
		title: '算钱',
		statusBarStyle: 'default',
	},
};

export const viewport: Viewport = {
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#2a9d8f' },
		{ media: '(prefers-color-scheme: dark)', color: '#121110' },
	],
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('tripFareCalc:theme')||'system';var l=localStorage.getItem('tripFareCalc:language')||'zh-CN';document.documentElement.lang=l;document.documentElement.dataset.theme=t;if(t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`;

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
			</head>
			<body className="min-h-full flex flex-col">
				<PreferencesProvider>
					<PwaProvider>
						<AuthProvider>
							<OnboardingProvider>
								<PageTitleSync />
								{children}
							</OnboardingProvider>
						</AuthProvider>
						<PwaInstallPrompt />
						<BottomMenu />
					</PwaProvider>
				</PreferencesProvider>
			</body>
		</html>
	);
}
