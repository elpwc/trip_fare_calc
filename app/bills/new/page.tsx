'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Modal } from '@/src/components/Modal';
import AppShell from '@/src/components/layout/AppShell';
import FriendIcon from '@/src/components/FriendIcon';
import { getAuthHeaders } from '@/src/utils/auth';
import { apiPath } from '@/src/config/paths';
import { Currency, CURRENCY_DEFINITIONS } from '@/src/utils/currencies';
import { FlagSVG } from '@/src/components/FlagSVG';
import { Member } from '@/src/types';
import { usePreferences } from '@/src/utils/preferences-provider';
import type { MessageKey } from '@/src/utils/i18n/messages';

type Friend = Member;

type BillOwed = {
	friendId: string;
};

const LAST_BILL_CURRENCY_KEY = 'tripFareCalc:lastBillCurrency';

const CATEGORIES: { key: string; tone: string; i18nKey: MessageKey }[] = [
	{ key: '吃饭', tone: 'meal', i18nKey: 'bills.category.meal' },
	{ key: '住宿', tone: 'hotel', i18nKey: 'bills.category.hotel' },
	{ key: '门票', tone: 'ticket', i18nKey: 'bills.category.ticket' },
	{ key: 'KTV', tone: 'ktv', i18nKey: 'bills.category.ktv' },
	{ key: '购物', tone: 'shop', i18nKey: 'bills.category.shop' },
	{ key: '租车', tone: 'car', i18nKey: 'bills.category.car' },
	{ key: '高速费', tone: 'toll', i18nKey: 'bills.category.toll' },
	{ key: '加油费', tone: 'gas', i18nKey: 'bills.category.gas' },
	{ key: '停车费', tone: 'park', i18nKey: 'bills.category.park' },
	{ key: '打车', tone: 'taxi', i18nKey: 'bills.category.taxi' },
	{ key: '公交', tone: 'bus', i18nKey: 'bills.category.bus' },
	{ key: '火车', tone: 'train', i18nKey: 'bills.category.train' },
	{ key: '机票', tone: 'flight', i18nKey: 'bills.category.flight' },
	{ key: '交通', tone: 'traffic', i18nKey: 'bills.category.traffic' },
	{ key: '其他', tone: 'none', i18nKey: 'bills.category.other' },
];

const STATUSES: { value: string; i18nKey: MessageKey }[] = [
	{ value: 'UNPAID', i18nKey: 'bills.status.unpaid' },
	{ value: 'UNRETURNED', i18nKey: 'bills.status.unreturned' },
	{ value: 'SETTLED', i18nKey: 'bills.status.settled' },
];

const PAYMENT_METHODS: { value: string; i18nKey: MessageKey }[] = [
	{ value: '任意', i18nKey: 'bills.payment.any' },
	{ value: '现金', i18nKey: 'bills.payment.cash' },
	{ value: '支付宝', i18nKey: 'bills.payment.alipay' },
	{ value: '微信', i18nKey: 'bills.payment.wechat' },
	{ value: '银行转账', i18nKey: 'bills.payment.bank' },
	{ value: 'PayPay', i18nKey: 'bills.payment.paypay' },
	{ value: '信用卡', i18nKey: 'bills.payment.card' },
	{ value: 'PayPal', i18nKey: 'bills.payment.paypal' },
	{ value: 'ApplePay', i18nKey: 'bills.payment.applepay' },
	{ value: '其他', i18nKey: 'bills.payment.other' },
];

function getPaymentI18nKey(value: string): MessageKey {
	return PAYMENT_METHODS.find((method) => method.value === value)?.i18nKey ?? 'bills.payment.other';
}

function BillPageLoading() {
	const { t } = usePreferences();
	return (
		<AppShell tight>
			<div className="app-empty mt-8">{t('common.loading')}</div>
		</AppShell>
	);
}

export default function NewBillPage({ billId }: { billId?: string } = {}) {
	return (
		<Suspense fallback={<BillPageLoading />}>
			<NewBillPageContent billId={billId} />
		</Suspense>
	);
}

