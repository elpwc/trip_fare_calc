'use client';

import SettingsShell from '@/src/components/settings/SettingsShell';
import ReceiptPanel from '@/src/components/settings/ReceiptPanel';
import Perforation from '@/src/components/settings/Perforation';
import { usePreferences } from '@/src/utils/preferences-provider';
import type { MessageKey } from '@/src/utils/i18n/messages';

const GITHUB_REPO = 'https://github.com/elpwc/trip_fare_calc';
const DEVELOPER_EMAIL = 'elpwc@hotmail.com';

function GitHubIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden>
			<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
		</svg>
	);
}

function MailIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden>
			<path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 7.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.817L1 5.383v5.722Z" />
		</svg>
	);
}

export default function AboutPage() {
	const { t } = usePreferences();

	return (
		<SettingsShell title={t('page.about')} subtitle="" stamp="ABOUT" backHref="/user">
			<ReceiptPanel label="TRIP FARE CALC" serial="v0.1.0">
				<div className="space-y-3">
					<p className="settings-display text-[1.75rem] leading-none tracking-tight">{t('app.name')}</p>
					<p className="text-app-muted whitespace-pre-line text-[14px] leading-relaxed">{t('about.intro')}</p>
				</div>
			</ReceiptPanel>

			<Perforation />

			<ReceiptPanel label={t('about.linksSection')} serial="LINK">
				<div className="space-y-2.5">
					<a
						href={GITHUB_REPO}
						target="_blank"
						rel="noopener noreferrer"
						className="about-link-card group"
					>
						<span className="about-link-icon about-link-icon-github">
							<GitHubIcon />
						</span>
						<span className="min-w-0 flex-1">
							<span className="app-label block">{t('about.github')}</span>
							<span className="settings-mono mt-0.5 block truncate text-[13px] font-semibold group-hover:text-[#2a9d8f] dark:group-hover:text-[#5fd3c4]">
								elpwc/trip_fare_calc
							</span>
						</span>
						<span className="settings-mono shrink-0 text-sm text-app-muted opacity-60 group-hover:opacity-100" aria-hidden>
							↗
						</span>
					</a>

					<a href={`mailto:${DEVELOPER_EMAIL}`} className="about-link-card group">
						<span className="about-link-icon about-link-icon-mail">
							<MailIcon />
						</span>
						<span className="min-w-0 flex-1">
							<span className="app-label block">{t('about.developerEmail')}</span>
							<span className="settings-mono mt-0.5 block truncate text-[13px] font-semibold group-hover:text-[#2a9d8f] dark:group-hover:text-[#5fd3c4]">
								{DEVELOPER_EMAIL}
							</span>
						</span>
						<span className="settings-mono shrink-0 text-sm text-app-muted opacity-60 group-hover:opacity-100" aria-hidden>
							→
						</span>
					</a>
				</div>
			</ReceiptPanel>
		</SettingsShell>
	);
}
