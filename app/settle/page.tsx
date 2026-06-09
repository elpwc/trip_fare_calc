'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/src/components/layout/AppShell';
import { getAuthHeaders } from '@/src/utils/auth';
import { formatAmount } from '@/src/utils/currencies';
import { Trip, FlowItem } from '@/src/types';
import { usePreferences } from '@/src/utils/preferences-provider';
import type { MessageKey } from '@/src/utils/i18n/messages';

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

const SAME_CURRENCY_SOURCE = '__same_currency__';

function getStorageKey(tripId: string) {
	return `settle-history-${tripId}`;
}

function createUniqueId() {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getConversionRateText(
	currency: string,
	rates: Record<string, number>,
	resultCurrency: string,
	t: (key: MessageKey, params?: Record<string, string | number>) => string,
) {
	const rate = rates[currency];
	if (!rate) return t('settle.ratePending', { from: currency, to: resultCurrency });
	return `1${currency}=${(1 / rate).toFixed(3)}${resultCurrency}`;
}

function loadSavedSettlements(tripId: string): SettledRecord[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = window.localStorage.getItem(getStorageKey(tripId));
		return raw ? (JSON.parse(raw) as SettledRecord[]) : [];
	} catch {
		return [];
	}
}

function saveSettledRecords(tripId: string, records: SettledRecord[]) {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(getStorageKey(tripId), JSON.stringify(records));
}

const SETTLE_CURRENCY_KEY = 'tripFareCalc:settleCurrency';

function SettlePageLoading() {
	const { t } = usePreferences();
	return (
		<AppShell tight>
			<div className="app-empty mt-8">{t('common.loading')}</div>
		</AppShell>
	);
}

function SettlePageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { t, locale } = usePreferences();
	const tripId = searchParams.get('tripId');

	const [trip, setTrip] = useState<Trip | null>(null);
	const [selectedCurrency, setSelectedCurrency] = useState(() => {
		if (typeof window === 'undefined') return 'CNY';
		return window.localStorage.getItem(SETTLE_CURRENCY_KEY) || 'CNY';
	});
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
				const response = await fetch('/api/trips', { headers: getAuthHeaders(), cache: 'no-store' });
				const data = await response.json();
				if (!response.ok) throw new Error(data?.error || t('settle.fetchTripFailed'));
				const currentTrip = (data as Trip[]).find((item) => item.id === tripId) || null;
				setTrip(currentTrip);
				if (currentTrip) setSavedRecords(loadSavedSettlements(currentTrip.id));
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		}

		loadTrip();
	}, [tripId, router, t]);

	useEffect(() => {
		if (!trip) return;

		const currencies = Array.from(new Set(trip.bills.map((bill) => bill.currency).filter((code) => code !== selectedCurrency)));

		if (currencies.length === 0) {
			setExchangeInfo({ base: selectedCurrency, date: new Date().toISOString().split('T')[0], rates: {}, source: SAME_CURRENCY_SOURCE });
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
				if (!response.ok || !result) throw new Error(t('settle.ratesApiError'));

				const rates: Record<string, number> = {};
				if (Array.isArray(result)) {
					result.forEach((item: { quote?: string; rate?: number }) => {
						if (item.quote && item.rate) rates[item.quote] = item.rate;
					});
				}
				const date = Array.isArray(result) && result.length > 0 ? result[0].date : new Date().toISOString().split('T')[0];
				setExchangeInfo({ base: selectedCurrency, date, rates, source: 'frankfurter.dev' });
			} catch (error) {
				console.error(error);
				setExchangeError(t('settle.ratesFailed'));
				setExchangeInfo(null);
			} finally {
				setExchangeLoading(false);
			}
		}

		loadRates();
	}, [trip, selectedCurrency, rateRefreshKey, t]);

	const liveFlows = useMemo(() => {
		if (!trip || !exchangeInfo) return [];

		type FlowBucket = { amount: number; originalTotals: Record<string, number> };
		const flowMap = new Map<string, FlowBucket>();
		const memberNames = new Map(trip.members.map((member) => [member.id, member.name]));

		const settledPairs = new Set(savedRecords.map((record) => `${record.fromId}|${record.toId}`));

		trip.bills.forEach((bill) => {
			if (bill.status === 'SETTLED') return;
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
				fromName: memberNames.get(sourceFrom) || '?',
				toName: memberNames.get(sourceTo) || '?',
				amount: netAmount,
				currency: selectedCurrency,
				originalTotals: Object.entries(sourceBucket.originalTotals).map(([currency, amount]) => ({ currency, amount })),
				createdAt: new Date().toISOString(),
			});
		}

		return items.filter((item) => !settledPairs.has(`${item.fromId}|${item.toId}`)).sort((a, b) => b.amount - a.amount);
	}, [trip, exchangeInfo, selectedCurrency, savedRecords]);

	const totalOpenAmount = useMemo(() => liveFlows.reduce((sum, item) => sum + item.amount, 0), [liveFlows]);
	const totalSettledAmount = useMemo(() => savedRecords.reduce((sum, item) => sum + item.amount, 0), [savedRecords]);

	const handleSettleItem = (item: FlowItem) => {
		if (!trip) return;
		const exchangeNotes =
			exchangeInfo && Object.keys(exchangeInfo.rates).length > 0
				? Object.keys(exchangeInfo.rates)
						.map((currency) => getConversionRateText(currency, exchangeInfo.rates, selectedCurrency, t))
						.join('；')
				: t('settle.noRates');

		const record: SettledRecord = {
			...item,
			id: createUniqueId(),
			settledAt: new Date().toISOString(),
			exchangeNotes,
			resultCurrency: selectedCurrency,
		};

		const next = [record, ...savedRecords];
		setSavedRecords(next);
		saveSettledRecords(trip.id, next);
	};

	const exchangeSourceLabel =
		exchangeInfo?.source === SAME_CURRENCY_SOURCE ? t('settle.sameCurrency') : exchangeInfo?.source ?? '';

	if (isLoading || !trip) {
		return (
			<AppShell tight>
				<div className="app-empty mt-8">{t('settle.loading')}</div>
			</AppShell>
		);
	}

	return (
		<AppShell tight>
			<header className="mb-2 flex flex-wrap items-start justify-between gap-2">
				<div>
					<button type="button" onClick={() => router.push(`/?tripId=${tripId}`)} className="app-label mb-1 hover:text-app-danger">
						{t('settle.backToBills')}
					</button>
					<h1 className="settings-display text-xl leading-tight">{trip.name}</h1>
					<p className="app-label mt-1">{t('settle.receipt', { currency: selectedCurrency })}</p>
				</div>
				<div className="flex flex-wrap items-center gap-1">
					<select
						value={selectedCurrency}
						onChange={(e) => {
							const next = e.target.value;
							setSelectedCurrency(next);
							if (typeof window !== 'undefined') {
								window.localStorage.setItem(SETTLE_CURRENCY_KEY, next);
							}
						}}
						className="settings-input w-auto py-1.5 text-xs"
					>
						{['CNY', 'JPY', 'USD', 'EUR', 'HKD', 'TWD', 'KRW'].map((code) => (
							<option key={code} value={code}>
								{code}
							</option>
						))}
					</select>
					<button type="button" disabled={exchangeLoading} onClick={() => setRateRefreshKey((c) => c + 1)} className="app-toolbar-chip">
						{exchangeLoading ? t('settle.ratesLoading') : t('settle.refreshRates')}
					</button>
				</div>
			</header>

			<div className="app-summary-strip mb-2">
				<span>
					{t('settle.openTotal')} <strong>{formatAmount(totalOpenAmount, selectedCurrency)}</strong>
				</span>
				<span>
					{t('settle.settledTotal')} <strong>{formatAmount(totalSettledAmount, selectedCurrency)}</strong>
				</span>
				<span className="app-label">
					{t('settle.pendingCount', { open: liveFlows.length, closed: savedRecords.length })}
				</span>
			</div>

			{exchangeError ? <p className="mb-2 text-[11px] text-app-danger">{exchangeError}</p> : null}

			<section className="app-panel overflow-hidden">
				<div className="app-panel-head">
					<span className="app-label">{t('settle.results')}</span>
					<span className="settings-mono text-[10px] text-app-muted">{t('settle.excludeSettled')}</span>
				</div>
				<table className="app-data-table">
					<thead>
						<tr>
							<th>{t('table.payer')}</th>
							<th>{t('common.arrow')}</th>
							<th>{t('table.payee')}</th>
							<th>{t('table.amount')}</th>
							<th>{t('table.originalCurrency')}</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{liveFlows.length > 0 ? (
							liveFlows.map((item) => (
								<tr key={item.id}>
									<td className="font-semibold">{item.fromName}</td>
									<td className="text-app-muted">{t('common.arrow')}</td>
									<td className="font-semibold">{item.toName}</td>
									<td className="app-amount text-sm">{formatAmount(item.amount, selectedCurrency)}</td>
									<td className="text-[10px] leading-tight text-app-muted">{item.originalTotals.map((o) => `${o.currency}${o.amount.toFixed(1)}`).join(' ')}</td>
									<td>
										<button type="button" onClick={() => handleSettleItem(item)} className="app-btn-compact app-btn-compact-primary">
											{t('settle.settleAction')}
										</button>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={6} className="py-3 text-center text-[12px] text-app-muted">
									{t('settle.noFlows')}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</section>

			<section className="app-panel mt-2 overflow-hidden">
				<div className="app-panel-head">
					<span className="app-label">{t('settle.settledSection')}</span>
					<span className="settings-mono text-[10px] text-app-muted">
						{savedRecords.length} {t('common.recordsUnit')}
					</span>
				</div>
				<table className="app-data-table">
					<thead>
						<tr>
							<th>{t('table.payer')}</th>
							<th>{t('common.arrow')}</th>
							<th>{t('table.payee')}</th>
							<th>{t('table.amount')}</th>
							<th>{t('table.time')}</th>
						</tr>
					</thead>
					<tbody>
						{savedRecords.length > 0 ? (
							savedRecords.map((record) => (
								<tr key={record.id}>
									<td>{record.fromName}</td>
									<td>{t('common.arrow')}</td>
									<td>{record.toName}</td>
									<td className="app-amount">{formatAmount(record.amount, record.resultCurrency)}</td>
									<td className="settings-mono text-[10px] text-app-muted">
										{new Date(record.settledAt).toLocaleDateString(locale, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={5} className="py-3 text-center text-[12px] text-app-muted">
									{t('settle.noSettledRecords')}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</section>

			{exchangeInfo ? (
				<div className="mt-2 settings-mono text-[10px] leading-relaxed text-app-muted">
					{t('settle.ratesMeta', { source: exchangeSourceLabel, date: exchangeInfo.date })}
					{Object.keys(exchangeInfo.rates).length > 0
						? ` · ${Object.keys(exchangeInfo.rates)
								.map((c) => getConversionRateText(c, exchangeInfo.rates, selectedCurrency, t))
								.join(' · ')}`
						: t('settle.ratesSameCurrency')}
				</div>
			) : null}

			<div className="settings-barcode mt-3 rounded-sm" aria-hidden />
		</AppShell>
	);
}

export default function SettlePage() {
	return (
		<Suspense fallback={<SettlePageLoading />}>
			<SettlePageContent />
		</Suspense>
	);
}
