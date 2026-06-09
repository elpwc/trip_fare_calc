'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/utils/auth-provider';
import { Modal } from '@/src/components/Modal';
import { getAuthHeaders } from '@/src/utils/auth';
import ReceiptPanel from '@/src/components/settings/ReceiptPanel';
import TicketLink from '@/src/components/settings/TicketLink';
import Perforation from '@/src/components/settings/Perforation';
import receipt_up_img from '@/src/assets/img/receipt_up.png';
import receipt_down_img from '@/src/assets/img/receipt_down.png';

const languageOptions = ['简体中文', 'English', '日本語', '한국어'];

export default function UserPage() {
	const router = useRouter();
	const { user, loading, error, login, register, logout, changePassword, updateName, updateEmail, registerEmail } = useAuth();
	const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
	const [email, setEmail] = useState('');
	const [name, setName] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [code, setCode] = useState('');
	const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
	const [selectedLanguage, setSelectedLanguage] = useState('简体中文');
	const [message, setMessage] = useState('');
	const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
	const [joinLink, setJoinLink] = useState('');
	const [joinPassword, setJoinPassword] = useState('');
	const [joinMessage, setJoinMessage] = useState('');
	const [isJoining, setIsJoining] = useState(false);

	const handleLogin = async (event: FormEvent) => {
		event.preventDefault();
		setMessage('');
		try {
			await login(email, password);
			setAuthMode(null);
		} catch (err) {
			setMessage((err as Error).message);
		}
	};

	const handleRegister = async (event: FormEvent) => {
		event.preventDefault();
		setMessage('');

		if (password !== confirmPassword) {
			setMessage('两次输入的密码不一致');
			return;
		}

		if (!code) {
			setMessage('请填写邮箱验证码');
			return;
		}

		try {
			await register(email, name, password, code);
			setAuthMode(null);
		} catch (err) {
			setMessage((err as Error).message);
		}
	};

	const handleSendCode = async () => {
		setMessage('');
		try {
			await registerEmail(email);
			setMessage('验证码已发送，请查收邮箱。');
		} catch (err) {
			setMessage((err as Error).message);
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
			setJoinMessage('请输入有效的分享链接或 token');
			return;
		}
		if (!joinPassword.trim()) {
			setJoinMessage('请输入分享密码');
			return;
		}

		setIsJoining(true);
		setJoinMessage('');

		try {
			const response = await fetch('/api/share', {
				method: 'POST',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ token, password: joinPassword.trim() }),
			});

			const data = await response.json();
			if (!response.ok) {
				setJoinMessage(data.error || '加入失败');
				return;
			}

			setIsJoinModalOpen(false);
			setJoinLink('');
			setJoinPassword('');
			setMessage('已成功加入旅行');
			router.push(`/?tripId=${data.tripId}`);
		} catch {
			setJoinMessage('加入失败，请稍后重试');
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
					<p className="settings-mono text-[10px] uppercase tracking-[0.36em] text-[#6b6458] dark:text-[#a89f8f]">Settings / 设置</p>
					<h1 className="settings-display mt-2 text-[2.35rem] leading-none">个人档案</h1>
				</header>

				{loading ? (
					<ReceiptPanel label="LOADING" serial="···">
						<p className="settings-mono py-6 text-center text-sm">正在读取旅客信息…</p>
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
										<p className="settings-display text-2xl">旅行结算</p>
										<p className="mt-2 text-[13px] leading-relaxed text-[#6b6458] dark:text-[#a89f8f]">请先登录或注册，才能保存与分享账单</p>
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
										登录
									</button>
									<button
										type="button"
										onClick={() => {
											setAuthMode('register');
											setMessage('');
										}}
										className={`settings-chip flex-1 ${authMode === 'register' ? 'settings-chip-active' : ''}`}
									>
										注册
									</button>
								</div>

								{authMode ? (
									<form className="mt-6 space-y-4" onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
										<div>
											<label className="settings-mono mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#6b6458] dark:text-[#a89f8f]">邮箱</label>
											<input value={email} type="email" onChange={(e) => setEmail(e.target.value)} required className="settings-input" />
										</div>

										{authMode === 'register' ? (
											<div>
												<label className="settings-mono mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#6b6458] dark:text-[#a89f8f]">验证码</label>
												<div className="flex gap-2">
													<input value={code} type="text" onChange={(e) => setCode(e.target.value)} placeholder="请输入验证码" className="settings-input flex-1" />
													<button type="button" onClick={handleSendCode} className="settings-btn-ghost shrink-0 px-4">
														发送
													</button>
												</div>
												<p className="settings-mono mt-2 text-[10px] text-[#6b6458] dark:text-[#a89f8f]">24 小时内有效</p>
											</div>
										) : null}

										{authMode === 'register' ? (
											<div>
												<label className="settings-mono mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#6b6458] dark:text-[#a89f8f]">用户名</label>
												<input value={name} onChange={(e) => setName(e.target.value)} required className="settings-input" />
											</div>
										) : null}

										<div>
											<label className="settings-mono mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#6b6458] dark:text-[#a89f8f]">密码</label>
											<input value={password} type="password" onChange={(e) => setPassword(e.target.value)} required className="settings-input" />
										</div>

										{authMode === 'register' ? (
											<div>
												<label className="settings-mono mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#6b6458] dark:text-[#a89f8f]">确认密码</label>
												<input value={confirmPassword} type="password" onChange={(e) => setConfirmPassword(e.target.value)} required className="settings-input" />
											</div>
										) : null}

										{message ? <p className="text-sm text-[#e85d4c] dark:text-[#ff7a68]">{message}</p> : null}
										{error ? <p className="text-sm text-[#e85d4c] dark:text-[#ff7a68]">{error}</p> : null}

										<button type="submit" className="settings-btn-primary w-full">
											{authMode === 'login' ? '登录' : '确认注册'}
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
							<TicketLink href="/user/feedback" index="A1" title="疑问与反馈" desc="常见问题与意见入口" />
							<TicketLink href="/user/about" index="A2" title="关于" desc="了解旅行结算的故事" />
						</div>
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
										<p className="settings-mono mt-2 text-[11px] text-[#6b6458] dark:text-[#a89f8f]">{user.email}</p>
										<button
											type="button"
											className="settings-mono mt-3 text-[11px] uppercase tracking-[0.18em] text-[#2a9d8f] underline-offset-4 hover:underline dark:text-[#5fd3c4]"
											onClick={async () => {
												const newName = window.prompt('请输入新的用户名', user.name);
												if (newName && newName !== user.name) {
													try {
														await updateName(newName);
														setMessage('姓名已更新');
													} catch (err) {
														setMessage((err as Error).message);
													}
												}
											}}
										>
											修改姓名
										</button>
									</div>
								</div>
								<div className="settings-stamp shrink-0 -rotate-6">ON BOARD</div>
							</div>
							<div className="settings-barcode mt-5 rounded-sm" aria-hidden />
						</ReceiptPanel>

						<Perforation />

						<ReceiptPanel label="TRIP ACCESS" serial="MENU-01">
							<div className="space-y-3">
								<TicketLink
									index="01"
									title="从链接和密码加入"
									desc="输入旅伴分享的链接，加入共同编辑的旅行"
									tag="NEW"
									onClick={() => {
										setJoinMessage('');
										setIsJoinModalOpen(true);
									}}
								/>
							</div>
						</ReceiptPanel>

						<Perforation />

						<ReceiptPanel label="ACCOUNT" serial="MENU-02">
							<div className="space-y-3">
								<TicketLink
									index="02"
									title="修改邮箱"
									desc={`当前：${user.email}`}
									onClick={async () => {
										const newEmail = window.prompt('请输入新的邮箱地址', user.email);
										if (newEmail && newEmail !== user.email) {
											try {
												await updateEmail(newEmail);
												setMessage('邮箱已更新');
											} catch (err) {
												setMessage((err as Error).message);
											}
										}
									}}
								/>
								<TicketLink
									index="03"
									title="修改密码"
									desc="定期更换密码，保护旅途账单"
									onClick={async () => {
										const oldPassword = window.prompt('请输入当前密码');
										const newPassword = window.prompt('请输入新密码');
										if (!oldPassword || !newPassword) return;
										try {
											await changePassword(oldPassword, newPassword);
											setMessage('密码已修改，请妥善保存');
										} catch (err) {
											setMessage((err as Error).message);
										}
									}}
								/>
							</div>
						</ReceiptPanel>

						<Perforation />

						<ReceiptPanel label="PREFERENCES" serial="MENU-03">
							<div className="space-y-5">
								<div>
									<p className="settings-mono text-[10px] uppercase tracking-[0.28em] text-[#6b6458] dark:text-[#a89f8f]">主题</p>
									<div className="mt-3 flex flex-wrap gap-2">
										{(['light', 'dark', 'system'] as const).map((mode) => (
											<button
												key={mode}
												type="button"
												onClick={() => setThemeMode(mode)}
												className={`settings-chip ${themeMode === mode ? 'settings-chip-active' : ''}`}
											>
												{mode === 'light' ? '明亮' : mode === 'dark' ? '夜间' : '跟随系统'}
											</button>
										))}
									</div>
								</div>
								<div>
									<p className="settings-mono text-[10px] uppercase tracking-[0.28em] text-[#6b6458] dark:text-[#a89f8f]">语言</p>
									<div className="mt-3 flex flex-wrap gap-2">
										{languageOptions.map((language) => (
											<button
												key={language}
												type="button"
												onClick={() => setSelectedLanguage(language)}
												className={`settings-chip ${selectedLanguage === language ? 'settings-chip-active' : ''}`}
											>
												{language}
											</button>
										))}
									</div>
								</div>
							</div>
						</ReceiptPanel>

						<Perforation />

						<ReceiptPanel label="MORE" serial="MENU-04">
							<div className="grid gap-3 sm:grid-cols-2">
								<TicketLink href="/user/feedback" index="04" title="疑问与反馈" desc="" />
								<TicketLink href="/user/about" index="05" title="关于" desc="" />
							</div>
						</ReceiptPanel>

						<Perforation />

						<button
							type="button"
							onClick={logout}
							className="settings-btn-primary mt-2 w-full border-[#1a1814] bg-[#1a1814] dark:border-[#f4efe4] dark:bg-[#f4efe4] dark:text-[#1a1814]"
						>
							退出登录
						</button>

						{message ? <p className="settings-mono mt-4 text-center text-[12px] text-[#2a9d8f] dark:text-[#5fd3c4]">{message}</p> : null}

						<Modal
							isOpen={isJoinModalOpen}
							onClose={() => setIsJoinModalOpen(false)}
							title="从链接和密码加入"
							onOk={handleJoinTrip}
							okText={isJoining ? '加入中...' : '加入旅行'}
							showOkButton
							showCancelButton
							cancelText="取消"
						>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium mb-2">分享链接</label>
									<input
										type="text"
										value={joinLink}
										onChange={(event) => setJoinLink(event.target.value)}
										placeholder="粘贴完整链接，或仅粘贴 token"
										className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2">分享密码</label>
									<input
										type="text"
										value={joinPassword}
										onChange={(event) => setJoinPassword(event.target.value)}
										placeholder="请输入分享密码"
										className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
									/>
								</div>
								{joinMessage ? <p className="text-sm text-rose-500">{joinMessage}</p> : null}
							</div>
						</Modal>
					</>
				)}
			</div>
		</div>
	);
}
