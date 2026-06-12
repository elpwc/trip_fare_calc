'use client';

import { useMemo } from 'react';
import { formatAmount } from '@/src/utils/currencies';
import {
	CHART_DIMENSIONS,
	ChartDimension,
	ChartSlice,
	describeDonutArc,
	DIMENSION_I18N,
	polarToCartesian,
} from '@/src/utils/settle-chart';
import { usePreferences } from '@/src/utils/preferences-provider';

type SettleSpendingChartProps = {
	slices: ChartSlice[];
	outerDim: ChartDimension;
	innerDim: ChartDimension;
	onOuterDimChange: (dim: ChartDimension) => void;
	onInnerDimChange: (dim: ChartDimension) => void;
	currency: string;
};

const CX = 120;
const CY = 120;
const OUTER_R = 96;
const MID_R = 68;
const INNER_R = 36;

const OUTER_STROKE = 2.8;
const INNER_STROKE = 0.6;

function truncateChartLabel(label: string, maxLen: number): string {
	const trimmed = label.trim();
	if (trimmed.length <= maxLen) return trimmed;
	return `${trimmed.slice(0, Math.max(1, maxLen - 1))}…`;
}

function formatArcLabel(name: string, percent: number, maxNameLen: number): string {
	return `${truncateChartLabel(name, maxNameLen)} ${percent}%`;
}

