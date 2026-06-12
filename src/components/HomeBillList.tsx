'use client';

import { useMemo, useState } from 'react';
import FriendIcon from '@/src/components/FriendIcon';
import { Bill, TripMember } from '@/src/types';
import { CURRENCY_DEFINITIONS } from '@/src/utils/currencies';
import { BILL_CATEGORY_KEYS, getBillCategoryLabelKey } from '@/src/utils/bill-category';
import { usePreferences } from '@/src/utils/preferences-provider';

type SortField = 'payer' | 'amount' | 'name' | 'time' | 'status';
type SortDirection = 'asc' | 'desc';
type BillSort = { field: SortField; direction: SortDirection };

const DEFAULT_SORT: BillSort = { field: 'time', direction: 'desc' };

type StatusFilter = 'all' | 'settled' | 'unsettled';

type BillFilters = {
	search: string;
	category: string;
	payerId: string;
	owedFriendId: string;
	dateFrom: string;
	dateTo: string;
	amountMin: string;
	amountMax: string;
	status: StatusFilter;
};

const EMPTY_FILTERS: BillFilters = {
	search: '',
	category: '',
	payerId: '',
	owedFriendId: '',
	dateFrom: '',
	dateTo: '',
	amountMin: '',
	amountMax: '',
	status: 'all',
};

function defaultSortDirection(field: SortField): SortDirection {
	return field === 'time' || field === 'amount' ? 'desc' : 'asc';
}

function compareBills(a: Bill, b: Bill, sort: BillSort, memberMap: Map<string, TripMember>, locale: string): number {
	let cmp = 0;

	switch (sort.field) {
		case 'payer': {
			const nameA = memberMap.get(a.payerId)?.name || '';
			const nameB = memberMap.get(b.payerId)?.name || '';
			cmp = nameA.localeCompare(nameB, locale);
			break;
		}
		case 'amount':
			cmp = a.amount - b.amount;
			break;
		case 'name':
			cmp = (a.name || '').localeCompare(b.name || '', locale);
			break;
		case 'time':
			cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			break;
		case 'status': {
			const settledA = a.status === 'SETTLED' ? 1 : 0;
			const settledB = b.status === 'SETTLED' ? 1 : 0;
			cmp = settledA - settledB;
			break;
		}
	}

	return sort.direction === 'asc' ? cmp : -cmp;
}

type SortableThProps = {
	field: SortField;
	label: string;
	sort: BillSort;
	onSort: (field: SortField) => void;
};

