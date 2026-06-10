import { getBillCategoryLabelKey, getBillCategoryTone } from '@/src/utils/bill-category';
import { buildBillShareRows } from '@/src/utils/bill-split';
import type { MessageKey } from '@/src/utils/i18n/types';
import type { Bill, Trip } from '@/src/types';

export type ChartDimension = 'category' | 'payer' | 'owed' | 'date' | 'status';

export type ChartSliceSegment = {
	key: string;
	label: string;
	color: string;
	amount: number;
};

export type ChartSlice = {
	key: string;
	label: string;
	color: string;
	total: number;
	segments: ChartSliceSegment[];
};

export const CHART_DIMENSIONS: ChartDimension[] = ['category', 'payer', 'owed', 'date', 'status'];

export const DIMENSION_I18N: Record<ChartDimension, MessageKey> = {
	category: 'settle.chartDimCategory',
	payer: 'settle.chartDimPayer',
	owed: 'settle.chartDimOwed',
	date: 'settle.chartDimDate',
	status: 'settle.chartDimStatus',
};

export const CATEGORY_CHART_COLORS: Record<string, string> = {
	meal: '#f97316',
	hotel: '#8b5cf6',
	car: '#06b6d4',
	ticket: '#ec4899',
	toll: '#eab308',
	ktv: '#f43f5e',
	train: '#6366f1',
	flight: '#0ea5e9',
	shop: '#84cc16',
	gas: '#64748b',
	park: '#64748b',
	taxi: '#64748b',
	bus: '#64748b',
	traffic: '#64748b',
	none: '#94a3b8',
};

