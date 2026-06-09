'use client';

import BillMap from './BillMap';
import { Trip } from '@/src/types';
import { usePreferences } from '@/src/utils/preferences-provider';
import type { Locale } from '@/src/utils/preferences/constants';

type TripHistoryCardProps = {
  trip: Trip;
  onClick: () => void;
};

const DATE_LOCALE_MAP: Record<Locale, string> = {
  'zh-CN': 'zh-CN',
  en: 'en-US',
  ja: 'ja-JP',
};

export default function TripHistoryCard({ trip, onClick }: TripHistoryCardProps) {
  const { t, locale } = usePreferences();
  const dateLocale = DATE_LOCALE_MAP[locale];

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('common.unknown');
    return new Date(dateString).toLocaleDateString(dateLocale, { month: '2-digit', day: '2-digit', year: '2-digit' });
  };

  const totalExpense = trip.bills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
  const displayDate = trip.startDate || trip.createdAt;
  const participantNames = trip.members.map((member) => member.name).join('·') || '-';

  return (
    <button type="button" onClick={onClick} className="app-panel w-full text-left transition hover:-translate-y-px">
      <div className="grid grid-cols-[1fr_140px] gap-2 p-2">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold leading-tight">{trip.name}</p>
            {!trip.isOwner ? <span className="app-tag app-tag-share shrink-0">{t('common.share')}</span> : null}
          </div>
          <p className="settings-mono mt-1 text-[10px] leading-relaxed text-app-muted">
            {t('history.tripMeta', { date: formatDate(displayDate), count: trip.bills.length, amount: totalExpense.toFixed(0) })}
          </p>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-app-muted">{participantNames}</p>
        </div>
        <div className="h-[110px] overflow-hidden border border-[#1a1814]/20">
          <BillMap bills={trip.bills} className="h-full w-full" interactive={false} tileLayer="osm" />
        </div>
      </div>
    </button>
  );
}
