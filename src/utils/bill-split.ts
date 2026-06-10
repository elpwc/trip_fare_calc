import type { Bill, BillOwed } from '@/src/types';

export type OwedShareInput = {
	friendId: string;
	shareAmount: number;
	isCustomShare: boolean;
};

const MONEY_EPSILON = 0.015;

export function roundMoney(value: number): number {
	return Math.round(value * 100) / 100;
}

export function splitEvenly(total: number, count: number): number[] {
	if (count <= 0) return [];
	const base = roundMoney(total / count);
	const shares = Array.from({ length: count }, () => base);
	const sum = roundMoney(shares.reduce((acc, value) => acc + value, 0));
	const diff = roundMoney(total - sum);
	if (diff !== 0) {
		shares[shares.length - 1] = roundMoney(shares[shares.length - 1] + diff);
	}
	return shares;
}

export function recalculateAaShares(total: number, shares: OwedShareInput[]): OwedShareInput[] {
	if (shares.length === 0) return [];

	const safeTotal = roundMoney(Math.max(0, total));
	const customTotal = roundMoney(shares.filter((entry) => entry.isCustomShare).reduce((sum, entry) => sum + entry.shareAmount, 0));
	const aaEntries = shares.filter((entry) => !entry.isCustomShare);
	const remaining = roundMoney(Math.max(0, safeTotal - customTotal));
	const aaAmounts = splitEvenly(remaining, aaEntries.length);
	let aaIndex = 0;

	return shares.map((entry) => {
		if (entry.isCustomShare) return { ...entry, shareAmount: roundMoney(entry.shareAmount) };
		const shareAmount = aaAmounts[aaIndex] ?? 0;
		aaIndex += 1;
		return { ...entry, shareAmount, isCustomShare: false };
	});
}

export function resetAllToAa(total: number, friendIds: string[]): OwedShareInput[] {
	const amounts = splitEvenly(roundMoney(Math.max(0, total)), friendIds.length);
	return friendIds.map((friendId, index) => ({
		friendId,
		shareAmount: amounts[index] ?? 0,
		isCustomShare: false,
	}));
}

export function sharesTotal(shares: Pick<OwedShareInput, 'shareAmount'>[]): number {
	return roundMoney(shares.reduce((sum, entry) => sum + entry.shareAmount, 0));
}

export function isSharesBalanced(total: number, shares: Pick<OwedShareInput, 'shareAmount'>[]): boolean {
	return Math.abs(sharesTotal(shares) - roundMoney(total)) <= MONEY_EPSILON;
}

export function getOwedShareAmount(bill: Pick<Bill, 'amount' | 'owedFriends'>, owed: BillOwed): number {
	if (typeof owed.shareAmount === 'number' && owed.shareAmount > 0) {
		return roundMoney(owed.shareAmount);
	}

	const activeOwed = bill.owedFriends.filter((entry) => entry.friendId);
	if (activeOwed.length === 0) return 0;

	const storedTotal = roundMoney(activeOwed.reduce((sum, entry) => sum + (entry.shareAmount ?? 0), 0));
	if (storedTotal > 0 && Math.abs(storedTotal - roundMoney(bill.amount)) <= MONEY_EPSILON) {
		return roundMoney(owed.shareAmount ?? 0);
	}

	return roundMoney(bill.amount / activeOwed.length);
}

export function buildBillShareRows(bill: Bill): { owedId: string; payerId: string; shareAmount: number }[] {
	if (bill.status === 'SETTLED') return [];

	const payerId = bill.payerId;
	const owedFriends = bill.owedFriends.filter((entry) => entry.friendId);
	if (owedFriends.length === 0) return [];

	return owedFriends.map((owed) => ({
		owedId: owed.friendId,
		payerId,
		shareAmount: getOwedShareAmount(bill, owed),
	}));
}
