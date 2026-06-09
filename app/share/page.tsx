'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

	const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('zh-CN');

	if (!token) {
		return (
			<div className="min-h-screen bg-slate-50 px-4 py-12 text-center text-slate-700 dark:bg-slate-950 dark:text-slate-200">
				<p>无效的分享链接</p>
				<Link href="/" className="mt-4 inline-block text-sky-600">
					返回首页
				</Link>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
			{trip && !user ? (
				<div className="sticky top-0 z-20 border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
					注册登录后可以参与编辑
					<Link href="/user" className="ml-2 underline">
						去登录
					</Link>
				</div>
			) : null}

			{trip ? (
				<div className="mx-auto max-w-245 px-4 pb-28 pt-5">
					<header className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">分享的旅行</p>
						<h1 className="mt-2 text-2xl font-semibold">{trip.name}</h1>
						<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatDate(trip.createdAt)}</p>
						{trip.ownerName ? <p className="mt-2 text-sm text-violet-600 dark:text-violet-300">创建者：{trip.ownerName}</p> : null}
					</header>

					<section className="mt-4">
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">参与者</p>
						<div className="mt-2 flex flex-wrap gap-3">
							{(trip.members || []).map((member: TripMember) => (
								<div key={member.id} className="flex min-w-16 flex-col items-center gap-2 text-center">
									<FriendIcon name={member.name} size="md" isSelf={member.isSelf} />
									<p className="max-w-18 truncate text-xs text-slate-700 dark:text-slate-300">{member.name}</p>
								</div>
							))}
						</div>
					</section>

					<section className="mt-4">
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">账单列表</p>
						<div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900">
							<table className="min-w-full text-xs">
								<thead className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
									<tr>
										<th className="px-3 py-3">付钱人</th>
										<th className="px-3 py-3">金额</th>
										<th className="px-3 py-3">名称</th>
										<th className="px-3 py-3">状态</th>
									</tr>
								</thead>
								<tbody>
									{(trip.bills || []).map((bill: Bill, index: number) => (
										<tr key={bill.id} className={`border-b border-slate-200 dark:border-slate-800 ${index === trip.bills.length - 1 ? '' : ''}`}>
											<td className="px-3 py-2">
												<FriendIcon
													name={(trip.members || []).find((m) => m.id === bill.payerId)?.name || '?'}
													size="md"
													isSelf={(trip.members || []).find((m) => m.id === bill.payerId)?.isSelf}
												/>
											</td>
											<td className="px-3 py-2 font-semibold">
												{bill.amount}
												{CURRENCY_DEFINITIONS[bill.currency || 'CNY']?.suffix || '¥'}
											</td>
											<td className="px-3 py-2">
												<p className="font-medium">{bill.name}</p>
												<p className="text-[11px] text-slate-500">{bill.category}</p>
											</td>
											<td className="px-3 py-2">
												<span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
													{bill.status === 'SETTLED' ? '清' : '未'}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							{trip.bills.length === 0 ? <p className="px-4 py-6 text-center text-sm text-slate-500">暂无账单</p> : null}
						</div>
					</section>

					{user && !trip.alreadyJoined ? (
						<div className="fixed bottom-26 left-0 right-0 z-20 px-4">
							<button
								type="button"
								onClick={handleJoinTrip}
								disabled={isLoading}
								className="mx-auto flex w-full max-w-245 items-center justify-center rounded-full bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-2xl transition hover:bg-emerald-500 disabled:opacity-60"
							>
								{isLoading ? '加入中...' : '加入旅行'}
							</button>
							{joinMessage ? <p className="mt-2 text-center text-sm text-rose-500">{joinMessage}</p> : null}
						</div>
					) : null}
				</div>
			) : (
				<div className="mx-auto max-w-245 px-4 py-12 text-center text-slate-500">输入密码后即可查看分享的旅行</div>
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
				<div className="space-y-3">
					<p className="text-sm text-slate-600 dark:text-slate-400">请输入分享者提供的密码以查看或加入此旅行。</p>
					<input
						type="text"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="分享密码"
						className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
					/>
					{passwordError ? <p className="text-sm text-rose-500">{passwordError}</p> : null}
				</div>
			</Modal>
		</div>
	);
}

export default function SharePage() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-slate-50 px-4 py-12 text-center dark:bg-slate-950">加载中...</div>}>
			<SharePageContent />
		</Suspense>
	);
}
