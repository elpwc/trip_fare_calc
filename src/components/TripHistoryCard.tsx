'use client';

import BillMap from './BillMap';
import { Trip } from '@/src/types';

type TripHistoryCardProps = {
  trip: Trip;
  onClick: () => void;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '未知日期';
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export default function TripHistoryCard({ trip, onClick }: TripHistoryCardProps) {
  const totalExpense = trip.bills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
  const displayDate = trip.startDate || trip.createdAt;
  const participantNames = trip.members.map((member) => member.name).join('、') || '暂无参与者';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="grid gap-0 md:grid-cols-[1.5fr_260px]">
        <div className="p-6">
          <p className="text-2xl font-semibold text-slate-950 dark:text-white">{trip.name}</p>
          <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">日期：</span>
              <span>{formatDate(displayDate)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">总支出：</span>
              <span>¥{totalExpense.toFixed(2)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">创建人：</span>
              <span>我</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">参与者：</span>
              <span>{participantNames}</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-950">
            <BillMap bills={trip.bills} className="h-full w-full" />
          </div>
        </div>
      </div>
    </button>
  );
}
