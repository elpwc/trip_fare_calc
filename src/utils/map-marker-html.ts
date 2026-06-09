import { getDisplayText } from '@/src/components/FriendIcon';

const FRIEND_TONE_STYLES = [
	{ bg: '#fde8d8', text: '#9a3412' },
	{ bg: '#ede9fe', text: '#5b21b6' },
	{ bg: '#cffafe', text: '#0e7490' },
	{ bg: '#fce7f3', text: '#9d174d' },
	{ bg: '#fef9c3', text: '#854d0e' },
	{ bg: '#e0e7ff', text: '#3730a3' },
	{ bg: '#ecfccb', text: '#3f6212' },
	{ bg: '#e2e8f0', text: '#475569' },
] as const;

function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function getToneStyle(name: string) {
	const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
	return FRIEND_TONE_STYLES[hash % FRIEND_TONE_STYLES.length];
}

export function buildFriendIconMarkerHtml(name: string, isSelf: boolean, selfLabel: string) {
	const tone = getToneStyle(name);
	const displayText = escapeHtml(getDisplayText(name));
	const selfBadge = isSelf
		? `<span style="position:absolute;right:-4px;bottom:-4px;min-width:14px;height:14px;padding:0 2px;border-radius:9999px;border:2px solid #1a1814;background:#e63946;color:#fffdf8;font-size:8px;font-weight:700;line-height:10px;text-align:center;">${escapeHtml(selfLabel)}</span>`
		: '';

	return `<div style="position:relative;display:inline-flex;width:32px;height:32px;align-items:center;justify-content:center;border:2px solid #1a1814;border-radius:2px;background:${tone.bg};color:${tone.text};font-size:10px;font-weight:700;font-family:ui-monospace,monospace;box-shadow:2px 2px 0 rgba(26,24,20,0.12);">${displayText}${selfBadge}</div>`;
}

export function buildBillMapMarkerHtml(billName: string, payerName: string, payerIsSelf: boolean, selfLabel: string) {
	const safeName = escapeHtml(billName);
	return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;width:max-content;max-width:88px;">
		${buildFriendIconMarkerHtml(payerName, payerIsSelf, selfLabel)}
		<span style="display:block;max-width:88px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:2px 6px;border:1px solid #1a1814;border-radius:4px;background:rgba(255,253,248,0.94);font-size:10px;font-weight:600;line-height:1.2;color:#1a1814;box-shadow:1px 1px 0 rgba(26,24,20,0.1);">${safeName}</span>
	</div>`;
}
