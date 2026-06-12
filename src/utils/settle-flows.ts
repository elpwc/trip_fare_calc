import type { Bill, FlowItem } from '@/src/types';
import { buildBillShareRows, roundMoney } from '@/src/utils/bill-split';

const MONEY_EPSILON = 0.015;

export type SettledTransfer = {
	fromId: string;
	toId: string;
	amount: number;
};

type BuildSettleFlowsOptions = {
	bills: Bill[];
	memberNames: Map<string, string>;
	selectedCurrency: string;
	rates: Record<string, number>;
	settledTransfers?: SettledTransfer[];
};

export type ShareEntryDetail = {
	billId: string;
	billName: string;
	billCurrency: string;
	payerId: string;
	payerName: string;
	owedId: string;
	owedName: string;
	shareAmount: number;
	convertedAmount: number;
	isSelfShare: boolean;
};

export type BillContributionDetail = {
	billId: string;
	billName: string;
	billAmount: number;
	billCurrency: string;
	payerId: string;
	payerName: string;
	entries: ShareEntryDetail[];
};

export type PairwiseDebtDetail = {
	fromId: string;
	fromName: string;
	toId: string;
	toName: string;
	amount: number;
	originalTotals: { currency: string; amount: number }[];
};

export type MemberBalanceDetail = {
	memberId: string;
	memberName: string;
	receivable: number;
	payable: number;
	netBalance: number;
};

export type SettledAdjustmentDetail = {
	fromId: string;
	fromName: string;
	toId: string;
	toName: string;
	amount: number;
};

export type MinimizeStepDetail = {
	stepIndex: number;
	fromId: string;
	fromName: string;
	toId: string;
	toName: string;
	amount: number;
	debtorRemaining: number;
	creditorRemaining: number;
};

export type SettleCalculationDetail = {
	selectedCurrency: string;
	billContributions: BillContributionDetail[];
	pairwiseDebts: PairwiseDebtDetail[];
	grossBalances: MemberBalanceDetail[];
	settledAdjustments: SettledAdjustmentDetail[];
	netBalances: MemberBalanceDetail[];
	minimizeSteps: MinimizeStepDetail[];
	rawPairwiseCount: number;
	finalTransferCount: number;
	flows: FlowItem[];
};

function convertAmount(amount: number, billCurrency: string, selectedCurrency: string, rates: Record<string, number>): number {
	if (billCurrency === selectedCurrency) return amount;
	const rate = rates[billCurrency];
	if (!rate) return 0;
	return amount / rate;
}

function getName(memberNames: Map<string, string>, memberId: string): string {
	return memberNames.get(memberId) || '?';
}

function applyShareRow(
	balances: Map<string, number>,
	receivableByMember: Map<string, number>,
	payableByMember: Map<string, number>,
	originalTotalsByDebtor: Map<string, Record<string, number>>,
	owedId: string,
	payerId: string,
	shareAmount: number,
	billCurrency: string,
	selectedCurrency: string,
	rates: Record<string, number>,
) {
	const convertedShare = convertAmount(shareAmount, billCurrency, selectedCurrency, rates);
	if (convertedShare <= 0) return;

	balances.set(owedId, roundMoney((balances.get(owedId) ?? 0) - convertedShare));
	balances.set(payerId, roundMoney((balances.get(payerId) ?? 0) + convertedShare));

	if (owedId !== payerId) {
		receivableByMember.set(payerId, roundMoney((receivableByMember.get(payerId) ?? 0) + convertedShare));
		payableByMember.set(owedId, roundMoney((payableByMember.get(owedId) ?? 0) + convertedShare));
	}

	const debtorTotals = originalTotalsByDebtor.get(owedId) ?? {};
	debtorTotals[billCurrency] = roundMoney((debtorTotals[billCurrency] ?? 0) + shareAmount);
	originalTotalsByDebtor.set(owedId, debtorTotals);
}

function applySettledTransfers(balances: Map<string, number>, settledTransfers: SettledTransfer[]) {
	for (const settled of settledTransfers) {
		const amount = roundMoney(settled.amount);
		if (amount <= 0) continue;
		balances.set(settled.fromId, roundMoney((balances.get(settled.fromId) ?? 0) + amount));
		balances.set(settled.toId, roundMoney((balances.get(settled.toId) ?? 0) - amount));
	}
}

type TransferDraft = {
	fromId: string;
	toId: string;
	amount: number;
};

