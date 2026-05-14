'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthHeaders } from '@/src/utils/auth';
import { CURRENCIES, Currency, CURRENCY_DEFINITIONS, formatAmount } from '@/src/utils/currencies';
import { FlagSVG } from '@/src/components/FlagSVG';
import { Friend, Bill, BillOwed, Trip, FlowItem } from '@/src/types';

type SettledRecord = FlowItem & {
	settledAt: string;
	exchangeNotes: string;
	resultCurrency: string;
};

type ExchangeInfo = {
	base: string;
	date: string;
	rates: Record<string, number>;
	source: string;
};

function getStorageKey(tripId: string) {
	return `settle-history-${tripId}`;
}

function createUniqueId() {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getConversionRateText(currency: string, rates: Record<string, number>, resultCurrency: string) {
	const rate = rates[currency];
	if (!rate) {
		return `${currency} -> ${resultCurrency} 汇率待获取`;
	}
	const converted = 1 / rate;
	return `1 ${currency} = ${converted.toFixed(4)} ${resultCurrency}`;
}

function loadSavedSettlements(tripId: string): SettledRecord[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = window.localStorage.getItem(getStorageKey(tripId));
		if (!raw) return [];
		return JSON.parse(raw) as SettledRecord[];
	} catch {
		return [];
	}
}

function saveSettledRecords(tripId: string, records: SettledRecord[]) {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(getStorageKey(tripId), JSON.stringify(records));
}

