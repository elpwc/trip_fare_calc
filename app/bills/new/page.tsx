'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/src/components/Modal';
import FriendIcon from '@/src/components/FriendIcon';
import { getAuthHeaders } from '@/src/utils/auth';
import { CURRENCIES, Currency, CURRENCY_DEFINITIONS, getCurrencyName } from '@/src/utils/currencies';
import { FlagSVG } from '@/src/components/FlagSVG';
import { Member } from '@/src/types';

type Friend = Member;

const CATEGORIES = [
	{ key: '吃饭', label: '吃饭', bg: 'bg-orange-500', text: 'text-white' },
	{ key: '酒店', label: '酒店', bg: 'bg-purple-500', text: 'text-white' },
	{ key: '租车', label: '租车', bg: 'bg-cyan-500', text: 'text-white' },
	{ key: '门票', label: '门票', bg: 'bg-pink-500', text: 'text-white' },
	{ key: '高速费', label: '高速费', bg: 'bg-yellow-500', text: 'text-white' },
	{ key: 'KTV', label: 'KTV', bg: 'bg-rose-500', text: 'text-white' },
	{ key: '火车票', label: '火车票', bg: 'bg-indigo-500', text: 'text-white' },
	{ key: '机票', label: '机票', bg: 'bg-sky-500', text: 'text-white' },
	{ key: '购物', label: '购物', bg: 'bg-lime-500', text: 'text-white' },
	{ key: '无', label: '无', bg: 'bg-slate-400', text: 'text-white' },
];

const STATUSES = [
	{ value: 'UNPAID', label: '未付款' },
	{ value: 'UNRETURNED', label: '未偿还' },
	{ value: 'PARTIALLY_RETURNED', label: '部分偿还' },
	{ value: 'SETTLED', label: '已结清' },
];

const PAYMENT_METHODS = ['现金', '支付宝', '微信', '银行转账', 'PayPay', '信用卡', 'PayPal', 'ApplePay', '其他'];