function buildMemberBalances(
	balances: Map<string, number>,
	receivableByMember: Map<string, number>,
	payableByMember: Map<string, number>,
	memberNames: Map<string, string>,
): MemberBalanceDetail[] {
	const memberIds = new Set<string>([...balances.keys(), ...receivableByMember.keys(), ...payableByMember.keys()]);

	return [...memberIds]
		.map((memberId) => {
			const netBalance = roundMoney(balances.get(memberId) ?? 0);
			if (Math.abs(netBalance) <= MONEY_EPSILON && (receivableByMember.get(memberId) ?? 0) === 0 && (payableByMember.get(memberId) ?? 0) === 0) {
				return null;
			}
			return {
				memberId,
				memberName: getName(memberNames, memberId),
				receivable: roundMoney(receivableByMember.get(memberId) ?? 0),
				payable: roundMoney(payableByMember.get(memberId) ?? 0),
				netBalance,
			};
		})
		.filter((entry): entry is MemberBalanceDetail => entry !== null)
		.sort((a, b) => b.netBalance - a.netBalance);
}

function buildPairwiseDebts(shareEntries: ShareEntryDetail[], memberNames: Map<string, string>): PairwiseDebtDetail[] {
	type PairBucket = { amount: number; originalTotals: Record<string, number> };
	const pairMap = new Map<string, PairBucket>();

	for (const entry of shareEntries) {
		if (entry.isSelfShare) continue;
		const key = `${entry.owedId}|${entry.payerId}`;
		const bucket = pairMap.get(key) ?? { amount: 0, originalTotals: {} };
		bucket.amount = roundMoney(bucket.amount + entry.convertedAmount);
		bucket.originalTotals[entry.billCurrency] = roundMoney((bucket.originalTotals[entry.billCurrency] ?? 0) + entry.shareAmount);
		pairMap.set(key, bucket);
	}

	return [...pairMap.entries()]
		.map(([key, bucket]) => {
			const [fromId, toId] = key.split('|');
			return {
				fromId,
				fromName: getName(memberNames, fromId),
				toId,
				toName: getName(memberNames, toId),
				amount: bucket.amount,
				originalTotals: Object.entries(bucket.originalTotals).map(([currency, amount]) => ({ currency, amount })),
			};
		})
		.filter((entry) => entry.amount > MONEY_EPSILON)
		.sort((a, b) => b.amount - a.amount);
}

function minimizeTransfersWithSteps(
	balances: Map<string, number>,
	memberNames: Map<string, string>,
): { transfers: TransferDraft[]; steps: MinimizeStepDetail[] } {
	type BalanceNode = { userId: string; balance: number };

	const creditors: BalanceNode[] = [];
	const debtors: BalanceNode[] = [];

	for (const [userId, balance] of balances) {
		const rounded = roundMoney(balance);
		if (Math.abs(rounded) <= MONEY_EPSILON) continue;
		if (rounded > 0) creditors.push({ userId, balance: rounded });
		else debtors.push({ userId, balance: rounded });
	}

	creditors.sort((a, b) => b.balance - a.balance);
	debtors.sort((a, b) => a.balance - b.balance);

	const transfers: TransferDraft[] = [];
	const steps: MinimizeStepDetail[] = [];
	let creditorIndex = 0;
	let debtorIndex = 0;
	let stepIndex = 0;

	while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
		const creditor = creditors[creditorIndex];
		const debtor = debtors[debtorIndex];
		const amount = roundMoney(Math.min(creditor.balance, -debtor.balance));
		if (amount <= MONEY_EPSILON) break;

		stepIndex += 1;
		transfers.push({
			fromId: debtor.userId,
			toId: creditor.userId,
			amount,
		});

		creditor.balance = roundMoney(creditor.balance - amount);
		debtor.balance = roundMoney(debtor.balance + amount);

		steps.push({
			stepIndex,
			fromId: debtor.userId,
			fromName: getName(memberNames, debtor.userId),
			toId: creditor.userId,
			toName: getName(memberNames, creditor.userId),
			amount,
			debtorRemaining: Math.abs(debtor.balance) <= MONEY_EPSILON ? 0 : roundMoney(-debtor.balance),
			creditorRemaining: Math.abs(creditor.balance) <= MONEY_EPSILON ? 0 : roundMoney(creditor.balance),
		});

		if (Math.abs(creditor.balance) <= MONEY_EPSILON) creditorIndex += 1;
		if (Math.abs(debtor.balance) <= MONEY_EPSILON) debtorIndex += 1;
	}

	return { transfers, steps };
}