export const MEMBER_CHART_COLORS = ['#2a9d8f', '#e85d4c', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16', '#8b5cf6'] as const;

const STATUS_COLORS: Record<string, string> = {
	settled: '#2a9d8f',
	unsettled: '#e85d4c',
};

type BillRow = {
	amount: number;
	payerId: string;
	owedId: string;
	category: string;
	dateKey: string;
	statusKey: 'settled' | 'unsettled';
};

type LabelContext = {
	t: (key: MessageKey) => string;
	memberNames: Map<string, string>;
	memberOrder: Map<string, number>;
	dateLocale: string;
	settledFlowPairs: Set<string>;
};

function convertAmount(amount: number, billCurrency: string, selectedCurrency: string, rates: Record<string, number>): number {
	if (billCurrency === selectedCurrency) return amount;
	const rate = rates[billCurrency];
	return rate ? amount / rate : 0;
}

function resolveFlowStatusKey(owedId: string, payerId: string, settledFlowPairs: Set<string>): BillRow['statusKey'] {
	if (owedId === '__none__' || payerId === '__unknown__') return 'unsettled';
	return settledFlowPairs.has(`${owedId}|${payerId}`) ? 'settled' : 'unsettled';
}

function expandBill(bill: Bill, selectedCurrency: string, rates: Record<string, number>, settledFlowPairs: Set<string>): BillRow[] {
	const payerId = bill.payerId || '__unknown__';
	const dateKey = bill.createdAt.split('T')[0];
	const category = bill.category || '其他';
	const rows = buildBillShareRows(bill);

	if (!rows.length) {
		const converted = convertAmount(bill.amount, bill.currency || 'CNY', selectedCurrency, rates);
		if (converted <= 0) return [];
		return [
			{
				amount: converted,
				payerId,
				owedId: '__none__',
				category,
				dateKey,
				statusKey: resolveFlowStatusKey('__none__', payerId, settledFlowPairs),
			},
		];
	}

	return rows
		.filter((row) => row.shareAmount > 0)
		.map((row) => ({
			amount: convertAmount(row.shareAmount, bill.currency || 'CNY', selectedCurrency, rates),
			payerId: row.payerId,
			owedId: row.owedId,
			category,
			dateKey,
			statusKey: resolveFlowStatusKey(row.owedId, row.payerId, settledFlowPairs),
		}))
		.filter((row) => row.amount > 0);
}

function rowDimensionKey(row: BillRow, dimension: ChartDimension): string {
	switch (dimension) {
		case 'category':
			return row.category;
		case 'payer':
			return row.payerId;
		case 'owed':
			return row.owedId;
		case 'date':
			return row.dateKey;
		case 'status':
			return row.statusKey;
	}
}

function resolveLabel(key: string, dimension: ChartDimension, ctx: LabelContext): string {
	switch (dimension) {
		case 'category':
			return ctx.t(getBillCategoryLabelKey(key));
		case 'payer':
		case 'owed':
			if (key === '__none__') return ctx.t('settle.chartNoOwed');
			if (key === '__unknown__') return '?';
			return ctx.memberNames.get(key) || '?';
		case 'date':
			return new Date(`${key}T12:00:00`).toLocaleDateString(ctx.dateLocale, { month: '2-digit', day: '2-digit' });
		case 'status':
			return key === 'settled' ? ctx.t('settle.chartStatusSettled') : ctx.t('settle.chartStatusUnsettled');
	}
}

function resolveColor(key: string, dimension: ChartDimension, ctx: LabelContext): string {
	switch (dimension) {
		case 'category':
			return CATEGORY_CHART_COLORS[getBillCategoryTone(key)] ?? CATEGORY_CHART_COLORS.none;
		case 'payer':
		case 'owed': {
			if (key === '__none__' || key === '__unknown__') return '#94a3b8';
			const index = ctx.memberOrder.get(key) ?? 0;
			return MEMBER_CHART_COLORS[index % MEMBER_CHART_COLORS.length];
		}
		case 'date': {
			let hash = 0;
			for (let i = 0; i < key.length; i += 1) hash += key.charCodeAt(i);
			return MEMBER_CHART_COLORS[hash % MEMBER_CHART_COLORS.length];
		}
		case 'status':
			return STATUS_COLORS[key] ?? STATUS_COLORS.unsettled;
	}
}

export function buildNestedChartData(
	trip: Trip,
	outerDim: ChartDimension,
	innerDim: ChartDimension,
	selectedCurrency: string,
	rates: Record<string, number>,
	ctx: LabelContext,
): ChartSlice[] {
	const memberNames = new Map(trip.members.map((member) => [member.id, member.name]));
	const memberOrder = new Map(trip.members.map((member, index) => [member.id, index]));
	const labelCtx: LabelContext = { ...ctx, memberNames, memberOrder };

	const nested = new Map<string, Map<string, number>>();

	trip.bills.forEach((bill) => {
		if (bill.status === 'SETTLED') return;
		expandBill(bill, selectedCurrency, rates, ctx.settledFlowPairs).forEach((row) => {
			const outerKey = rowDimensionKey(row, outerDim);
			const innerKey = rowDimensionKey(row, innerDim);
			const outerMap = nested.get(outerKey) ?? new Map<string, number>();
			outerMap.set(innerKey, (outerMap.get(innerKey) ?? 0) + row.amount);
			nested.set(outerKey, outerMap);
		});
	});

	return Array.from(nested.entries())
		.map(([outerKey, innerMap]) => {
			const segments = Array.from(innerMap.entries())
				.map(([innerKey, amount]) => ({
					key: innerKey,
					label: resolveLabel(innerKey, innerDim, labelCtx),
					color: resolveColor(innerKey, innerDim, labelCtx),
					amount,
				}))
				.filter((segment) => segment.amount > 0)
				.sort((a, b) => b.amount - a.amount);

			const total = segments.reduce((sum, segment) => sum + segment.amount, 0);
			if (total <= 0) return null;

			return {
				key: outerKey,
				label: resolveLabel(outerKey, outerDim, labelCtx),
				color: resolveColor(outerKey, outerDim, labelCtx),
				total,
				segments,
			};
		})
		.filter((slice): slice is ChartSlice => slice !== null)
		.sort((a, b) => b.total - a.total);
}

export function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
	const rad = ((angleDeg - 90) * Math.PI) / 180;
	return {
		x: cx + radius * Math.cos(rad),
		y: cy + radius * Math.sin(rad),
	};
}

export function describeDonutArc(cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number) {
	const span = Math.min(endAngle - startAngle, 359.999);
	const end = startAngle + span;
	const startOuter = polarToCartesian(cx, cy, outerR, startAngle);
	const endOuter = polarToCartesian(cx, cy, outerR, end);
	const startInner = polarToCartesian(cx, cy, innerR, end);
	const endInner = polarToCartesian(cx, cy, innerR, startAngle);
	const largeArc = span <= 180 ? 0 : 1;

	return [
		`M ${startOuter.x} ${startOuter.y}`,
		`A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
		`L ${startInner.x} ${startInner.y}`,
		`A ${innerR} ${innerR} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
		'Z',
	].join(' ');
}
