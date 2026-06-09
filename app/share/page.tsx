'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/src/components/layout/AppShell';
import { Modal } from '@/src/components/Modal';
import FriendIcon from '@/src/components/FriendIcon';
import { getAuthHeaders } from '@/src/utils/auth';
import { useAuth } from '@/src/utils/auth-provider';
import { Bill, Trip, TripMember } from '@/src/types';
import { CURRENCY_DEFINITIONS } from '@/src/utils/currencies';

type SharedTrip = Trip & {
	readOnly?: boolean;
	alreadyJoined?: boolean;
};

function SharePageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get('token');
	const { user } = useAuth();

	const [password, setPassword] = useState('');
	const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(true);
	const [passwordError, setPasswordError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [trip, setTrip] = useState<SharedTrip | null>(null);
	const [joinMessage, setJoinMessage] = useState('');

	useEffect(() => {
		if (!token) {
			setPasswordError('无效的分享链接');
			setIsPasswordModalOpen(false);
		}
	}, [token]);

	const loadSharedTrip = async (inputPassword: string) => {
		if (!token) return null;

		const response = await fetch(`/api/share?token=${encodeURIComponent(token)}&password=${encodeURIComponent(inputPassword)}`, {
			headers: getAuthHeaders(),
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.error || '密码错误或链接无效');
		}

		return data as SharedTrip;
	};

	const handleVerifyPassword = async () => {
		if (!password.trim()) {
			setPasswordError('请输入分享密码');
			return;
		}

		setIsLoading(true);
		setPasswordError('');

		try {
			const data = await loadSharedTrip(password.trim());
			if (!data) return;

			setTrip(data);
			setIsPasswordModalOpen(false);

			if (user && data.alreadyJoined) {
				router.replace(`/?tripId=${data.id}`);
			}
		} catch (error) {
			setPasswordError((error as Error).message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleJoinTrip = async () => {
		if (!token || !password.trim()) return;

		setIsLoading(true);
		setJoinMessage('');

		try {
			const response = await fetch('/api/share', {
				method: 'POST',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ token, password: password.trim() }),
			});

			const data = await response.json();
			if (!response.ok) {
				setJoinMessage(data.error || '加入失败');
				return;
			}

			router.push(`/?tripId=${data.tripId}`);
		} catch (error) {
			console.error('Failed to join trip:', error);
			setJoinMessage('加入失败，请稍后重试');
		} finally {
			setIsLoading(false);
		}
	};

	if (!token) {
		return (
			<AppShell tight>
				<div className="app-empty mt-8">
					<p>无效的分享链接</p>
					<Link href="/" className="mt-3 inline-block text-[#2a9d8f] underline">
						返回首页
					</Link>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell tight>
			{trip && !user ? (
				<div className="mb-2 border-2 border-[#e85d4c] bg-[#e85d4c]/10 px-2 py-1.5 text-center text-[11px] font-semibold text-[#e85d4c]">
					注册登录后可以参与编辑
					<Link href="/user" className="ml-2 underline">
						去登录
					</Link>
				</div>
			) : null}

			{trip ? (
				<>
					<header className="app-panel mb-2 p-2">
						<p className="app-label">分享的旅行</p>
						<h1 className="settings-display text-xl leading-tight">{trip.name}</h1>
						<p className="settings-mono mt-1 text-[9px] text-[#6b6458]">
							{new Date(trip.createdAt).toLocaleDateString('zh-CN')}
							{trip.ownerName ? ` · 创建者 ${trip.ownerName}` : ''}
						</p>
					</header>

					<section className="mb-2 flex flex-wrap gap-1">
						{(trip.members || []).map((member: TripMember) => (
							<div key={member.id} className="flex min-w-11 flex-col items-center gap-0.5">
								<FriendIcon name={member.name} size="sm" isSelf={member.isSelf} />
								<p className="max-w-11 truncate text-[9px]">{member.name}</p>
							</div>
						))}
					</section>

					<section className="app-panel overflow-hidden">
						<div className="app-panel-head">
							<span className="app-label">账单列表</span>
							<span className="settings-mono text-[9px] text-[#6b6458]">{trip.bills.length} 笔</span>
						</div>
						<table className="app-data-table">
							<thead>
								<tr>
									<th>付</th>
									<th>金额</th>
									<th>项目</th>
									<th>态</th>
								</tr>
							</thead>
							<tbody>
								{(trip.bills || []).map((bill: Bill) => (
									<tr key={bill.id}>
										<td>
											<FriendIcon
												name={(trip.members || []).find((m) => m.id === bill.payerId)?.name || '?'}
												size="sm"
												isSelf={(trip.members || []).find((m) => m.id === bill.payerId)?.isSelf}
											/>
										</td>
										<td className="app-amount">
											{bill.amount}
											{CURRENCY_DEFINITIONS[bill.currency || 'CNY']?.suffix || '¥'}
										</td>
										<td>
											<span className="app-tag">{bill.category}</span>
											<p className="mt-0.5 max-w-32 truncate text-[10px]">{bill.name}</p>
										</td>
										<td>
											<span className={`app-tag ${bill.status === 'SETTLED' ? 'app-tag-settled' : 'app-tag-open'}`}>{bill.status === 'SETTLED' ? '清' : '未'}</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						{trip.bills.length === 0 ? <p className="px-2 py-3 text-center text-[11px] text-[#6b6458]">暂无账单</p> : null}
					</section>

					{user && !trip.alreadyJoined ? (
						<div className="mt-3">
							<button type="button" onClick={handleJoinTrip} disabled={isLoading} className="settings-btn-primary w-full disabled:opacity-60">
								{isLoading ? '加入中...' : '加入旅行'}
							</button>
							{joinMessage ? <p className="mt-2 text-center text-[11px] text-[#e85d4c]">{joinMessage}</p> : null}
						</div>
					) : null}
				</>
			) : (
				<div className="app-empty mt-8">输入密码后即可查看分享的旅行</div>
			)}

			<Modal
				isOpen={isPasswordModalOpen}
				onClose={() => router.push('/')}
				title="输入分享密码"
				onOk={handleVerifyPassword}
				okText={isLoading ? '验证中...' : '查看旅行'}
				showOkButton
				showCancelButton
				cancelText="取消"
			>
				<div className="modal-stack">
					<p className="modal-hint">请输入分享者提供的密码以查看或加入此旅行。</p>
					<div className="modal-field">
						<label className="app-label">分享密码</label>
						<input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="分享密码" className="settings-input py-2 text-sm" />
					</div>
					{passwordError ? <p className="modal-message modal-message-error">{passwordError}</p> : null}
				</div>
			</Modal>
		</AppShell>
	);
}

export default function SharePage() {
	return (
		<Suspense fallback={<AppShell tight><div className="app-empty mt-8">加载中...</div></AppShell>}>
			<SharePageContent />
		</Suspense>
	);
}