export function buildSettleCalculationDetail({
	bills,
	memberNames,
	selectedCurrency,
	rates,
	settledTransfers = [],
}: BuildSettleFlowsOptions): SettleCalculationDetail {
	const grossBalancesMap = new Map<string, number>();
	const receivableByMember = new Map<string, number>();
	const payableByMember = new Map<string, number>();
	const originalTotalsByDebtor = new Map<string, Record<string, number>>();
	const billContributions: BillContributionDetail[] = [];
	const shareEntries: ShareEntryDetail[] = [];

	for (const bill of bills) {
		if (bill.status === 'SETTLED') continue;
		const billCurrency = bill.currency || 'CNY';
		const entries: ShareEntryDetail[] = [];

		for (const { owedId, payerId, shareAmount } of buildBillShareRows(bill)) {
			const convertedAmount = convertAmount(shareAmount, billCurrency, selectedCurrency, rates);
			const entry: ShareEntryDetail = {
				billId: bill.id,
				billName: bill.name || bill.description || bill.category || bill.id,
				billCurrency,
				payerId,
				payerName: getName(memberNames, payerId),
				owedId,
				owedName: getName(memberNames, owedId),
				shareAmount,
				convertedAmount,
				isSelfShare: owedId === payerId,
			};
			entries.push(entry);
			shareEntries.push(entry);
			applyShareRow(
				grossBalancesMap,
				receivableByMember,
				payableByMember,
				originalTotalsByDebtor,
				owedId,
				payerId,
				shareAmount,
				billCurrency,
				selectedCurrency,
				rates,
			);
		}

		billContributions.push({
			billId: bill.id,
			billName: bill.name || bill.description || bill.category || bill.id,
			billAmount: bill.amount,
			billCurrency,
			payerId: bill.payerId,
			payerName: getName(memberNames, bill.payerId),
			entries,
		});
	}

	const pairwiseDebts = buildPairwiseDebts(shareEntries, memberNames);
	const grossBalances = buildMemberBalances(grossBalancesMap, receivableByMember, payableByMember, memberNames);

	const netBalancesMap = new Map(grossBalancesMap);
	applySettledTransfers(netBalancesMap, settledTransfers);

	const settledAdjustments: SettledAdjustmentDetail[] = settledTransfers
		.filter((entry) => roundMoney(entry.amount) > 0)
		.map((entry) => ({
			fromId: entry.fromId,
			fromName: getName(memberNames, entry.fromId),
			toId: entry.toId,
			toName: getName(memberNames, entry.toId),
			amount: roundMoney(entry.amount),
		}));

	const netReceivable = new Map(receivableByMember);
	const netPayable = new Map(payableByMember);
	for (const settled of settledAdjustments) {
		netReceivable.set(settled.toId, roundMoney(Math.max(0, (netReceivable.get(settled.toId) ?? 0) - settled.amount)));
		netPayable.set(settled.fromId, roundMoney(Math.max(0, (netPayable.get(settled.fromId) ?? 0) - settled.amount)));
	}

	const netBalances = buildMemberBalances(netBalancesMap, netReceivable, netPayable, memberNames);
	const { transfers, steps } = minimizeTransfersWithSteps(netBalancesMap, memberNames);
	const createdAt = new Date().toISOString();

	const flows: FlowItem[] = transfers
		.map((transfer) => ({
			id: `${transfer.fromId}|${transfer.toId}`,
			fromId: transfer.fromId,
			toId: transfer.toId,
			fromName: getName(memberNames, transfer.fromId),
			toName: getName(memberNames, transfer.toId),
			amount: transfer.amount,
			currency: selectedCurrency,
			originalTotals: Object.entries(originalTotalsByDebtor.get(transfer.fromId) ?? {}).map(([currency, amount]) => ({
				currency,
				amount,
			})),
			createdAt,
		}))
		.sort((a, b) => b.amount - a.amount);

	return {
		selectedCurrency,
		billContributions,
		pairwiseDebts,
		grossBalances,
		settledAdjustments,
		netBalances,
		minimizeSteps: steps,
		rawPairwiseCount: pairwiseDebts.length,
		finalTransferCount: flows.length,
		flows,
	};
}

export function buildMinimizedSettleFlows(options: BuildSettleFlowsOptions): FlowItem[] {
	return buildSettleCalculationDetail(options).flows;
}