export default function SettleSpendingChart({
	slices,
	outerDim,
	innerDim,
	onOuterDimChange,
	onInnerDimChange,
	currency,
}: SettleSpendingChartProps) {
	const { t } = usePreferences();

	const grandTotal = useMemo(() => slices.reduce((sum, slice) => sum + slice.total, 0), [slices]);

	const chart = useMemo(() => {
		if (grandTotal <= 0) {
			return {
				outerArcs: [] as Array<{ path: string; fill: string; title: string }>,
				innerArcs: [] as Array<{ path: string; fill: string; title: string; label?: string; labelX?: number; labelY?: number }>,
				outerLabels: [] as Array<{ x: number; y: number; text: string; title: string }>,
			};
		}

		const outerArcs: Array<{ path: string; fill: string; title: string }> = [];
		const innerArcs: Array<{ path: string; fill: string; title: string; label?: string; labelX?: number; labelY?: number }> = [];
		const outerLabels: Array<{ x: number; y: number; text: string; title: string }> = [];
		let cursor = 0;

		slices.forEach((slice) => {
			const outerSpan = (slice.total / grandTotal) * 360;
			const outerStart = cursor;
			const outerEnd = cursor + outerSpan;

			outerArcs.push({
				path: describeDonutArc(CX, CY, MID_R, OUTER_R, outerStart, outerEnd),
				fill: slice.color,
				title: `${slice.label} · ${formatAmount(slice.total, currency)}`,
			});

			const outerMid = (outerStart + outerEnd) / 2;
			const outerLabelPoint = polarToCartesian(CX, CY, OUTER_R + 16, outerMid);
			const outerPercent = Math.round((slice.total / grandTotal) * 100);
			if (outerSpan >= 14) {
				outerLabels.push({
					x: outerLabelPoint.x,
					y: outerLabelPoint.y,
					text: formatArcLabel(slice.label, outerPercent, 8),
					title: `${slice.label} · ${formatAmount(slice.total, currency)}`,
				});
			}

			let innerCursor = outerStart;
			slice.segments.forEach((segment) => {
				const innerSpan = (segment.amount / slice.total) * outerSpan;
				if (innerSpan <= 0.2) return;

				const start = innerCursor;
				const end = innerCursor + innerSpan;
				const mid = (start + end) / 2;
				const labelPoint = polarToCartesian(CX, CY, (INNER_R + MID_R) / 2, mid);
				const innerPercent = Math.round((segment.amount / slice.total) * 100);

				innerArcs.push({
					path: describeDonutArc(CX, CY, INNER_R, MID_R, start, end),
					fill: segment.color,
					title: `${slice.label} · ${segment.label} · ${formatAmount(segment.amount, currency)}`,
					label: innerSpan >= 14 && innerPercent >= 5 ? formatArcLabel(segment.label, innerPercent, 5) : undefined,
					labelX: labelPoint.x,
					labelY: labelPoint.y,
				});

				innerCursor = end;
			});

			cursor = outerEnd;
		});

		return { outerArcs, innerArcs, outerLabels };
	}, [slices, grandTotal, currency]);

	return (
		<section className="app-panel app-settle-chart-panel mt-2 overflow-hidden">
			<div className="app-settle-chart-head">
				<span className="app-label">{t('settle.chartTitle')}</span>
				<span className="app-inline-tip" title={t('settle.chartTotalHintTitle')}>
					{t('settle.chartTotalHint')}
				</span>
			</div>

			<div className="app-settle-chart-controls">
				<label className="app-settle-chart-control">
					<span className="app-label">{t('settle.chartOuterDim')}</span>
					<select value={outerDim} onChange={(e) => onOuterDimChange(e.target.value as ChartDimension)} className="app-bill-filter-input">
						{CHART_DIMENSIONS.map((dim) => (
							<option key={`outer-${dim}`} value={dim}>
								{t(DIMENSION_I18N[dim])}
							</option>
						))}
					</select>
				</label>
				<label className="app-settle-chart-control">
					<span className="app-label">{t('settle.chartInnerDim')}</span>
					<select value={innerDim} onChange={(e) => onInnerDimChange(e.target.value as ChartDimension)} className="app-bill-filter-input">
						{CHART_DIMENSIONS.map((dim) => (
							<option key={`inner-${dim}`} value={dim}>
								{t(DIMENSION_I18N[dim])}
							</option>
						))}
					</select>
				</label>
			</div>

			<div className="p-3">
				{grandTotal <= 0 ? (
					<p className="py-6 text-center text-[13px] text-app-muted">{t('settle.chartEmpty')}</p>
				) : (
					<>
						<div className="mx-auto max-w-[280px]">
							<svg viewBox="0 0 240 240" className="h-auto w-full" role="img" aria-label={t('settle.chartTitle')}>
								{chart.innerArcs.map((arc, index) => (
									<path
										key={`inner-${index}`}
										d={arc.path}
										fill={arc.fill}
										stroke="rgba(26, 24, 20, 0.15)"
										strokeWidth={INNER_STROKE}
										className="dark:stroke-[rgba(244,239,228,0.12)]"
									>
										<title>{arc.title}</title>
									</path>
								))}
								{chart.outerArcs.map((arc, index) => (
									<path
										key={`outer-${index}`}
										d={arc.path}
										fill={arc.fill}
										stroke="#1a1814"
										strokeWidth={OUTER_STROKE}
										className="dark:stroke-[#f4efe4]"
									>
										<title>{arc.title}</title>
									</path>
								))}
								{chart.innerArcs
									.filter((arc) => arc.label && arc.labelX !== undefined && arc.labelY !== undefined)
									.map((arc, index) => (
										<text
											key={`inner-label-${index}`}
											x={arc.labelX}
											y={arc.labelY}
											textAnchor="middle"
											dominantBaseline="middle"
											className="fill-[#1a1814] text-[6px] font-semibold dark:fill-[#f4efe4]"
											style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
										>
											<title>{arc.title}</title>
											{arc.label}
										</text>
									))}
								{chart.outerLabels.map((label, index) => (
									<text
										key={`outer-label-${index}`}
										x={label.x}
										y={label.y}
										textAnchor="middle"
										dominantBaseline="middle"
										className="fill-[#1a1814] text-[8px] font-semibold dark:fill-[#f4efe4]"
										style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
									>
										<title>{label.title}</title>
										{label.text}
									</text>
								))}
								<text
									x={CX}
									y={CY - 10}
									textAnchor="middle"
									className="fill-[#6b6458] text-[7px] dark:fill-[#a89f8f]"
									style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}
								>
									{t('settle.chartShareTotal')}
								</text>
								<text
									x={CX}
									y={CY + 4}
									textAnchor="middle"
									className="fill-[#1a1814] text-[11px] font-bold dark:fill-[#f4efe4]"
									style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
								>
									{formatAmount(grandTotal, currency)}
								</text>
								<text
									x={CX}
									y={CY + 18}
									textAnchor="middle"
									className="fill-[#6b6458] text-[7px] dark:fill-[#a89f8f]"
									style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}
								>
									{t(DIMENSION_I18N[outerDim])} / {t(DIMENSION_I18N[innerDim])}
								</text>
							</svg>
						</div>

						<ul className="mt-3 space-y-2">
							{slices.map((slice) => {
								const outerPercent = Math.round((slice.total / grandTotal) * 100);
								return (
									<li key={slice.key} className="app-settle-chart-legend">
										<div className="flex items-start justify-between gap-2">
											<p className="flex items-center gap-1.5 text-sm font-semibold">
												<span className="app-settle-chart-dot border-2 border-[#1a1814] dark:border-[#f4efe4]" style={{ background: slice.color }} aria-hidden />
												{slice.label}
											</p>
											<p className="settings-mono shrink-0 text-[11px] text-app-muted">
												{formatAmount(slice.total, currency)} · {outerPercent}%
											</p>
										</div>
										<div className="mt-1.5 flex flex-wrap gap-1.5">
											{slice.segments.map((segment) => (
												<span key={`${slice.key}-${segment.key}`} className="app-settle-chart-tag">
													<span className="app-settle-chart-dot" style={{ background: segment.color }} aria-hidden />
													{segment.label} {Math.round((segment.amount / slice.total) * 100)}%
												</span>
											))}
										</div>
									</li>
								);
							})}
						</ul>
					</>
				)}
			</div>
		</section>
	);
}