function NewBillPageContent({ billId }: { billId?: string } = {}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { t } = usePreferences();
	const tripId = searchParams.get('tripId');
	const [effectiveTripId, setEffectiveTripId] = useState<string | null>(tripId);

	const [amount, setAmount] = useState('');
	const [currency, setCurrency] = useState(() => {
		if (typeof window === 'undefined') return 'CNY';
		const saved = window.localStorage.getItem(LAST_BILL_CURRENCY_KEY);
		return saved && CURRENCY_DEFINITIONS[saved] ? saved : 'CNY';
	});
	const [paymentMethod, setPaymentMethod] = useState('任意');
	const [category, setCategory] = useState('吃饭');
	const [billName, setBillName] = useState('');
	const [payerId, setPayerId] = useState<string>('');
	const [owedFriendIds, setOwedFriendIds] = useState<string[]>([]);
	const [description, setDescription] = useState('');
	const [status, setStatus] = useState('UNRETURNED');
	const [latitude, setLatitude] = useState<number | null>(null);
	const [longitude, setLongitude] = useState<number | null>(null);
	const [locationError, setLocationError] = useState<string | null>(null);

	const [tripMembers, setTripMembers] = useState<Friend[]>([]);
	const [isLoaded, setIsLoaded] = useState(!billId);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
	const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

	const acquireLocation = () => {
		if (!navigator.geolocation) {
			setLocationError(t('bills.locationUnsupported'));
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setLatitude(position.coords.latitude);
				setLongitude(position.coords.longitude);
				setLocationError(null);
			},
			(error) => {
				setLocationError(t('bills.locationFailed', { message: error.message }));
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
		);
	};

	useEffect(() => {
		if (!tripId) return;
		setEffectiveTripId(tripId);
		fetchTripsAndFriends();
		acquireLocation();
	}, [tripId]);

	useEffect(() => {
		if (!billId) return;
		fetchBill();
	}, [billId]);

	const fetchBill = async () => {
		try {
			const response = await fetch(apiPath(`/api/bills/${billId}`), {
				headers: getAuthHeaders(),
			});

			if (!response.ok) {
				const errorData = await response.json();
				setErrorMessage(errorData?.error || t('bills.fetchFailed'));
				return;
			}

			const data = await response.json();
			setAmount(String(data.amount ?? ''));
			setCurrency(data.currency || 'CNY');
			setPaymentMethod(data.paymentMethod || '现金');
			setCategory(data.category || '吃饭');
			setBillName(data.name || '');
			setPayerId(data.payerId || '');
			setOwedFriendIds((data.owedFriends || []).map((owed: BillOwed) => owed.friendId));
			setDescription(data.description || '');
			setStatus(data.status || 'UNRETURNED');
			setLatitude(data.latitude ?? null);
			setLongitude(data.longitude ?? null);
			setTripMembers(data.tripMembers || data.trip?.members || []);
			setEffectiveTripId(data.tripId || tripId);
			setIsLoaded(true);
		} catch (error) {
			console.error('Failed to fetch bill:', error);
			setErrorMessage(t('bills.fetchFailed'));
		}
	};

	const fetchTripsAndFriends = async () => {
		try {
			const response = await fetch(apiPath('/api/trips'), {
				headers: getAuthHeaders(),
			});
			if (response.ok) {
				const trips = await response.json();
				const currentTrip = trips.find((t: { id: string }) => t.id === tripId);
				if (currentTrip) {
					setTripMembers(currentTrip.members || []);
				}
			}
		} catch (error) {
			console.error('Failed to fetch trips:', error);
		}
	};

	const handleSelectAllFriends = () => {
		setOwedFriendIds(tripMembers.map((f) => f.id));
	};

	const handleToggleFriend = (friendId: string) => {
		setOwedFriendIds((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]));
	};

	const handleCreateBill = async () => {
		const selectedTripId = effectiveTripId || tripId;
		if (!selectedTripId || !amount || !payerId) {
			alert(t('bills.requiredFields'));
			return;
		}

		try {
			const finalDescription = description.trim() || category;
			const requestBody = {
				tripId: selectedTripId,
				payerId,
				amount: Number(amount),
				currency,
				paymentMethod,
				name: billName.trim(),
				description: finalDescription,
				category,
				status,
				owedFriendIds,
				latitude,
				longitude,
			};

			const url = billId ? apiPath(`/api/bills/${billId}`) : apiPath('/api/bills');
			const method = billId ? 'PATCH' : 'POST';
			const response = await fetch(url, {
				method,
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (response.ok) {
				router.push(`/?tripId=${selectedTripId}`);
			} else {
				const errorData = await response.json();
				const failMsg = billId ? t('bills.updateFailed') : t('bills.createFailed');
				alert(`${failMsg}: ${errorData.error || t('bills.unknownError')}`);
			}
		} catch (error) {
			console.error('Failed to submit bill:', error);
			alert(billId ? t('bills.updateFailed') : t('bills.createFailed'));
		}
	};

	if (!isLoaded) {
		return (
			<AppShell tight>
				<div className="app-empty mt-8">{t('common.loading')}</div>
			</AppShell>
		);
	}

	if (errorMessage) {
		return (
			<AppShell tight>
				<div className="app-empty mt-8 text-app-danger">{errorMessage}</div>
			</AppShell>
		);
	}

	return (
		<AppShell tight>
			<header className="mb-2 flex items-center justify-between gap-2">
				<button type="button" onClick={() => router.back()} className="app-label hover:text-app-danger">
					← {t('common.back')}
				</button>
				<h1 className="settings-display text-xl">{billId ? t('bills.editTitle') : t('bills.newTitle')}</h1>
				<span className="settings-stamp scale-75">BILL</span>
			</header>

			<div className="space-y-2">
				<div className="app-panel flex overflow-hidden">
					<input
						type="number"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						placeholder={t('bills.amount')}
						className="settings-input min-w-0 flex-1 border-0 py-3 text-3xl font-bold shadow-none focus:shadow-none"
					/>
					<button type="button" onClick={() => setIsPaymentMethodModalOpen(true)} className="app-toolbar-chip shrink-0 self-stretch border-y-0 border-r-0 px-2">
						{paymentMethod === '任意' ? t('bills.paymentMethod') : t(getPaymentI18nKey(paymentMethod))}
					</button>
					<button type="button" onClick={() => setIsCurrencyModalOpen(true)} className="app-currency-btn" aria-label={t('bills.selectCurrency')}>
						<span className="app-currency-btn-symbol">{CURRENCY_DEFINITIONS[currency]?.symbol || '¥'}</span>
						<span className="app-currency-btn-code">{currency}</span>
					</button>
				</div>

				<div className="app-panel overflow-hidden p-1">
					<div className="grid grid-cols-5 gap-0">
						{CATEGORIES.map((cat, idx) => (
							<button
								key={cat.key}
								type="button"
								onClick={() => setCategory(cat.key)}
								className={`app-cat-btn app-cat-${cat.tone} ${category === cat.key ? 'app-cat-btn-active' : ''} ${idx % 5 !== 4 ? 'border-r border-[#1a1814]/10' : ''}`}
							>
								{t(cat.i18nKey)}
							</button>
						))}
					</div>
				</div>

				<input type="text" value={billName} onChange={(e) => setBillName(e.target.value)} placeholder={t('bills.namePlaceholder')} className="settings-input py-2 text-sm" />

				<div className="app-panel p-2">
					<div className="mb-1 flex items-center justify-between">
						<span className="app-label">{t('bills.payer')}</span>
					</div>
					<div className="flex flex-wrap justify-center gap-1">
						{tripMembers.map((friend) => (
							<button
								key={friend.id}
								type="button"
								onClick={() => setPayerId(friend.id)}
								className={`flex min-w-14 flex-col items-center gap-0.5 p-1 ${payerId === friend.id ? 'ring-2 ring-[#2a9d8f]' : ''}`}
							>
								<FriendIcon name={friend.name} size="md" isSelf={friend.isSelf} />
								<span className="max-w-14 truncate text-[9px]">{friend.name}</span>
							</button>
						))}
					</div>
				</div>

				<div className="app-panel p-2">
					<div className="mb-1 flex items-center justify-between">
						<span className="app-label">{t('bills.owed')}</span>
						<button type="button" onClick={handleSelectAllFriends} className="app-btn-compact">
							{t('bills.selectAll')}
						</button>
					</div>
					<div className="flex flex-wrap justify-center gap-1">
						{tripMembers.map((friend) => (
							<button
								key={friend.id}
								type="button"
								onClick={() => handleToggleFriend(friend.id)}
								className={`flex min-w-14 flex-col items-center gap-0.5 p-1 ${owedFriendIds.includes(friend.id) ? 'ring-2 ring-[#2a9d8f]' : ''}`}
							>
								<FriendIcon name={friend.name} size="md" isSelf={friend.isSelf} />
								<span className="max-w-14 truncate text-[9px]">{friend.name}</span>
							</button>
						))}
					</div>
				</div>

				<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('bills.notePlaceholder')} rows={2} className="settings-input resize-none py-2 text-sm" />

				<div className="grid grid-cols-3 gap-1">
					{STATUSES.map((stat) => (
						<button key={stat.value} type="button" onClick={() => setStatus(stat.value)} className={`app-toolbar-chip py-1.5 ${status === stat.value ? 'app-toolbar-chip-active' : ''}`}>
							{t(stat.i18nKey)}
						</button>
					))}
				</div>

				<div className="app-panel p-2">
					<div className="mb-1 flex items-center justify-between">
						<span className="app-label">{t('bills.location')}</span>
						<button type="button" onClick={acquireLocation} className="app-btn-compact app-btn-compact-primary">
							{t('bills.reacquireLocation')}
						</button>
					</div>
					{locationError ? (
						<p className="text-[11px] text-app-danger">{locationError}</p>
					) : latitude != null && longitude != null ? (
						<p className="settings-mono text-[10px] text-[#2a9d8f]">
							{latitude.toFixed(5)}, {longitude.toFixed(5)}
						</p>
					) : (
						<p className="text-[11px] text-app-muted">{t('bills.locating')}</p>
					)}
				</div>

				<div className="flex gap-2 pt-1">
					<button type="button" onClick={() => router.back()} className="settings-btn-ghost flex-1 py-3 text-sm">
						{t('common.cancel')}
					</button>
					<button type="button" onClick={handleCreateBill} className="settings-btn-primary flex-1 py-3 text-sm">
						{billId ? t('common.save') : t('common.create')}
					</button>
				</div>
			</div>

			<Modal isOpen={isPaymentMethodModalOpen} onClose={() => setIsPaymentMethodModalOpen(false)} title={t('bills.modal.paymentMethod')} showOkButton={false} showCancelButton cancelText={t('common.close')}>
				<div className="modal-option-grid">
					{PAYMENT_METHODS.map((method) => (
						<button
							key={method.value}
							type="button"
							onClick={() => {
								setPaymentMethod(method.value);
								setIsPaymentMethodModalOpen(false);
							}}
							className={`modal-option ${paymentMethod === method.value ? 'modal-option-active' : ''}`}
						>
							{t(method.i18nKey)}
						</button>
					))}
				</div>
			</Modal>

			<Modal isOpen={isCurrencyModalOpen} onClose={() => setIsCurrencyModalOpen(false)} title={t('bills.modal.currency')} showOkButton={false} showCancelButton cancelText={t('common.close')}>
				<div className="modal-option-grid">
					{Object.entries(CURRENCY_DEFINITIONS).map(([key, curr]: [string, Currency]) => (
						<button
							key={curr.code}
							type="button"
							onClick={() => {
								setCurrency(curr.code);
								if (typeof window !== 'undefined') {
									window.localStorage.setItem(LAST_BILL_CURRENCY_KEY, curr.code);
								}
								setIsCurrencyModalOpen(false);
							}}
							className={`modal-option modal-option-currency ${currency === curr.code ? 'modal-option-active' : ''}`}
						>
							<FlagSVG currency={curr} />
							{curr.code}
						</button>
					))}
				</div>
			</Modal>
		</AppShell>
	);
}
