'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/src/components/layout/AppShell';
import TripHistoryCard from '@/src/components/TripHistoryCard';
import { getAuthHeaders } from '@/src/utils/auth';
import { Trip } from '@/src/types';

const filterOptions = [
  { value: 'all', label: '全部' },
  { value: '7d', label: '7天' },
  { value: '30d', label: '30天' },
  { value: 'year', label: '今年' },
] as const;

type FilterOption = (typeof filterOptions)[number]['value'];

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
      const response = await fetch('/api/trips', { headers: getAuthHeaders() });
      if (response.ok) setTrips(await response.json());
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
      if (filterPeriod === 'year') return new Date(now.getFullYear(), 0, 1);
      return null;
    })();

    return trips.filter((trip) => {
      if (keyword) {
        const nameMatched = trip.name.toLowerCase().includes(keyword);
        const memberMatched = trip.members.some((member) => member.name.toLowerCase().includes(keyword));
        if (!nameMatched && !memberMatched) return false;
      }
      if (!cutoff) return true;
      return new Date(trip.startDate || trip.createdAt) >= cutoff;
    });
  }, [trips, searchText, filterPeriod]);

  return (
    <AppShell tight>
      <header className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="app-label">History</p>
          <h1 className="settings-display text-2xl leading-none">旅行历史</h1>
        </div>
        <span className="settings-mono text-[10px] text-[#6b6458]">共 {filteredTrips.length} 条</span>
      </header>

      <div className="mb-2 flex flex-wrap gap-1">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilterPeriod(option.value)}
            className={`app-toolbar-chip ${filterPeriod === option.value ? 'app-toolbar-chip-active' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mb-2 flex gap-1">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="名称 / 参与者"
          className="settings-input py-2 text-xs"
        />
        <button type="button" onClick={() => setSearchText('')} className="app-toolbar-chip shrink-0 px-2">
          清除
        </button>
      </div>

      <div className="space-y-1.5">
        {isLoading ? (
          <div className="app-empty">加载中...</div>
        ) : filteredTrips.length === 0 ? (
          <div className="app-empty">未找到匹配的历史旅行</div>
        ) : (
          filteredTrips.map((trip) => <TripHistoryCard key={trip.id} trip={trip} onClick={() => router.push(`/?tripId=${trip.id}`)} />)
        )}
      </div>
    </AppShell>
  );
}