function SortableTh({ field, label, sort, onSort }: SortableThProps) {
	const isActive = sort.field === field;
	const indicator = isActive ? (sort.direction === 'asc' ? '↑' : '↓') : '−';

	return (
		<th scope="col" aria-sort={isActive ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
			<button type="button" className="app-bill-sort-btn" onClick={() => onSort(field)}>
				<span className="app-bill-sort-label">{label}</span>
				<span className={`app-bill-sort-indicator ${isActive ? 'is-active' : ''}`} aria-hidden>
					{indicator}
				</span>
			</button>
		</th>
	);
}

type HomeBillListProps = {
	bills: Bill[];
	members: TripMember[];
	onBillClick: (bill: Bill) => void;
	dateLocale: string;
	currentUserId?: string;
};

function hasActiveFilters(filters: BillFilters): boolean {
	return (
		Boolean(filters.search.trim()) ||
		Boolean(filters.category) ||
		Boolean(filters.payerId) ||
		Boolean(filters.owedFriendId) ||
		Boolean(filters.dateFrom) ||
		Boolean(filters.dateTo) ||
		Boolean(filters.amountMin) ||
		Boolean(filters.amountMax) ||
		filters.status !== 'all'
	);
}

export default function HomeBillList({ bills, members, onBillClick, dateLocale, currentUserId }: HomeBillListProps) {
	const { t } = usePreferences();
	const [sort, setSort] = useState<BillSort>(DEFAULT_SORT);
	const [filters, setFilters] = useState<BillFilters>(EMPTY_FILTERS);
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

	const categoriesInTrip = useMemo(() => {
		const set = new Set(bills.map((b) => b.category));
		return BILL_CATEGORY_KEYS.filter((key) => set.has(key));
	}, [bills]);

	const filteredBills = useMemo(() => {
		const search = filters.search.trim().toLowerCase();
		const min = filters.amountMin ? Number(filters.amountMin) : null;
		const max = filters.amountMax ? Number(filters.amountMax) : null;
		const fromTs = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).getTime() : null;
		const toTs = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999`).getTime() : null;
		const amountRangeInvalid =
			min !== null && max !== null && !Number.isNaN(min) && !Number.isNaN(max) && min > max;

		if (amountRangeInvalid) {
			return [];
		}

		const result = bills.filter((bill) => {
			if (search && !bill.name.toLowerCase().includes(search) && !bill.category.toLowerCase().includes(search)) {
				return false;
			}
			if (filters.category && bill.category !== filters.category) return false;
			if (filters.payerId && bill.payerId !== filters.payerId) return false;
			if (filters.owedFriendId && !bill.owedFriends.some((o) => o.friendId === filters.owedFriendId)) return false;
			if (filters.status === 'settled' && bill.status !== 'SETTLED') return false;
			if (filters.status === 'unsettled' && bill.status === 'SETTLED') return false;
			if (min !== null && !Number.isNaN(min) && bill.amount < min) return false;
			if (max !== null && !Number.isNaN(max) && bill.amount > max) return false;
			if (fromTs !== null || toTs !== null) {
				const ts = new Date(bill.createdAt).getTime();
				if (fromTs !== null && ts < fromTs) return false;
				if (toTs !== null && ts > toTs) return false;
			}
			return true;
		});

		result.sort((a, b) => compareBills(a, b, sort, memberMap, dateLocale));

		return result;
	}, [bills, filters, sort, memberMap, dateLocale]);

	const handleSort = (field: SortField) => {
		setSort((prev) => {
			if (prev.field !== field) {
				return { field, direction: defaultSortDirection(field) };
			}
			return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
		});
	};

	const filterActive = hasActiveFilters(filters);

	const amountRangeInvalid = useMemo(() => {
		const min = filters.amountMin ? Number(filters.amountMin) : null;
		const max = filters.amountMax ? Number(filters.amountMax) : null;
		return min !== null && max !== null && !Number.isNaN(min) && !Number.isNaN(max) && min > max;
	}, [filters.amountMin, filters.amountMax]);

	const updateFilter = <K extends keyof BillFilters>(key: K, value: BillFilters[K]) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const resetFilters = () => setFilters(EMPTY_FILTERS);

	const formatTime = (dateString: string) =>
		new Date(dateString).toLocaleDateString(dateLocale, {
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		});

	if (bills.length === 0) {
		return <p className="app-bill-empty">{t('home.noBills')}</p>;
	}

	return (
		<>
			<div className="app-bill-toolbar">
				<div className="app-bill-toolbar-primary">
					<input
						type="search"
						value={filters.search}
						onChange={(e) => updateFilter('search', e.target.value)}
						placeholder={t('home.billSearch')}
						className="app-bill-search settings-input w-full py-2 text-sm"
					/>
					<div className="app-bill-toolbar-actions">
						<button
							type="button"
							onClick={() => setIsFilterOpen((v) => !v)}
							className={`app-toolbar-chip px-3 py-1.5 flex gap-1 text-xs ${filterActive || isFilterOpen ? 'app-toolbar-chip-active' : ''}`}
						>
							<span>
								<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
									<path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2z" />
								</svg>
							</span>
							<span>
								{t('home.billFilter')}
								{filterActive ? ' ·' : ''}
							</span>
						</button>
						<span className="app-bill-count settings-mono">{t('home.billShowing', { count: filteredBills.length, total: bills.length })}</span>
					</div>
				</div>

				{isFilterOpen ? (
					<div className="app-bill-filters">
						<div className="app-bill-filter-group">
							<label className="app-bill-filter-field">
								<span className="app-label">{t('home.billFilterCategory')}</span>
								<select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} className="app-bill-filter-input">
									<option value="">{t('home.billFilterAll')}</option>
									{categoriesInTrip.map((cat) => (
										<option key={cat} value={cat}>
											{t(getBillCategoryLabelKey(cat))}
										</option>
									))}
								</select>
							</label>
							<label className="app-bill-filter-field">
								<span className="app-label">{t('home.billFilterStatus')}</span>
								<select value={filters.status} onChange={(e) => updateFilter('status', e.target.value as StatusFilter)} className="app-bill-filter-input">
									<option value="all">{t('home.billFilterAll')}</option>
									<option value="unsettled">{t('home.billFilterUnsettled')}</option>
									<option value="settled">{t('home.billFilterSettled')}</option>
								</select>
							</label>
							<label className="app-bill-filter-field">
								<span className="app-label">{t('home.billFilterPayer')}</span>
								<select value={filters.payerId} onChange={(e) => updateFilter('payerId', e.target.value)} className="app-bill-filter-input">
									<option value="">{t('home.billFilterAll')}</option>
									{members.map((m) => (
										<option key={m.id} value={m.id}>
											{m.name}
										</option>
									))}
								</select>
							</label>
							<label className="app-bill-filter-field">
								<span className="app-label">{t('home.billFilterOwed')}</span>
								<select value={filters.owedFriendId} onChange={(e) => updateFilter('owedFriendId', e.target.value)} className="app-bill-filter-input">
									<option value="">{t('home.billFilterAll')}</option>
									{members.map((m) => (
										<option key={m.id} value={m.id}>
											{m.name}
										</option>
									))}
								</select>
							</label>
						</div>

						<div className="app-bill-filter-group">
							<label className="app-bill-filter-field">
								<span className="app-label">{t('home.billFilterDateFrom')}</span>
								<input type="date" value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} className="app-bill-filter-input" />
							</label>
							<label className="app-bill-filter-field">
								<span className="app-label">{t('home.billFilterDateTo')}</span>
								<input type="date" value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} className="app-bill-filter-input" />
							</label>
							<label className="app-bill-filter-field">
								<span className="app-label">{t('home.billFilterAmountMin')}</span>
								<input
									type="number"
									inputMode="decimal"
									value={filters.amountMin}
									onChange={(e) => updateFilter('amountMin', e.target.value)}
									className="app-bill-filter-input"
									min={0}
									placeholder="0"
								/>
							</label>
							<label className="app-bill-filter-field">
								<span className="app-label">{t('home.billFilterAmountMax')}</span>
								<input
									type="number"
									inputMode="decimal"
									value={filters.amountMax}
									onChange={(e) => updateFilter('amountMax', e.target.value)}
									className="app-bill-filter-input"
									min={0}
									placeholder="∞"
								/>
							</label>
						</div>

						{amountRangeInvalid ? <p className="modal-message modal-message-error text-[11px]">{t('home.billFilterAmountRangeInvalid')}</p> : null}

						{filterActive ? (
							<button type="button" onClick={resetFilters} className="app-bill-filter-reset app-toolbar-chip w-full py-2 text-xs">
								{t('home.billFilterReset')}
							</button>
						) : null}
					</div>
				) : null}
			</div>

			<div className="app-bill-table-wrap">
				<table className="app-bill-table">
					<thead>
						<tr>
							<SortableTh field="payer" label={t('table.payer')} sort={sort} onSort={handleSort} />
							<SortableTh field="amount" label={t('table.amountSplit')} sort={sort} onSort={handleSort} />
							<SortableTh field="name" label={t('table.item')} sort={sort} onSort={handleSort} />
							<SortableTh field="time" label={t('table.time')} sort={sort} onSort={handleSort} />
							<SortableTh field="status" label={t('table.status')} sort={sort} onSort={handleSort} />
						</tr>
					</thead>
					<tbody>
						{filteredBills.length === 0 ? (
							<tr>
								<td colSpan={5} className="app-bill-empty">
									{t('home.noBills')}
								</td>
							</tr>
						) : (
							filteredBills.map((bill) => {
								const payer = memberMap.get(bill.payerId);
								const currencySuffix = CURRENCY_DEFINITIONS[bill.currency || 'CNY']?.suffix || '¥';
								const isSettled = bill.status === 'SETTLED';

								return (
									<tr key={bill.id} onClick={() => onBillClick(bill)}>
										<td className="app-bill-cell-icon">
											<FriendIcon name={payer?.name || '?'} size="md" isSelf={payer?.isSelf} />
										</td>
										<td className="app-bill-amount-cell">
											<p className="app-amount">
												{bill.amount}
												{currencySuffix}
											</p>
											<div className="app-bill-owed-icons">
												{bill.owedFriends.slice(0, 6).map((owed) => {
													const member = memberMap.get(owed.friendId);
													return <FriendIcon key={owed.id} name={member?.name || '?'} size="sm" isSelf={member?.isSelf} />;
												})}
												{bill.owedFriends.length > 6 ? <span className="settings-mono text-[10px] text-app-muted">+{bill.owedFriends.length - 6}</span> : null}
											</div>
										</td>
										<td>
											<p className="app-bill-name">{bill.name || t(getBillCategoryLabelKey(bill.category))}</p>
											<span className="app-bill-cat-muted">{t(getBillCategoryLabelKey(bill.category))}</span>
										</td>
										<td>
											<span className="app-bill-time settings-mono">{formatTime(bill.createdAt)}</span>
											{bill.createdById && currentUserId && bill.createdById !== currentUserId && bill.createdByName ? (
												<p className="mt-0.5 text-[9px] leading-tight text-app-muted">{t('home.billAddedBy', { name: bill.createdByName })}</p>
											) : null}
										</td>
										<td>
											<span className={`app-tag ${isSettled ? 'app-tag-settled' : 'app-tag-open'}`}>{isSettled ? t('table.settledShort') : t('table.unsettledShort')}</span>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
		</>
	);
}
