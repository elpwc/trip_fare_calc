'use client';

import { useMemo, useState } from 'react';
import { AvatarBadge } from '@/src/components/AvatarBadge';

type Person = {
  id: string;
  name: string;
  avatar?: string;
};

type Bill = {
  id: string;
  payer: string;
  amount: number;
  owed: string[];
  title: string;
  type: string;
  status: string;
  tripId: string;
};

type Trip = {
  id: string;
  name: string;
  people: Person[];
};

const trips: Trip[] = [
  {
    id: 'trip-001',
    name: '西安 / 成都 6日游',
    people: [
      { id: 'p1', name: '小安', avatar: '安' },
      { id: 'p2', name: 'Mia', avatar: 'M' },
      { id: 'p3', name: 'Leo', avatar: 'L' },
      { id: 'p4', name: 'Jenny', avatar: 'J' },
    ],
  },
  {
    id: 'trip-002',
    name: '东京美食行',
    people: [
      { id: 'p5', name: '阿豪', avatar: '豪' },
      { id: 'p6', name: 'Nora', avatar: 'N' },
      { id: 'p7', name: 'Tom', avatar: 'T' },
    ],
  },
];

const bills: Bill[] = [
  {
    id: 'b1',
    payer: '小安',
    amount: 238,
    owed: ['Mia', 'Leo'],
    title: '川菜合餐',
    type: '饭',
    status: '待结算',
    tripId: 'trip-001',
  },
  {
    id: 'b2',
    payer: 'Leo',
    amount: 1280,
    owed: ['小安', 'Jenny'],
    title: '民宿房费',
    type: '房费',
    status: '已结算',
    tripId: 'trip-001',
  },
  {
    id: 'b3',
    payer: 'Mia',
    amount: 420,
    owed: ['小安', 'Leo', 'Jenny'],
    title: '网红茶咖',
    type: '饭',
    status: '待结算',
    tripId: 'trip-001',
  },
];

export default function HomePage() {
  const [selectedTripId, setSelectedTripId] = useState(trips[0].id);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTripName, setNewTripName] = useState('');

  const currentTrip = useMemo(
    () => trips.find((trip) => trip.id === selectedTripId) ?? trips[0],
    [selectedTripId]
  );

  const currentBills = useMemo(
    () => bills.filter((bill) => bill.tripId === selectedTripId),
    [selectedTripId]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-245 mx-auto px-4 pb-28 pt-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              setSelectedTripId(
                trips[(trips.findIndex((item) => item.id === selectedTripId) + 1) % trips.length].id
              )
            }
            className="min-w-0 flex-1 rounded-3xl border border-slate-200 bg-white/95 px-4 py-3 text-left shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-base font-semibold">{currentTrip.name}</p>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                ▾
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">点击切换旅行</p>
          </button>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-sky-600 text-white shadow-lg transition hover:bg-sky-500"
            aria-label="新建旅行"
          >
            <span className="text-2xl font-bold leading-none">+</span>
          </button>
        </header>

        <section className="mt-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">参与者</p>
          </div>

          <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
            {currentTrip.people.map((person) => (
              <div key={person.id} className="flex min-w-16 flex-col items-center gap-2 text-center">
                <AvatarBadge label={person.name} avatar={person.avatar} size="md" />
                <p className="max-w-18 truncate text-xs text-slate-700 dark:text-slate-300">{person.name}</p>
              </div>
            ))}

            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-lg font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label="添加成员"
            >
              +
            </button>
          </div>
        </section>

        <section className="mt-2 pb-24">
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-3">付钱人</th>
                    <th className="px-3 py-3">金额</th>
                    <th className="px-3 py-3">欠钱人</th>
                    <th className="px-3 py-3">名称</th>
                    <th className="px-3 py-3">类型</th>
                    <th className="px-3 py-3">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBills.map((bill, index) => (
                    <tr
                      key={bill.id}
                      className={`border-b ${index === currentBills.length - 1 ? '' : 'border-slate-200'} dark:border-slate-800`}
                    >
                      <td className="px-3">
                        <AvatarBadge
                          label={bill.payer}
                          avatar={currentTrip.people.find((person) => person.name === bill.payer)?.avatar}
                          size="sm"
                        />
                      </td>
                      <td className="px-3 py-1 font-semibold text-slate-900 dark:text-slate-100">¥{bill.amount}</td>
                      <td className="px-3 py-1">
                        <div className="flex flex-wrap items-center gap-1">
                          {bill.owed.slice(0, 4).map((name) => (
                            <AvatarBadge
                              key={name}
                              label={name}
                              avatar={currentTrip.people.find((person) => person.name === name)?.avatar}
                              size="sm"
                              className="border border-white dark:border-slate-950"
                            />
                          ))}
                          {bill.owed.length > 4 ? (
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              +{bill.owed.length - 4}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-1 text-slate-700 dark:text-slate-300">{bill.title}</td>
                      <td className="px-3 py-1">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {bill.type}
                        </span>
                      </td>
                      <td className="px-3 py-1">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                            bill.status === '已结算'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed right-4 bottom-24 z-20 flex items-center gap-2 rounded-3xl bg-slate-950/95 p-2 shadow-xl shadow-slate-900/20 backdrop-blur dark:bg-slate-900/95">
        <button
          type="button"
          className="rounded-3xl bg-emerald-600 px-4 py-3 text-xs font-semibold text-white shadow-xl shadow-emerald-600/20 transition hover:bg-emerald-500"
        >
          结算
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        >
          <span className="text-base leading-none">+</span>
          添加
        </button>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">新建旅行</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">快速创建新的旅行账单空间</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full bg-slate-100 px-3 py-2 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                关闭
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                旅行名称
                <input
                  value={newTripName}
                  onChange={(event) => setNewTripName(event.target.value)}
                  placeholder="例如：上海美食周"
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newTripName.trim()) return;
                  setModalOpen(false);
                  setNewTripName('');
                }}
                className="rounded-3xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
