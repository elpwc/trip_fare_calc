'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/src/components/Modal';
import { formatAmount } from '@/src/utils/currencies';
import { usePreferences } from '@/src/utils/preferences-provider';
import type { SettleCalculationDetail, BillContributionDetail, MemberBalanceDetail } from '@/src/utils/settle-flows';

type Props = {
	isOpen: boolean;
	onClose: () => void;
	detail: SettleCalculationDetail | null;
};

const fadeUp = {
	hidden: { opacity: 0, y: 10 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease: 'easeOut' as const } },
};

function DetailStep({
	step,
	title,
	desc,
	formula,
	children,
	final,
}: {
	step: number;
	title: string;
	desc: string;
	formula?: string;
	children: ReactNode;
	final?: boolean;
}) {
	return (
		<motion.section initial="hidden" animate="visible" variants={fadeUp} className={`app-settle-detail-step${final ? ' app-settle-detail-step--final' : ''}`}>
			<div className="app-settle-detail-step-rail">
				<span className="app-settle-detail-step-num">{step}</span>
				{final ? null : <span className="app-settle-detail-step-line" aria-hidden />}
			</div>
			<div className="app-settle-detail-step-body">
				<h3 className="app-settle-detail-step-title">{title}</h3>
				<p className="app-settle-detail-step-desc">{desc}</p>
				{formula ? <div className="app-settle-detail-formula">{formula}</div> : null}
				{children}
			</div>
		</motion.section>
	);
}

function FlowRow({
	from,
	to,
	amount,
	currency,
	tone = 'default',
}: {
	from: string;
	to: string;
	amount: number;
	currency: string;
	tone?: 'default' | 'success' | 'danger';
}) {
	return (
		<div className={`app-settle-detail-flow app-settle-detail-flow--${tone}`}>
			<span className="app-settle-detail-flow-person">{from}</span>
			<span className="app-settle-detail-flow-mid" aria-hidden>
				<span className="app-settle-detail-flow-arrow">→</span>
				<span className="app-settle-detail-flow-amount">{formatAmount(amount, currency)}</span>
			</span>
			<span className="app-settle-detail-flow-person">{to}</span>
		</div>
	);
}

function BalanceGrid({
	balances,
	currency,
	t,
}: {
	balances: MemberBalanceDetail[];
	currency: string;
	t: ReturnType<typeof usePreferences>['t'];
}) {
	if (balances.length === 0) return null;

	return (
		<div className="app-settle-detail-balance-grid">
			{balances.map((entry) => {
				const positive = entry.netBalance > 0.015;
				const negative = entry.netBalance < -0.015;
				return (
					<div key={entry.memberId} className="app-settle-detail-balance-card">
						<p className="app-settle-detail-balance-name">{entry.memberName}</p>
						<dl className="app-settle-detail-balance-metrics">
							<div>
								<dt>{t('settle.detail.receivable')}</dt>
								<dd>{formatAmount(entry.receivable, currency)}</dd>
							</div>
							<div>
								<dt>{t('settle.detail.payable')}</dt>
								<dd>{formatAmount(entry.payable, currency)}</dd>
							</div>
							<div className={positive ? 'is-positive' : negative ? 'is-negative' : ''}>
								<dt>{t('settle.detail.netShort')}</dt>
								<dd>
									{positive ? '+' : ''}
									{formatAmount(entry.netBalance, currency)}
								</dd>
							</div>
						</dl>
					</div>
				);
			})}
		</div>
	);
}

function BillCard({
	bill,
	selectedCurrency,
	t,
}: {
	bill: BillContributionDetail;
	selectedCurrency: string;
	t: ReturnType<typeof usePreferences>['t'];
}) {
	return (
		<article className="app-settle-detail-bill">
			<header className="app-settle-detail-bill-head">
				<div className="app-settle-detail-bill-title">
					<strong>{bill.billName}</strong>
					<span className="app-settle-detail-bill-total">{formatAmount(bill.billAmount, bill.billCurrency)}</span>
				</div>
				<span className="app-settle-detail-bill-payer">
					{t('settle.detail.payer')} · {bill.payerName}
				</span>
			</header>
			<ul className="app-settle-detail-bill-rows">
				{bill.entries.map((entry) => (
					<li key={`${bill.billId}-${entry.owedId}`} className={entry.isSelfShare ? 'is-self' : ''}>
						<span className="app-settle-detail-bill-who">{entry.owedName}</span>
						<span className="app-settle-detail-bill-action">
							{entry.isSelfShare ? t('settle.detail.selfShare') : t('settle.detail.owesShort', { to: entry.payerName })}
						</span>
						<span className="app-settle-detail-bill-amt">{formatAmount(entry.shareAmount, entry.billCurrency)}</span>
						{entry.billCurrency !== selectedCurrency ? (
							<span className="app-settle-detail-bill-conv">
								{t('settle.detail.convertedNote', { amount: formatAmount(entry.convertedAmount, selectedCurrency) })}
							</span>
						) : null}
					</li>
				))}
			</ul>
		</article>
	);
}

