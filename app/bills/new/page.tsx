'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Modal } from '@/src/components/Modal';
import AppShell from '@/src/components/layout/AppShell';
import FriendIcon from '@/src/components/FriendIcon';
import { getAuthHeaders } from '@/src/utils/auth';
import { Currency, CURRENCY_DEFINITIONS } from '@/src/utils/currencies';
import { FlagSVG } from '@/src/components/FlagSVG';
import { Member } from '@/src/types';

type Friend = Member;

type BillOwed = {
	friendId: string;
};

const LAST_BILL_CURRENCY_KEY = 'tripFareCalc:lastBillCurrency';

const CATEGORIES = [
	{ key: '吃饭', label: '吃饭', tone: 'meal' },
	{ key: '住宿', label: '住宿', tone: 'hotel' },
	{ key: '门票', label: '门票', tone: 'ticket' },
	{ key: 'KTV', label: 'KTV', tone: 'ktv' },
	{ key: '购物', label: '购物', tone: 'shop' },
	{ key: '租车', label: '租车', tone: 'car' },
	{ key: '高速费', label: '高速费', tone: 'toll' },
	{ key: '加油费', label: '加油费', tone: 'gas' },
	{ key: '停车费', label: '停车费', tone: 'park' },
	{ key: '打车', label: '打车', tone: 'taxi' },
	{ key: '公交', label: '公交', tone: 'bus' },
	{ key: '火车', label: '火车', tone: 'train' },
	{ key: '机票', label: '机票', tone: 'flight' },
	{ key: '交通', label: '交通', tone: 'traffic' },
	{ key: '其他', label: '其他', tone: 'none' },
];

const STATUSES = [
	{ value: 'UNPAID', label: '未付款' },
	{ value: 'UNRETURNED', label: '未偿还' },
	{ value: 'PARTIALLY_RETURNED', label: '部分偿还' },
	{ value: 'SETTLED', label: '已结清' },
];

const PAYMENT_METHODS = ['任意', '现金', '支付宝', '微信', '银行转账', 'PayPay', '信用卡', 'PayPal', 'ApplePay', '其他'];

export default function NewBillPage({ billId }: { billId?: string } = {}) {
	return (
		<Suspense
			fallback={
				<AppShell tight>
					<div className="app-empty mt-8">加载中...</div>
				</AppShell>
			}
		>
			<NewBillPageContent billId={billId} />
		</Suspense>
	);
}

