import type { MessageKey } from '@/src/utils/i18n/messages';

export type GuideSection = {
	id: string;
	serial: string;
	titleKey: MessageKey;
	subtitleKey: MessageKey;
	noScreenshot?: boolean;
	screenshotSlot: string;
};

export const GUIDE_SECTIONS: GuideSection[] = [
	{
		id: 'overview',
		serial: '00',
		titleKey: 'guide.section.overview.title',
		subtitleKey: 'guide.section.overview.subtitle',
		noScreenshot: true,
		screenshotSlot: '',
	},
	{
		id: 'friends',
		serial: '01',
		titleKey: 'guide.section.friends.title',
		subtitleKey: 'guide.section.friends.subtitle',
		screenshotSlot: 'friends-add',
	},
	{
		id: 'trip',
		serial: '02',
		titleKey: 'guide.section.trip.title',
		subtitleKey: 'guide.section.trip.subtitle',
		screenshotSlot: 'trip-create',
	},
	{
		id: 'bill',
		serial: '03',
		titleKey: 'guide.section.bill.title',
		subtitleKey: 'guide.section.bill.subtitle',
		screenshotSlot: 'bill-add',
	},
	{
		id: 'share',
		serial: '04',
		titleKey: 'guide.section.share.title',
		subtitleKey: 'guide.section.share.subtitle',
		screenshotSlot: 'share-collab',
	},
	{
		id: 'settle',
		serial: '05',
		titleKey: 'guide.section.settle.title',
		subtitleKey: 'guide.section.settle.subtitle',
		screenshotSlot: 'settle-page',
	},
	{
		id: 'chart',
		serial: '06',
		titleKey: 'guide.section.chart.title',
		subtitleKey: 'guide.section.chart.subtitle',
		screenshotSlot: 'settle-chart',
	},
	{
		id: 'history',
		serial: '07',
		titleKey: 'guide.section.history.title',
		subtitleKey: 'guide.section.history.subtitle',
		screenshotSlot: 'history-page',
	},
];