export default function SettlePage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const tripId = searchParams.get('tripId');

	const [trip, setTrip] = useState<Trip | null>(null);
	const [selectedCurrency, setSelectedCurrency] = useState('CNY');
	const [exchangeInfo, setExchangeInfo] = useState<ExchangeInfo | null>(null);
	const [exchangeLoading, setExchangeLoading] = useState(false);
	const [exchangeError, setExchangeError] = useState('');
	const [rateRefreshKey, setRateRefreshKey] = useState(0);
	const [savedRecords, setSavedRecords] = useState<SettledRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!tripId) {
			router.push('/');
			return;
		}

		async function loadTrip() {
			setIsLoading(true);
			try {
				const response = await fetch('/api/trips', {
					headers: getAuthHeaders(),
					cache: 'no-store',
				});
				const data = await response.json();
				if (!response.ok) {
					throw new Error(data?.error || '获取旅行失败');
				}

				const currentTrip = (data as Trip[]).find((item) => item.id === tripId) || null;
				setTrip(currentTrip);
				if (currentTrip) {
					setSavedRecords(loadSavedSettlements(currentTrip.id));
				}
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		}

		loadTrip();
	}, [tripId, router]);

	useEffect(() => {
		if (!trip) return;

		const currencies = Array.from(new Set(trip.bills.map((bill) => bill.currency).filter((code) => code !== selectedCurrency)));

		if (currencies.length === 0) {
			setExchangeInfo({ base: selectedCurrency, date: new Date().toISOString().split('T')[0], rates: {}, source: '一致币种，无需兑换' });
			setExchangeError('');
			return;
		}

		async function loadRates() {
			setExchangeLoading(true);
			setExchangeError('');
			try {
				const quotes = currencies.join(',');
				const response = await fetch(`https://api.frankfurter.dev/v2/rates?base=${encodeURIComponent(selectedCurrency)}&quotes=${encodeURIComponent(quotes)}`);
				const result = await response.json();

				if (!response.ok || !result) {
					throw new Error('汇率接口异常');
				}

				// Frankfurter返回数组格式，转换为rates对象
				const rates: Record<string, number> = {};
				if (Array.isArray(result)) {
					result.forEach((item: any) => {
						if (item.quote && item.rate) {
							rates[item.quote] = item.rate;
						}
					});
				}
				const date = Array.isArray(result) && result.length > 0 ? result[0].date : new Date().toISOString().split('T')[0];

				setExchangeInfo({
					base: selectedCurrency,
					date: date,
					rates: rates,
					source: 'frankfurter.dev',
				});
			} catch (error) {
				console.error(error);
				setExchangeError('获取汇率失败，请稍后重试');
				setExchangeInfo(null);
			} finally {
				setExchangeLoading(false);
			}
		}
		if (trip) {
			loadRates();
		}
	}, [trip, selectedCurrency, rateRefreshKey]);

	const liveFlows = useMemo(() => {
		if (!trip || !exchangeInfo) return [];

		type FlowBucket = {
			amount: number;
			originalTotals: Record<string, number>;
		};

		const flowMap = new Map<string, FlowBucket>();
		const memberNames = new Map(trip.members.map((member) => [member.id, member.name]));

		trip.bills.forEach((bill) => {
			const owedIds = bill.owedFriends.map((owed) => owed.friendId);
			if (!owedIds.length) return;

			const share = bill.amount / owedIds.length;
			const billCurrency = bill.currency || 'CNY';
			const conversionRate = billCurrency === selectedCurrency ? 1 : exchangeInfo.rates[billCurrency];
			const convertedShare = billCurrency === selectedCurrency ? share : conversionRate ? share / conversionRate : 0;

			owedIds.forEach((owedId) => {
				const key = `${owedId}|${bill.payerId}`;
				const existing = flowMap.get(key) ?? { amount: 0, originalTotals: {} };
				existing.amount += convertedShare;
				existing.originalTotals[billCurrency] = (existing.originalTotals[billCurrency] ?? 0) + share;
				flowMap.set(key, existing);
			});
		});

		const processed = new Set<string>();

		const items: FlowItem[] = [];

		for (const [key, bucket] of flowMap.entries()) {
			if (processed.has(key)) continue;
			const [fromId, toId] = key.split('|');
			const reverseKey = `${toId}|${fromId}`;
			const reverseBucket = flowMap.get(reverseKey) ?? { amount: 0, originalTotals: {} };
			processed.add(key);
			processed.add(reverseKey);

			if (bucket.amount === reverseBucket.amount) continue;

			const netAmount = Math.abs(bucket.amount - reverseBucket.amount);
			const sourceKey = bucket.amount > reverseBucket.amount ? key : reverseKey;
			const sourceBucket = bucket.amount > reverseBucket.amount ? bucket : reverseBucket;
			const [sourceFrom, sourceTo] = sourceKey.split('|');

			items.push({
				id: sourceKey,
				fromId: sourceFrom,
				toId: sourceTo,
				fromName: memberNames.get(sourceFrom) || '未知',
				toName: memberNames.get(sourceTo) || '未知',
				amount: netAmount,
				currency: selectedCurrency,
				originalTotals: Object.entries(sourceBucket.originalTotals).map(([currency, amount]) => ({ currency, amount })),
				createdAt: new Date().toISOString(),
			});
		}

		return items.sort((a, b) => b.amount - a.amount);
	}, [trip, exchangeInfo, selectedCurrency]);

	const chartItems = useMemo(() => liveFlows.slice(0, 4), [liveFlows]);
	const totalOpenAmount = useMemo(() => liveFlows.reduce((sum, item) => sum + item.amount, 0), [liveFlows]);
	const totalSettledAmount = useMemo(() => savedRecords.reduce((sum, item) => sum + item.amount, 0), [savedRecords]);

	const handleSettleItem = (item: FlowItem) => {
		if (!trip) return;
		const settledAt = new Date().toISOString();
		const exchangeNotes =
			exchangeInfo && Object.keys(exchangeInfo.rates).length > 0
				? Object.entries(exchangeInfo.rates)
						.map(([currency, rate]) => getConversionRateText(currency, exchangeInfo.rates, selectedCurrency))
						.join('；')
				: '无汇率转换';

		const record: SettledRecord = {
			...item,
			id: createUniqueId(),
			settledAt,
			exchangeNotes,
			resultCurrency: selectedCurrency,
		};

		const next = [record, ...savedRecords];
		setSavedRecords(next);
		saveSettledRecords(trip.id, next);
	};

	const savedCount = savedRecords.length;

	if (isLoading || !trip) {
		return (
			<div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100 flex items-center justify-center px-4 py-8">
				<div className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-lg dark:border-slate-700 dark:bg-slate-900 text-center">
					<p className="text-lg font-semibold">正在加载结算页面…</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
			<div className="max-w-5xl mx-auto px-4 py-8 pb-24">
				<div className="mb-2 flex flex-wrap items-start justify-between gap-4">
					<div className="space-y-1">
						<p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">旅行结算</p>
						<h1 className="text-4xl font-bold">{trip.name}</h1>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<button
							type="button"
							onClick={() => router.push('/')}
							className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
						>
							返回首页
						</button>
						<select
							value={selectedCurrency}
							onChange={(event) => setSelectedCurrency(event.target.value)}
							className="rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
						>
							{Object.entries(CURRENCY_DEFINITIONS).map(([key, currency]: [string, Currency]) => (
								<option key={currency.code} value={currency.code}>
									{currency.code}
								</option>
							))}
						</select>
						<button
							type="button"
							onClick={() => setRateRefreshKey((current) => current + 1)}
							className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
						>
							刷新汇率
						</button>
					</div>
				</div>

				<div className="mt-2 rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
					<div className="flex flex-wrap items-center gap-2">
						<div className="flex items-baseline gap-2">
							<span className="text-slate-500 dark:text-slate-400">当前未结金额</span>
							<span className="text-lg text-slate-900 dark:text-slate-100">{formatAmount(totalOpenAmount, selectedCurrency)}</span>
						</div>
						<div className="flex items-baseline gap-2">
							<span className="text-slate-500 dark:text-slate-400">历史已结金额</span>
							<span className="text-lg text-slate-900 dark:text-slate-100">{formatAmount(totalSettledAmount, selectedCurrency)}</span>
						</div>
						<div className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
							待处理 {liveFlows.length} 条 · 已结清 {savedCount} 条
						</div>
					</div>
				</div>

				<section className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-base font-semibold">算钱结果</p>
							<p className="mt-0 text-sm text-slate-500 dark:text-slate-400">不计算已结清账单</p>
						</div>
						<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
							{liveFlows.length} 条
						</span>
					</div>

					<div className="mt-4 space-y-4">
						{liveFlows.length > 0 ? (
							liveFlows.map((item) => {
								const hasConversion = item.originalTotals.some((origin) => origin.currency !== selectedCurrency);
								return (
									<div key={item.id} className="rounded-3xl  p-0 dark:border-slate-700 dark:bg-slate-950">
										<div className="flex flex-row ">
											<div className="text-xl w-full font-semibold text-slate-900 dark:text-slate-100 flex flex-row flex-wrap gap-2">
												<div className="flex flex-row gap-2">
													<span className="text-3xl">{item.fromName}</span>
													<span className="text-3xl">给</span>
													<span className="text-3xl">{item.toName}</span>
												</div>
												<div className="w-full flex flex-row">
													<div className="w-full">
														<p className="text-4xl w-full text-center">{formatAmount(item.amount, selectedCurrency)}</p>

														{hasConversion && exchangeInfo ? (
															<div className="mt-1 rounded-3xl p-0 text-[10px] text-slate-400 dark:bg-slate-900 dark:text-slate-400 flex flex-row flex-wrap">
																<p className="mt-0 w-min text-nowrap">
																	{item.originalTotals.map((origin) => `${origin.currency} ${origin.amount.toFixed(2)}`).join('，')}
																</p>
																<p className="mt-0 w-min text-nowrap p-0">
																	({item.originalTotals.map((origin) => `${getConversionRateText(origin.currency, exchangeInfo.rates, selectedCurrency)}`).join('；')}{' '}
																	, {exchangeInfo.date})
																</p>
															</div>
														) : null}
													</div>
													<button
														type="button"
														onClick={() => handleSettleItem(item)}
														className="rounded-full border border-slate-300 bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 text-nowrap h-min"
													>
														结清
													</button>
												</div>
											</div>
										</div>
									</div>
								);
							})
						) : (
							<div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
								当前暂无可结算的往来金额，可先新增账单后刷新页面。
							</div>
						)}
					</div>
				</section>

				<section className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-base font-semibold">已结清</p>
						</div>
						<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
							{savedCount} 条
						</span>
					</div>

					<div className="mt-4 space-y-4">
						{savedRecords.length > 0 ? (
							savedRecords.map((record) => (
								<div key={record.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div>
											<p className="font-semibold text-slate-900 dark:text-slate-100">
												{record.fromName} → {record.toName}
											</p>
											<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatAmount(record.amount, record.resultCurrency)}</p>
										</div>
										<div className="text-right text-xs text-slate-500 dark:text-slate-400">
											<p>结清于 {new Date(record.settledAt).toLocaleString('zh-CN')}</p>
											<p className="mt-1">{record.resultCurrency} 结果</p>
										</div>
									</div>
									<p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{record.exchangeNotes}</p>
								</div>
							))
						) : (
							<div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
								你还没有结算记录。标记任意结算条目为“已结清”，它们会出现在这里。
							</div>
						)}
					</div>
				</section>

				<section className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-base font-semibold">统计</p>
						</div>
						<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
							前 {chartItems.length} 条
						</span>
					</div>

					<div className="mt-6 space-y-4">
						{chartItems.length > 0 ? (
							chartItems.map((item, index) => {
								const ratio = Math.min(item.amount / Math.max(chartItems[0].amount, 1), 0.96);
								return (
									<div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
										<div className="flex items-center justify-between gap-4">
											<div>
												<p className="font-semibold text-slate-900 dark:text-slate-100">
													{item.fromName} → {item.toName}
												</p>
												<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatAmount(item.amount, selectedCurrency)}</p>
											</div>
											<span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">强度 {index + 1}</span>
										</div>
										<div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
											<motion.div
												className="h-full rounded-full bg-sky-500"
												initial={{ width: 0 }}
												animate={{ width: `${ratio * 100}%` }}
												transition={{ duration: 0.8, ease: 'easeOut' }}
											/>
										</div>
									</div>
								);
							})
						) : (
							<div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
								当前暂无可视化流向，先完成结算后这里会更新。
							</div>
						)}
					</div>
				</section>

				<div className="mt-6 space-y-4">
					{exchangeLoading ? (
						<div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
							正在获取实时汇率...
						</div>
					) : exchangeError ? (
						<div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
							{exchangeError}
						</div>
					) : (
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
								<p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">汇率来源</p>
								<p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-100">{exchangeInfo?.source}</p>
								<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">更新时间 {exchangeInfo?.date}</p>
							</div>
							<div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
								<p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">实时换算说明</p>
								<p className="mt-2 text-sm text-slate-600 dark:text-slate-300">当前结果币种 {selectedCurrency}，不同币种账单已实时换算。</p>
								{exchangeInfo && Object.keys(exchangeInfo.rates).length > 0 ? (
									<div className="mt-3 space-y-1 text-sm text-slate-500 dark:text-slate-400">
										{Object.entries(exchangeInfo.rates).map(([currency]) => (
											<div key={currency}>{getConversionRateText(currency, exchangeInfo.rates, selectedCurrency)}</div>
										))}
									</div>
								) : (
									<p className="mt-3 text-sm text-slate-500 dark:text-slate-400">所有账单均已与结果币种一致。</p>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
