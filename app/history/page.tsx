'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TripHistoryCard from '@/src/components/TripHistoryCard';
import { getAuthHeaders } from '@/src/utils/auth';
import { Trip } from '@/src/types';

const filterOptions = [
  { value: 'all', label: '全部' },
  { value: '7d', label: '最近7天' },
  { value: '30d', label: '最近30天' },
  { value: 'year', label: '今年' },
] as const;

type FilterOption = (typeof filterOptions)[number]['value'];

const formatDate = (dateString?: string) => {
  if (!dateString) return '未知日期';
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export default function HistoryPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<FilterOption>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setTrips(data);
      }
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTrips = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    const now = new Date();
    const cutoff = (() => {
      if (filterPeriod === '7d') {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        return d;
      }
      if (filterPeriod === '30d') {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return d;
      }
      if (filterPeriod === 'year') {
        return new Date(now.getFullYear(), 0, 1);
      }
      return null;
    })();

    return trips.filter((trip) => {
      if (keyword) {
        const nameMatched = trip.name.toLowerCase().includes(keyword);
        const memberMatched = trip.members.some((member) => member.name.toLowerCase().includes(keyword));
        if (!nameMatched && !memberMatched) {
          return false;
        }
      }

      if (!cutoff) {
        return true;
      }

      const date = new Date(trip.startDate || trip.createdAt);
      return date >= cutoff;
    });
  }, [trips, searchText, filterPeriod]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">旅行历史</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilterPeriod(option.value)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  filterPeriod === option.value
                    ? 'bg-slate-900 text-white shadow-lg dark:bg-slate-200 dark:text-slate-950'
                    : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="按名称或参与者搜索"
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">共 {filteredTrips.length} 条</span>
            <button
              type="button"
              onClick={() => setSearchText('')}
              className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              清除
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              加载中...
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              未找到匹配的历史旅行。
            </div>
          ) : (
            filteredTrips.map((trip) => (
              <TripHistoryCard key={trip.id} trip={trip} onClick={() => router.push(`/?tripId=${trip.id}`)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
