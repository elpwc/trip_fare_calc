'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { label: '一览', href: '/' },
  { label: '历史', href: '/history' },
  { label: '人物', href: '/people' },
  { label: '账户', href: '/user' },
];

export default function BottomMenu() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-3 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-245 items-center justify-between gap-1">
        {menuItems.map((item) => {
          const active =
            pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-3xl px-3 py-2 text-xs font-semibold transition ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {item.label[0]}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