export default function NewBillPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const tripId = searchParams.get('tripId');

	const [amount, setAmount] = useState('');
	const [currency, setCurrency] = useState('CNY');
	const [paymentMethod, setPaymentMethod] = useState('现金');
	const [category, setCategory] = useState('吃饭');
	const [billName, setBillName] = useState('');
	const [payerId, setPayerId] = useState<string>('');
	const [owedFriendIds, setOwedFriendIds] = useState<string[]>([]);
	const [description, setDescription] = useState('');
	const [status, setStatus] = useState('UNRETURNED');
	const [latitude, setLatitude] = useState<number | null>(null);
	const [longitude, setLongitude] = useState<number | null>(null);
	const [locationError, setLocationError] = useState<string | null>(null);

	const [friends, setFriends] = useState<Friend[]>([]);
	const [tripMembers, setTripMembers] = useState<Friend[]>([]);

	const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
	const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

	useEffect(() => {
		if (!tripId) return;
		fetchTripsAndFriends();
		acquireLocation();
	}, [tripId]);

	const fetchTripsAndFriends = async () => {
		try {
			const response = await fetch('/api/trips', {
				headers: getAuthHeaders(),
			});
			if (response.ok) {
				const trips = await response.json();
				const currentTrip = trips.find((t: any) => t.id === tripId);
				if (currentTrip) {
					setTripMembers(currentTrip.members || []);
				}
			}
		} catch (error) {
			console.error('Failed to fetch trips:', error);
		}
	};

	const acquireLocation = () => {
		if (!navigator.geolocation) {
			setLocationError('浏览器不支持地理定位');
			return;
		}
		setLocationError('正在获取定位...');
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setLatitude(position.coords.latitude);
				setLongitude(position.coords.longitude);
				setLocationError(null);
			},
			(error) => {
				setLatitude(null);
				setLongitude(null);
				setLocationError(`定位失败：${error.message}`);
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
		);
	};

	const handleSelectAllFriends = () => {
		setOwedFriendIds(tripMembers.map((f) => f.id));
	};

	const handleToggleFriend = (friendId: string) => {
		setOwedFriendIds((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]));
	};

	const handleCreateBill = async () => {
		if (!tripId || !amount || !payerId || !billName.trim()) {
			alert('请填写必需信息');
			return;
		}

		try {
			// 如果没有填写description，则使用category作为description
			const finalDescription = description.trim() || category;

			const response = await fetch('/api/bills', {
				method: 'POST',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					tripId,
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
				}),
			});

			if (response.ok) {
				router.push(`/?tripId=${tripId}`);
			} else {
				const errorData = await response.json();
				alert(`创建账单失败: ${errorData.error}`);
			}
		} catch (error) {
			console.error('Failed to create bill:', error);
			alert('创建账单失败');
		}
	};

	return (
		<div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
			<div className="max-w-2xl mx-auto px-4 py-8 pb-24">
				{/* Header */}
				<div className="mb-8 flex items-center justify-between">
					<button onClick={() => router.back()} className="flex text-[18px] font-semibold text-blue-600 hover:text-blue-500">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
							<path d="m3.86 8.753 5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z" />
						</svg>
						返回
					</button>
					<h1 className="text-3xl font-bold">新建账单</h1>
					<div className="w-12" />
				</div>

				<div className="space-y-6 pb-32">
					{/* Row 1: Amount + Payment Method + Currency */}
					<div className="flex">
						<input
							type="number"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							placeholder="金额"
							className="flex-1 min-w-0 text-4xl font-bold px-4 py-4 border-4 border-slate-300 dark:border-slate-700 rounded-l-2xl bg-white dark:bg-slate-900 outline-none focus:border-blue-500 placeholder:text-slate-400"
						/>
						<button
							onClick={() => setIsPaymentMethodModalOpen(true)}
							className="px-3 py-4 border-y-4 border-r-4 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 font-semibold text-sm whitespace-nowrap"
						>
							{paymentMethod}
						</button>
						<button
							onClick={() => setIsCurrencyModalOpen(true)}
							className="px-3 py-4 border-y-4 border-r-4 border-slate-300 dark:border-slate-700 rounded-r-2xl bg-white dark:bg-slate-900 hover:border-blue-500 font-semibold text-3xl whitespace-nowrap"
						>
							{CURRENCY_DEFINITIONS[currency].suffix}
						</button>
					</div>

					{/* Row 2: Category Grid (3x3) */}
					<div>
						<div className="grid grid-cols-5 gap-0 border-2 border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
							{CATEGORIES.map((cat, idx) => (
								<button
									key={cat.key}
									onClick={() => setCategory(cat.key)}
									className={`py-2 px-2 font-semibold transition text-xs ${
										category === cat.key ? `${cat.bg} ${cat.text} relative z-10` : `${cat.bg} ${cat.text} opacity-40 hover:opacity-100`
									} ${idx % 5 !== 4 ? 'border-r border-slate-300 dark:border-slate-700' : ''}`}
								>
									{cat.label}
								</button>
							))}
						</div>
					</div>

					{/* Row 3: Bill Name */}
					<div>
						<input
							type="text"
							value={billName}
							onChange={(e) => setBillName(e.target.value)}
							placeholder="账单说明"
							className="w-full text-lg px-4 py-4 border-4 border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 outline-none focus:border-blue-500 placeholder:text-slate-400"
						/>
					</div>

					{/* Row 4: Payer Selection */}
					<div className="border-4 border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 p-4">
						<div className="mb-4 flex items-center justify-between">
							<span className="text-base font-semibold">付钱人</span>
						</div>

						{/* All Friends for Payer Selection */}
						<div className="flex flex-wrap gap-2 justify-center">
							{tripMembers.map((friend) => (
								<button
									key={friend.id}
									onClick={() => setPayerId(friend.id)}
									className={`flex flex-col min-w-16 items-center gap-1 p-2 rounded-lg transition ${
										payerId === friend.id ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
									}`}
								>
									<FriendIcon name={friend.name} size="lg" isSelf={friend.isSelf} />
									<span className="text-xs font-semibold text-center max-w-14 truncate">{friend.name}</span>
								</button>
							))}
						</div>
					</div>

					{/* Row 5: Owed Friends Selection */}
					<div className="border-4 border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 p-4">
						<div className="mb-4 flex items-center justify-between">
							<span className="text-base font-semibold">欠钱人</span>
							<button onClick={handleSelectAllFriends} className="px-3 py-1 text-xs font-semibold bg-slate-200 dark:bg-slate-800 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700">
								全部
							</button>
						</div>

						{/* All Friends */}
						<div className="flex flex-wrap gap-2 justify-center">
							{tripMembers.map((friend) => (
								<button
									key={friend.id}
									onClick={() => handleToggleFriend(friend.id)}
									className={`flex flex-col min-w-16 items-center gap-1 p-2 rounded-lg transition ${
										owedFriendIds.includes(friend.id) ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
									}`}
								>
									<FriendIcon name={friend.name} size="lg" isSelf={friend.isSelf} />
									<span className="text-xs font-semibold text-center max-w-14 truncate">{friend.name}</span>
								</button>
							))}
						</div>
					</div>

					{/* Row 6: Description */}
					<div>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="添加备注（可选）"
							rows={3}
							className="w-full px-4 py-4 border-4 border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 outline-none focus:border-blue-500 placeholder:text-slate-400"
						/>
					</div>

					{/* Row 7: Status Selection */}
					<div>
						<div className="flex gap-2 justify-between">
							{STATUSES.map((stat) => (
								<button
									key={stat.value}
									onClick={() => setStatus(stat.value)}
									className={`flex-1 py-3 px-3 border-3 rounded-lg font-semibold transition text-sm ${
										status === stat.value
											? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
											: 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500'
									}`}
								>
									{stat.label}
								</button>
							))}
						</div>
					</div>

					{/* Row 8: Location Info */}
					<div className="border-4 border-slate-300 dark:border-slate-700 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 p-4">
						<div className="flex items-center justify-between mb-3">
							<p className="font-bold text-lg">📍 定位信息</p>
							<button onClick={acquireLocation} className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-full hover:bg-emerald-500 transition">
								重新获取
							</button>
						</div>
						{locationError ? (
							<p className="text-sm text-rose-600 dark:text-rose-400 font-semibold">{locationError}</p>
						) : latitude != null && longitude != null ? (
							<div>
								<p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">✓ 已定位</p>
								<p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-1">
									{latitude.toFixed(6)}, {longitude.toFixed(6)}
								</p>
							</div>
						) : (
							<p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">正在获取地理位置...</p>
						)}
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 pt-4">
						<button
							onClick={() => router.back()}
							className="flex-1 py-4 px-4 border-4 border-slate-300 dark:border-slate-700 rounded-2xl font-bold text-base hover:bg-slate-100 dark:hover:bg-slate-800 transition"
						>
							取消
						</button>
						<button
							onClick={handleCreateBill}
							className="flex-1 py-4 px-4 border-4 border-emerald-600 bg-emerald-600 text-white rounded-2xl font-bold text-base hover:bg-emerald-500 hover:border-emerald-500 transition"
						>
							创建账单
						</button>
					</div>
				</div>
			</div>

			{/* Payment Method Modal */}
			<Modal isOpen={isPaymentMethodModalOpen} onClose={() => setIsPaymentMethodModalOpen(false)} title="支付方法" showOkButton={false} showCancelButton cancelText="关闭">
				<div className="grid grid-cols-2 gap-3">
					{PAYMENT_METHODS.map((method) => (
						<button
							key={method}
							onClick={() => {
								setPaymentMethod(method);
								setIsPaymentMethodModalOpen(false);
							}}
							className={`py-3 px-4 border-3 rounded-lg font-semibold transition ${
								paymentMethod === method
									? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
									: 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500'
							}`}
						>
							{method}
						</button>
					))}
				</div>
			</Modal>

			{/* Currency Modal */}
			<Modal isOpen={isCurrencyModalOpen} onClose={() => setIsCurrencyModalOpen(false)} title="币种" showOkButton={false} showCancelButton cancelText="关闭">
				<div className="grid grid-cols-2 gap-3">
					{Object.entries(CURRENCY_DEFINITIONS).map(([key, curr]: [string, Currency]) => (
						<button
							key={curr.code}
							onClick={() => {
								setCurrency(curr.code);
								setIsCurrencyModalOpen(false);
							}}
							className={`grid grid-cols-2 gap-2 py-3 px-4 border-3 rounded-lg font-semibold transition ${
								currency === curr.code
									? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
									: 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500'
							}`}
						>
							<FlagSVG currency={curr} />
							{curr.code}
						</button>
					))}
				</div>
			</Modal>
		</div>
	);
}