export default function SettleCalculationModal({ isOpen, onClose, detail }: Props) {
	const { t } = usePreferences();

	if (!detail) return null;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={t('settle.detail.title')}
			showOkButton
			okText={t('common.close')}
			onOk={onClose}
			className="max-w-[560px]"
			bodyClassName="!px-3 !pb-4"
		>
			<div className="app-settle-detail">
				<p className="app-settle-detail-intro">{t('settle.detail.intro')}</p>

				<div className="app-settle-detail-summary">
					<div>
						<span className="app-settle-detail-summary-label">{t('settle.detail.summaryDirect')}</span>
						<strong>{detail.rawPairwiseCount}</strong>
					</div>
					<span className="app-settle-detail-summary-arrow" aria-hidden>
						→
					</span>
					<div>
						<span className="app-settle-detail-summary-label">{t('settle.detail.summaryFinal')}</span>
						<strong>{detail.finalTransferCount}</strong>
					</div>
				</div>

				<div className="app-settle-detail-timeline">
					<DetailStep step={1} title={t('settle.detail.step1Title')} desc={t('settle.detail.step1Desc')} formula={t('settle.detail.formulaShare')}>
						{detail.billContributions.length === 0 ? (
							<p className="app-settle-detail-empty">{t('settle.noFlows')}</p>
						) : (
							<div className="app-settle-detail-bill-stack">
								{detail.billContributions.map((bill) => (
									<BillCard key={bill.billId} bill={bill} selectedCurrency={detail.selectedCurrency} t={t} />
								))}
							</div>
						)}
					</DetailStep>

					<DetailStep step={2} title={t('settle.detail.step2Title')} desc={t('settle.detail.step2Desc')}>
						{detail.pairwiseDebts.length === 0 ? (
							<p className="app-settle-detail-empty">{t('settle.detail.noPairwise')}</p>
						) : (
							<div className="app-settle-detail-flow-stack">
								{detail.pairwiseDebts.map((pair) => (
									<FlowRow key={`${pair.fromId}|${pair.toId}`} from={pair.fromName} to={pair.toName} amount={pair.amount} currency={detail.selectedCurrency} />
								))}
							</div>
						)}
						<p className="app-settle-detail-footnote">{t('settle.detail.pairwiseCount', { count: detail.rawPairwiseCount })}</p>
					</DetailStep>

					<DetailStep step={3} title={t('settle.detail.step3Title')} desc={t('settle.detail.step3Desc')} formula={t('settle.detail.formulaNet')}>
						<BalanceGrid balances={detail.grossBalances} currency={detail.selectedCurrency} t={t} />
					</DetailStep>

					{detail.settledAdjustments.length > 0 ? (
						<DetailStep step={4} title={t('settle.detail.step4Title')} desc={t('settle.detail.step4Desc')}>
							<div className="app-settle-detail-flow-stack">
								{detail.settledAdjustments.map((item, index) => (
									<FlowRow
										key={`${item.fromId}-${item.toId}-${index}`}
										from={item.fromName}
										to={item.toName}
										amount={item.amount}
										currency={detail.selectedCurrency}
										tone="success"
									/>
								))}
							</div>
						</DetailStep>
					) : null}

					<DetailStep step={detail.settledAdjustments.length > 0 ? 5 : 4} title={t('settle.detail.step5Title')} desc={t('settle.detail.step5Desc')}>
						{detail.settledAdjustments.length > 0 ? <BalanceGrid balances={detail.netBalances} currency={detail.selectedCurrency} t={t} /> : null}
						{detail.minimizeSteps.length === 0 ? (
							<p className="app-settle-detail-empty">{t('settle.detail.netZero')}</p>
						) : (
							<ol className="app-settle-detail-match-list">
								{detail.minimizeSteps.map((step) => (
									<li key={step.stepIndex}>
										<span className="app-settle-detail-match-index">{step.stepIndex}</span>
										<div className="app-settle-detail-match-body">
											<FlowRow from={step.fromName} to={step.toName} amount={step.amount} currency={detail.selectedCurrency} tone="default" />
											<p className="app-settle-detail-match-sub">
												{t('settle.detail.debtorRemaining', {
													name: step.fromName,
													balance: formatAmount(step.debtorRemaining, detail.selectedCurrency),
												})}
												<span className="mx-1 opacity-40">·</span>
												{t('settle.detail.creditorRemaining', {
													name: step.toName,
													balance: formatAmount(step.creditorRemaining, detail.selectedCurrency),
												})}
											</p>
										</div>
									</li>
								))}
							</ol>
						)}
					</DetailStep>

					<DetailStep
						step={detail.settledAdjustments.length > 0 ? 6 : 5}
						title={t('settle.detail.step6Title')}
						desc={t('settle.detail.step6Desc', { raw: detail.rawPairwiseCount, final: detail.finalTransferCount })}
						final
					>
						{detail.flows.length === 0 ? (
							<p className="app-settle-detail-empty">{t('settle.detail.netZero')}</p>
						) : (
							<div className="app-settle-detail-final-stack">
								{detail.flows.map((flow) => (
									<FlowRow key={flow.id} from={flow.fromName} to={flow.toName} amount={flow.amount} currency={detail.selectedCurrency} tone="default" />
								))}
							</div>
						)}
					</DetailStep>
				</div>
			</div>
		</Modal>
	);
}
