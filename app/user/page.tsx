'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/utils/auth-provider';
import { Modal } from '@/src/components/Modal';
import { getAuthHeaders, resolveAuthErrorMessage } from '@/src/utils/auth';
import { apiPath } from '@/src/config/paths';
import ReceiptPanel from '@/src/components/settings/ReceiptPanel';
import TicketLink from '@/src/components/settings/TicketLink';
import Perforation from '@/src/components/settings/Perforation';
import receipt_up_img from '@/src/assets/img/receipt_up.png';
import receipt_down_img from '@/src/assets/img/receipt_down.png';
import PwaInstallButton from '@/src/components/PwaInstallButton';
import { usePreferences } from '@/src/utils/preferences-provider';
import type { ThemeMode } from '@/src/utils/preferences/constants';

function PreferencesSection() {
	const { themeMode, setThemeMode, locale, setLocale, localeOptions, t } = usePreferences();
	const themeModes: ThemeMode[] = ['light', 'dark', 'system'];
	const themeLabelKey = {
		light: 'theme.light',
		dark: 'theme.dark',
		system: 'theme.system',
	} as const;

	return (
		<div className="space-y-5">
			<div>
				<p className="settings-mono text-app-muted text-[10px] uppercase tracking-[0.28em]">{t('prefs.theme')}</p>
				<div className="mt-3 flex flex-wrap gap-2">
					{themeModes.map((mode) => (
						<button key={mode} type="button" onClick={() => setThemeMode(mode)} className={`settings-chip ${themeMode === mode ? 'settings-chip-active' : ''}`}>
							{t(themeLabelKey[mode])}
						</button>
					))}
				</div>
			</div>
			<div>
				<p className="settings-mono text-app-muted text-[10px] uppercase tracking-[0.28em]">{t('prefs.language')}</p>
				<div className="mt-3 flex flex-wrap gap-2">
					{localeOptions.map((option) => (
						<button key={option.value} type="button" onClick={() => setLocale(option.value)} className={`settings-chip ${locale === option.value ? 'settings-chip-active' : ''}`}>
							{option.label}
						</button>
					))}
				</div>
			</div>
			<div className="border-t border-dashed border-[#1a1814]/15 pt-5 dark:border-[#f4efe4]/10">
				<PwaInstallButton />
			</div>
		</div>
	);
}

export default function UserPage() {
	return (
		<Suspense fallback={<UserPageFallback />}>
			<UserPageContent />
		</Suspense>
	);
}

function UserPageFallback() {
	const { t } = usePreferences();
	return <div className="settings-paper min-h-screen px-4 py-10 text-center text-sm text-app-muted">{t('common.loading')}</div>;
}

function UserPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { t } = usePreferences();
	const { user, loading, login, register, logout, changePassword, updateName, updateEmail, registerEmail } = useAuth();
	const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
	const [email, setEmail] = useState('');
	const [name, setName] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [code, setCode] = useState('');
	const [message, setMessage] = useState('');
	const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
	const [joinLink, setJoinLink] = useState('');
	const [joinPassword, setJoinPassword] = useState('');
	const [joinMessage, setJoinMessage] = useState('');
	const [isJoining, setIsJoining] = useState(false);

	useEffect(() => {
		const auth = searchParams.get('auth');
		if (auth === 'login' || auth === 'register') {
			setAuthMode(auth);
			setMessage('');
		}
	}, [searchParams]);

	const handleLogin = async (event: FormEvent) => {
		event.preventDefault();
		setMessage('');
		try {
			await login(email, password);
			setAuthMode(null);
		} catch (err) {
			setMessage(resolveAuthErrorMessage(err, t));
		}
	};

	const handleRegister = async (event: FormEvent) => {
		event.preventDefault();
		setMessage('');

		if (password !== confirmPassword) {
			setMessage(t('user.passwordMismatch'));
			return;
		}

		if (!code) {
			setMessage(t('user.codeRequired'));
			return;
		}

		try {
			await register(email, name, password, code);
			setAuthMode(null);
		} catch (err) {
			setMessage(resolveAuthErrorMessage(err, t));
		}
	};

	const handleSendCode = async () => {
		setMessage('');
		try {
			await registerEmail(email);
			setMessage(t('user.codeSent'));
		} catch (err) {
			setMessage(resolveAuthErrorMessage(err, t));
		}
	};

	const extractShareToken = (input: string) => {
		const trimmed = input.trim();
		if (!trimmed) return '';
		try {
			const url = new URL(trimmed);
			return url.searchParams.get('token') || '';
		} catch {
			return trimmed;
		}
	};

	const handleJoinTrip = async () => {
		const token = extractShareToken(joinLink);
		if (!token) {
			setJoinMessage(t('user.joinInvalidLink'));
			return;
		}
		if (!joinPassword.trim()) {
			setJoinMessage(t('user.joinPasswordRequired'));
			return;
		}

		setIsJoining(true);
		setJoinMessage('');

		try {
			const response = await fetch(apiPath('/api/share'), {
				method: 'POST',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ token, password: joinPassword.trim() }),
			});

			const data = await response.json();
			if (!response.ok) {
				setJoinMessage(data.error || t('share.joinFailed'));
				return;
			}

			setIsJoinModalOpen(false);
			setJoinLink('');
			setJoinPassword('');
			setMessage(t('user.joinSuccess'));
			router.push(`/?tripId=${data.tripId}`);
		} catch {
			setJoinMessage(t('share.joinRetry'));
		} finally {
			setIsJoining(false);
		}
	};

	const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';

	return (
		<div className="settings-paper min-h-screen text-[#1a1814] dark:text-[#f4efe4]">
			<div className="settings-paper-grid pointer-events-none fixed inset-0 opacity-70 dark:opacity-30" aria-hidden />

			<div className="relative mx-auto max-w-245 px-4 pb-28 pt-5">
				<header className="mb-6">
					<p className="settings-mono text-app-muted text-[10px] uppercase tracking-[0.36em]">{t('user.settingsLabel')}</p>
					<h1 className="settings-display mt-2 text-[2.35rem] leading-none">{t('user.profileTitle')}</h1>
				</header>

				{loading ? (
					<ReceiptPanel label="LOADING" serial="···">
						<p className="settings-mono py-6 text-center text-sm">{t('user.loadingProfile')}</p>
					</ReceiptPanel>
				) : !user ? (
					<div className="space-y-0">
						<div className="overflow-hidden">
							<img src={receipt_up_img.src} alt="" className="block w-full" />
						</div>

						<div className="settings-receipt border-t-0 px-0 py-0 shadow-none">
							<div className="px-5 py-6">
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="settings-display text-2xl">{t('user.guestTitle')}</p>
										<p className="text-app-muted mt-2 text-[13px] leading-relaxed">{t('user.guestHint')}</p>
									</div>
									<div className="settings-stamp rotate-3 shrink-0">GUEST</div>
								</div>

								<div className="mt-6 flex gap-3">
									<button
										type="button"
										onClick={() => {
											setAuthMode('login');
											setMessage('');
										}}
										className={`settings-chip flex-1 ${authMode === 'login' ? 'settings-chip-active' : ''}`}
									>
										{t('user.login')}
									</button>
									<button
										type="button"
										onClick={() => {
											setAuthMode('register');
											setMessage('');
										}}
										className={`settings-chip flex-1 ${authMode === 'register' ? 'settings-chip-active' : ''}`}
									>
										{t('user.register')}
									</button>
								</div>

								{authMode ? (
									<form className="mt-6 space-y-4" onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
										<div>
											<label className="settings-mono text-app-muted mb-2 block text-[10px] uppercase tracking-[0.24em]">{t('user.email')}</label>
											<input value={email} type="email" onChange={(e) => setEmail(e.target.value)} required className="settings-input" />
										</div>

										{authMode === 'register' ? (
											<div>
												<label className="settings-mono text-app-muted mb-2 block text-[10px] uppercase tracking-[0.24em]">{t('user.verificationCode')}</label>
												<div className="flex gap-2">
													<input
														value={code}
														type="text"
														onChange={(e) => setCode(e.target.value)}
														placeholder={t('user.codePlaceholder')}
														className="settings-input flex-1"
													/>
													<button type="button" onClick={handleSendCode} className="settings-btn-ghost shrink-0 px-4">
														{t('user.sendCode')}
													</button>
												</div>
												<p className="settings-mono text-app-muted mt-2 text-[10px]">{t('user.codeValidHint')}</p>
											</div>
										) : null}

										{authMode === 'register' ? (
											<div>
												<label className="settings-mono text-app-muted mb-2 block text-[10px] uppercase tracking-[0.24em]">{t('user.username')}</label>
												<input value={name} onChange={(e) => setName(e.target.value)} required className="settings-input" />
											</div>
										) : null}

										<div>
											<label className="settings-mono text-app-muted mb-2 block text-[10px] uppercase tracking-[0.24em]">{t('user.password')}</label>
											<input value={password} type="password" onChange={(e) => setPassword(e.target.value)} required className="settings-input" />
										</div>

										{authMode === 'register' ? (
											<div>
												<label className="settings-mono text-app-muted mb-2 block text-[10px] uppercase tracking-[0.24em]">{t('user.confirmPassword')}</label>
												<input value={confirmPassword} type="password" onChange={(e) => setConfirmPassword(e.target.value)} required className="settings-input" />
											</div>
										) : null}

										{message ? <p className="text-app-danger text-sm">{message}</p> : null}

										<button type="submit" className="settings-btn-primary w-full">
											{authMode === 'login' ? t('user.submitLogin') : t('user.submitRegister')}
										</button>
									</form>
								) : null}
							</div>
							<div className="settings-receipt-teeth" aria-hidden />
						</div>

						<div className="overflow-hidden">
							<img src={receipt_down_img.src} alt="" className="block w-full" />
						</div>

						<div className="mt-6 grid gap-3 sm:grid-cols-2">
							<TicketLink href="/user/feedback" index="A1" title={t('user.feedbackLink')} desc={t('user.feedbackDesc')} />
							<TicketLink href="/user/about" index="A2" title={t('user.aboutLink')} desc={t('user.aboutDesc')} />
						</div>

						<Perforation />

						<ReceiptPanel label="PREFERENCES" serial="GUEST-01">
							<PreferencesSection />
						</ReceiptPanel>
					</div>
				) : (
					<>
						<ReceiptPanel label="PASSENGER" serial={user.email.slice(0, 18)}>
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-start gap-4">
									<div className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-[#1a1814] bg-[#2a9d8f] text-2xl font-bold text-[#fffdf8] dark:border-[#f4efe4] dark:bg-[#5fd3c4] dark:text-[#1a1814]">
										{userInitial}
									</div>
									<div className="min-w-0">
										<p className="settings-display truncate text-2xl">{user.name}</p>
										<p className="settings-mono text-app-muted mt-2 text-[11px]">{user.email}</p>
									</div>
								</div>
								<div className="settings-stamp shrink-0 -rotate-6">ON BOARD</div>
							</div>
							<div className="flex gap-3">
								<button
									type="button"
									className="settings-mono mt-3 text-[11px] uppercase tracking-[0.18em] text-[#2a9d8f] underline-offset-4 hover:underline dark:text-[#5fd3c4]"
									onClick={async () => {
										const newName = window.prompt(t('user.promptNewName'), user.name);
										if (newName && newName !== user.name) {
											try {
												await updateName(newName);
												setMessage(t('user.nameUpdated'));
											} catch (err) {
												setMessage(resolveAuthErrorMessage(err, t));
											}
										}
									}}
								>
									{t('user.editName')}
								</button>
								<button
									type="button"
									className="settings-mono mt-3 text-[11px] uppercase tracking-[0.18em] text-[#2a9d8f] underline-offset-4 hover:underline dark:text-[#5fd3c4]"
									onClick={async () => {
										const newEmail = window.prompt(t('user.promptNewEmail'), user.email);
										if (newEmail && newEmail !== user.email) {
											try {
												await updateEmail(newEmail);
												setMessage(t('user.emailUpdated'));
											} catch (err) {
												setMessage(resolveAuthErrorMessage(err, t));
											}
										}
									}}
								>
									{t('user.changeEmail')}
								</button>
								<button
									type="button"
									className="settings-mono mt-3 text-[11px] uppercase tracking-[0.18em] text-[#2a9d8f] underline-offset-4 hover:underline dark:text-[#5fd3c4]"
									onClick={async () => {
										const oldPassword = window.prompt(t('user.promptOldPassword'));
										const newPassword = window.prompt(t('user.promptNewPassword'));
										if (!oldPassword || !newPassword) return;
										try {
											await changePassword(oldPassword, newPassword);
											setMessage(t('user.passwordUpdated'));
										} catch (err) {
											setMessage(resolveAuthErrorMessage(err, t));
										}
									}}
								>
									{t('user.changePassword')}
								</button>
							</div>
						</ReceiptPanel>

						<Perforation />

						<ReceiptPanel label="TRIP ACCESS" serial="MENU-01">
							<div className="space-y-3">
								<TicketLink
									index="01"
									title={t('user.joinByLink')}
									desc={t('user.joinByLinkDesc')}
									tag="NEW"
									onClick={() => {
										setJoinMessage('');
										setIsJoinModalOpen(true);
									}}
								/>
							</div>
						</ReceiptPanel>

						<Perforation />

						<ReceiptPanel label="PREFERENCES" serial="MENU-02">
							<PreferencesSection />
						</ReceiptPanel>

						<Perforation />

						<ReceiptPanel label="MORE" serial="MENU-03">
							<div className="grid gap-3 sm:grid-cols-2">
								<TicketLink href="/user/feedback" index="04" title={t('user.feedbackLink')} desc="" />
								<TicketLink href="/user/about" index="05" title={t('user.aboutLink')} desc="" />
							</div>
						</ReceiptPanel>

						<Perforation />

						<button type="button" onClick={logout} className="settings-btn-primary mt-2 w-full border-[#1a1814] bg-[#1a1814] dark:border-[#f4efe4] dark:bg-[#f4efe4] dark:text-[#1a1814]">
							{t('user.logout')}
						</button>

						{message ? <p className="settings-mono mt-4 text-center text-[12px] text-[#2a9d8f] dark:text-[#5fd3c4]">{message}</p> : null}

						<Modal
							isOpen={isJoinModalOpen}
							onClose={() => setIsJoinModalOpen(false)}
							title={t('user.joinModalTitle')}
							onOk={handleJoinTrip}
							okText={isJoining ? t('user.joining') : t('user.joinTrip')}
							showOkButton
							showCancelButton
							cancelText={t('common.cancel')}
						>
							<div className="modal-stack">
								<div className="modal-field">
									<label className="app-label">{t('user.joinLink')}</label>
									<input
										type="text"
										value={joinLink}
										onChange={(event) => setJoinLink(event.target.value)}
										placeholder={t('user.joinLinkPlaceholder')}
										className="settings-input py-2 text-sm"
									/>
								</div>
								<div className="modal-field">
									<label className="app-label">{t('user.joinPassword')}</label>
									<input
										type="text"
										value={joinPassword}
										onChange={(event) => setJoinPassword(event.target.value)}
										placeholder={t('user.joinPasswordPlaceholder')}
										className="settings-input py-2 text-sm"
									/>
								</div>
								{joinMessage ? <p className="modal-message modal-message-error">{joinMessage}</p> : null}
							</div>
						</Modal>
					</>
				)}
			</div>
		</div>
	);
}