function NewBillPageContent({ billId }: { billId?: string } = {}) {
	const router = useRouter();
	const searchParams = useSearchParams();
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
			setLocationError('浏览器不支持定位');
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setLatitude(position.coords.latitude);
				setLongitude(position.coords.longitude);
				setLocationError(null);
			},
			(error) => {
				setLocationError(`定位失败：${error.message}`);
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
			const response = await fetch(`/api/bills/${billId}`, {
				headers: getAuthHeaders(),
			});

			if (!response.ok) {
				const errorData = await response.json();
				setErrorMessage(errorData?.error || '获取账单失败');
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
			setErrorMessage('获取账单失败');
		}
	};

	const fetchTripsAndFriends = async () => {
		try {
			const response = await fetch('/api/trips', {
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
		if (!selectedTripId || !amount || !payerId ) {
			alert('请填写必需信息');
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

			const url = billId ? `/api/bills/${billId}` : '/api/bills';
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
				alert(`${billId ? '更新' : '创建'}账单失败: ${errorData.error || '未知错误'}`);
			}
		} catch (error) {
			console.error('Failed to submit bill:', error);
			alert(`${billId ? '更新' : '创建'}账单失败`);
		}
	};

	if (!isLoaded) {
		return (
			<AppShell tight>
				<div className="app-empty mt-8">加载中...</div>
			</AppShell>
		);
	}

	if (errorMessage) {
		return (
			<AppShell tight>
				<div className="app-empty mt-8 text-[#e85d4c]">{errorMessage}</div>
			</AppShell>
		);
	}

	return (
		<AppShell tight>
			<header className="mb-2 flex items-center justify-between gap-2">
				<button type="button" onClick={() => router.back()} className="app-label hover:text-[#e85d4c]">
					← 返回
				</button>
				<h1 className="settings-display text-xl">{billId ? '编辑账单' : '新建账单'}</h1>
				<span className="settings-stamp scale-75">BILL</span>
			</header>

			<div className="space-y-2">
				<div className="app-panel flex overflow-hidden">
					<input
						type="number"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						placeholder="金额"
						className="settings-input min-w-0 flex-1 border-0 py-3 text-3xl font-bold shadow-none focus:shadow-none"
					/>
					<button type="button" onClick={() => setIsPaymentMethodModalOpen(true)} className="app-toolbar-chip shrink-0 self-stretch border-y-0 border-r-0 px-2">
						{paymentMethod === '任意' ? '支付方式' : paymentMethod}
					</button>
					<button type="button" onClick={() => setIsCurrencyModalOpen(true)} className="app-currency-btn" aria-label="选择币种">
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
								{cat.label}
							</button>
						))}
					</div>
				</div>

				<input type="text" value={billName} onChange={(e) => setBillName(e.target.value)} placeholder="账单名称（可空）" className="settings-input py-2 text-sm" />

				<div className="app-panel p-2">
					<div className="mb-1 flex items-center justify-between">
						<span className="app-label">付钱人</span>
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
						<span className="app-label">欠钱人</span>
						<button type="button" onClick={handleSelectAllFriends} className="app-btn-compact">
							全部
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

				<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="备注（可选）" rows={2} className="settings-input resize-none py-2 text-sm" />

				<div className="grid grid-cols-4 gap-1">
					{STATUSES.map((stat) => (
						<button key={stat.value} type="button" onClick={() => setStatus(stat.value)} className={`app-toolbar-chip py-1.5 ${status === stat.value ? 'app-toolbar-chip-active' : ''}`}>
							{stat.label}
						</button>
					))}
				</div>

				<div className="app-panel p-2">
					<div className="mb-1 flex items-center justify-between">
						<span className="app-label">定位</span>
						<button type="button" onClick={acquireLocation} className="app-btn-compact app-btn-compact-primary">
							重取
						</button>
					</div>
					{locationError ? (
						<p className="text-[11px] text-[#e85d4c]">{locationError}</p>
					) : latitude != null && longitude != null ? (
						<p className="settings-mono text-[10px] text-[#2a9d8f]">
							{latitude.toFixed(5)}, {longitude.toFixed(5)}
						</p>
					) : (
						<p className="text-[11px] text-[#6b6458]">正在获取…</p>
					)}
				</div>

				<div className="flex gap-2 pt-1">
					<button type="button" onClick={() => router.back()} className="settings-btn-ghost flex-1 py-3 text-sm">
						取消
					</button>
					<button type="button" onClick={handleCreateBill} className="settings-btn-primary flex-1 py-3 text-sm">
						{billId ? '保存' : '创建'}
					</button>
				</div>
			</div>

			<Modal isOpen={isPaymentMethodModalOpen} onClose={() => setIsPaymentMethodModalOpen(false)} title="支付方法" showOkButton={false} showCancelButton cancelText="关闭">
				<div className="modal-option-grid">
					{PAYMENT_METHODS.map((method) => (
						<button
							key={method}
							type="button"
							onClick={() => {
								setPaymentMethod(method);
								setIsPaymentMethodModalOpen(false);
							}}
							className={`modal-option ${paymentMethod === method ? 'modal-option-active' : ''}`}
						>
							{method}
						</button>
					))}
				</div>
			</Modal>

			<Modal isOpen={isCurrencyModalOpen} onClose={() => setIsCurrencyModalOpen(false)} title="币种" showOkButton={false} showCancelButton cancelText="关闭">
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
