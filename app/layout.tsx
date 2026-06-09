import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import BottomMenu from '@/src/components/BottomMenu';
import { AuthProvider } from '@/src/utils/auth-provider';
import { PageTitleSync, PreferencesProvider } from '@/src/utils/preferences-provider';
import { APP_NAME } from '@/src/utils/preferences/constants';
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
		default: APP_NAME,
		template: `${APP_NAME} - %s`,
	},
	description: '旅行 AA 账单与结算工具',
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
					<AuthProvider>
						<PageTitleSync />
						{children}
					</AuthProvider>
					<BottomMenu />
				</PreferencesProvider>
			</body>
		</html>
	);
}
