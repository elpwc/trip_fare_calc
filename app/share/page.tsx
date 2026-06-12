'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/src/components/layout/AppShell';
import { Modal } from '@/src/components/Modal';
import FriendIcon from '@/src/components/FriendIcon';
import { getAuthHeaders } from '@/src/utils/auth';
import { apiPath } from '@/src/config/paths';
import { useAuth } from '@/src/utils/auth-provider';
import { usePreferences } from '@/src/utils/preferences-provider';
import { Bill, Trip, TripMember } from '@/src/types';
import { formatTripDisplayDate } from '@/src/utils/date';
import { CURRENCY_DEFINITIONS } from '@/src/utils/currencies';

type SharedTrip = Trip & {
	readOnly?: boolean;
	alreadyJoined?: boolean;
};

function SharePageLoading() {
	const { t } = usePreferences();
	return (
		<AppShell tight>
			<div className="app-empty mt-8">{t('common.loading')}</div>
		</AppShell>
	);
}

function SharePageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get('token');
	const { user } = useAuth();
	const { t, locale } = usePreferences();

	const [password, setPassword] = useState('');
	const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(true);
	const [passwordError, setPasswordError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [trip, setTrip] = useState<SharedTrip | null>(null);
	const [joinMessage, setJoinMessage] = useState('');

	useEffect(() => {
		if (!token) {
			setPasswordError(t('share.invalidLink'));
			setIsPasswordModalOpen(false);
		}
	}, [token, t]);

	const loadSharedTrip = async (inputPassword: string) => {
		if (!token) return null;

		const response = await fetch(apiPath(`/api/share?token=${encodeURIComponent(token)}&password=${encodeURIComponent(inputPassword)}`), {
			headers: getAuthHeaders(),
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.error || t('share.passwordError'));
		}

		return data as SharedTrip;
	};

	const handleVerifyPassword = async () => {
		if (!password.trim()) {
			setPasswordError(t('share.enterPassword'));
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
			const response = await fetch(apiPath('/api/share'), {
				method: 'POST',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ token, password: password.trim() }),
			});

			const data = await response.json();
			if (!response.ok) {
				setJoinMessage(data.error || t('share.joinFailed'));
				return;
			}

			router.push(`/?tripId=${data.tripId}`);
		} catch (error) {
			console.error('Failed to join trip:', error);
			setJoinMessage(t('share.joinRetry'));
		} finally {
			setIsLoading(false);
		}
	};

	if (!token) {
		return (
			<AppShell tight>
				<div className="app-empty mt-8">
					<p>{t('share.invalidLink')}</p>
					<Link href="/" className="mt-3 inline-block text-[#2a9d8f] underline">
						{t('share.backHome')}
					</Link>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell tight>
			{trip && !user ? (
				<div className="text-app-danger mb-2 border-2 border-[#e85d4c] bg-[#e85d4c]/10 px-2 py-1.5 text-center text-[11px] font-semibold">
					{t('share.loginBanner')}
					<Link href="/user" className="ml-2 underline">
						{t('share.goLogin')}
					</Link>
				</div>
			) : null}

			{trip ? (
				<>
					<header className="app-panel mb-2 p-2">
						<p className="app-label">{t('share.sharedTrip')}</p>
						<h1 className="settings-display text-xl leading-tight">{trip.name}</h1>
						<p className="settings-mono text-app-muted mt-1 text-[9px]">
							{formatTripDisplayDate(trip, locale)}
							{trip.ownerName ? ` · ${t('share.createdBy', { name: trip.ownerName })}` : ''}
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
							<span className="app-label">{t('share.billList')}</span>
							<span className="settings-mono text-app-muted text-[9px]">{t('share.billsCount', { count: trip.bills.length })}</span>
						</div>
						<table className="app-data-table">
							<thead>
								<tr>
									<th>{t('table.payer')}</th>
									<th>{t('table.amount')}</th>
									<th>{t('table.item')}</th>
									<th>{t('table.status')}</th>
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
											<span className={`app-tag ${bill.status === 'SETTLED' ? 'app-tag-settled' : 'app-tag-open'}`}>
												{bill.status === 'SETTLED' ? t('table.settledShort') : t('table.unsettledShort')}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						{trip.bills.length === 0 ? <p className="text-app-muted px-2 py-3 text-center text-[11px]">{t('home.noBills')}</p> : null}
					</section>

					{user && !trip.alreadyJoined ? (
						<div className="mt-3">
							<button type="button" onClick={handleJoinTrip} disabled={isLoading} className="settings-btn-primary w-full disabled:opacity-60">
								{isLoading ? t('share.joining') : t('share.join')}
							</button>
							{joinMessage ? <p className="text-app-danger mt-2 text-center text-[11px]">{joinMessage}</p> : null}
						</div>
					) : null}
				</>
			) : (
				<div className="app-empty mt-8">{t('share.readonlyHint')}</div>
			)}

			<Modal
				isOpen={isPasswordModalOpen}
				onClose={() => router.push('/')}
				title={t('share.passwordModalTitle')}
				onOk={handleVerifyPassword}
				okText={isLoading ? t('share.verifying') : t('share.verify')}
				showOkButton
				showCancelButton
				cancelText={t('common.cancel')}
			>
				<div className="modal-stack">
					<p className="modal-hint">{t('share.passwordHint')}</p>
					<div className="modal-field">
						<label className="app-label">{t('share.passwordPlaceholder')}</label>
						<input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('share.passwordPlaceholder')} className="settings-input py-2 text-sm" />
					</div>
					{passwordError ? <p className="modal-message modal-message-error">{passwordError}</p> : null}
				</div>
			</Modal>
		</AppShell>
	);
}

export default function SharePage() {
	return (
		<Suspense fallback={<SharePageLoading />}>
			<SharePageContent />
		</Suspense>
	);
}
